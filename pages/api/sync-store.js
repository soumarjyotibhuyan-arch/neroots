import { getDB, syncFullStoreState } from '../../lib/db';
import { checkRateLimit, validateAdminRequest, sanitizeObject } from '../../lib/security';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (!checkRateLimit(req, res, { max: 120, windowMs: 60000, keyPrefix: 'sync_store_api' })) {
    return;
  }

  // GET: Public or admin read of current synchronized store state
  if (req.method === 'GET') {
    const db = getDB();
    return res.status(200).json({
      success: true,
      timestamp: db.lastSyncedAt || Date.now(),
      productsCount: db.products?.length || 0,
      teamCount: db.team?.length || 0,
      reviewsCount: db.reviews?.length || 0,
      ordersCount: db.orders?.length || 0,
      adminCount: db.adminUsers?.length || 0,
      data: {
        products: db.products || [],
        team: db.team || [],
        companyStory: db.companyStory || {},
        reviews: db.reviews || [],
        adminUsers: (db.adminUsers || []).map(u => ({ email: u.email, name: u.name, role: u.role, avatar: u.avatar }))
      }
    });
  }

  // POST: Admin push of full store state to serverless runtime
  if (req.method === 'POST') {
    const adminUser = validateAdminRequest(req, res);
    if (!adminUser) return;

    try {
      const incomingState = sanitizeObject(req.body);
      const updatedDB = syncFullStoreState(incomingState);

      return res.status(200).json({
        success: true,
        message: 'Store state successfully synchronized across cloud runtime!',
        syncedBy: adminUser.email,
        timestamp: updatedDB.lastSyncedAt || Date.now(),
        productsCount: updatedDB.products?.length || 0,
        teamCount: updatedDB.team?.length || 0,
        reviewsCount: updatedDB.reviews?.length || 0
      });
    } catch (err) {
      console.error('Error syncing store state:', err);
      return res.status(500).json({ error: 'Failed to sync store state', details: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
