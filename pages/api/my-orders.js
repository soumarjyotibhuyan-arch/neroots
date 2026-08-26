import { getDB } from '../../lib/db';
import { checkRateLimit, sanitizeString } from '../../lib/security';

export default function handler(req, res) {
  // Anti-cache headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Rate Limiting (60 requests per minute)
  if (!checkRateLimit(req, res, { max: 60, windowMs: 60000, keyPrefix: 'my_orders_api' })) {
    return;
  }

  try {
    const cookieHeader = req.headers['cookie'] || '';
    let token = '';

    const authHeader = req.headers['authorization'];
    if (authHeader) {
      token = authHeader.replace(/^Bearer\s+/i, '').trim();
    } else if (cookieHeader.includes('pickle_session=')) {
      const match = cookieHeader.match(/pickle_session=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please sign in with Google.' });
    }

    const sessions = global._activeCustomerSessions;
    if (!sessions) {
      return res.status(401).json({ error: 'Session expired or not found. Please log in again.' });
    }

    const session = sessions.get(token);
    if (!session || Date.now() > session.expiresAt) {
      if (session) sessions.delete(token);
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    const userEmail = session.user?.email;
    if (!userEmail) {
      return res.status(400).json({ error: 'Invalid user email in session.' });
    }

    const cleanEmail = userEmail.toLowerCase().trim();
    const db = getDB();
    const allOrders = db.orders || [];

    // Filter orders matching the logged-in customer's email address
    const userOrders = allOrders.filter(
      o => (o.email && o.email.toLowerCase().trim() === cleanEmail) ||
           (o.googleEmail && o.googleEmail.toLowerCase().trim() === cleanEmail)
    );

    return res.status(200).json({ success: true, orders: userOrders });
  } catch (err) {
    console.error('Error fetching customer orders:', err);
    return res.status(500).json({ error: 'Internal server error fetching your orders.' });
  }
}
