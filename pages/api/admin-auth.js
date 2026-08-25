import { getDB, saveDB } from '../../lib/db';
import { verifyGoogleIdToken } from '../../lib/googleAuth';
import { sanitizeObject, sanitizeString, checkRateLimit, registerAdminSession, validateAdminRequest } from '../../lib/security';

export default async function handler(req, res) {
  // 1. Anti-Brute-Force Rate Limiting (Max 15 auth requests per minute)
  if (!checkRateLimit(req, res, { max: 15, windowMs: 60000, keyPrefix: 'admin_auth' })) {
    return;
  }

  const db = getDB();
  db.adminUsers = db.adminUsers || [];

  if (req.method === 'GET') {
    // Requires authenticated admin to list the full admin directory
    const adminUser = validateAdminRequest(req, res);
    if (!adminUser) return;

    return res.status(200).json({
      admins: db.adminUsers.map(u => ({
        email: u.email,
        name: u.name,
        role: u.role,
        avatar: u.avatar,
        addedAt: u.addedAt,
        isGoogleVerified: u.isGoogleVerified
      }))
    });
  }

  if (req.method === 'POST') {
    const sanitizedBody = sanitizeObject(req.body);
    const { action, credential, email, name, avatar } = sanitizedBody;

    // -------------------------------------------------------------
    // GOOGLE OAUTH / IDENTITY VERIFICATION
    // -------------------------------------------------------------
    if (action === 'google_login') {
      let userEmail = '';
      let userName = '';
      let userAvatar = '';

      try {
        if (credential || email) {
          const verified = await verifyGoogleIdToken(credential || email);
          userEmail = verified.email;
          userName = name || verified.name;
          userAvatar = avatar || verified.picture;
        } else {
          return res.status(400).json({ success: false, error: 'Google email or credential required' });
        }
      } catch (err) {
        return res.status(400).json({ success: false, error: err.message || 'Invalid Google credential token' });
      }

      // Check if user is in authorized admin list
      const matchedAdmin = db.adminUsers.find(u => u.email.toLowerCase() === userEmail.toLowerCase());

      // Fresh installation fallback: first Google user becomes the Owner
      if (!matchedAdmin && db.adminUsers.length === 0) {
        const newOwner = {
          email: userEmail,
          name: userName,
          role: 'Owner / Super Admin',
          avatar: userAvatar,
          addedAt: new Date().toISOString().split('T')[0],
          isGoogleVerified: true
        };
        db.adminUsers.push(newOwner);
        saveDB(db);

        const token = registerAdminSession(newOwner);
        return res.status(200).json({
          success: true,
          token,
          user: newOwner,
          message: 'Welcome! You have claimed ownership of this store as the first Admin.'
        });
      }

      if (!matchedAdmin) {
        return res.status(403).json({
          success: false,
          error: `Access Denied: The Google Account (${userEmail}) is not authorized as an Admin for this store.`,
          unauthorizedEmail: userEmail,
          help: 'Contact the store owner to add your Google email to the admin whitelist.'
        });
      }

      // Update avatar or name if newly provided
      if (userAvatar && userAvatar !== matchedAdmin.avatar) {
        matchedAdmin.avatar = userAvatar;
      }
      if (userName && userName !== matchedAdmin.name) {
        matchedAdmin.name = userName;
      }
      matchedAdmin.lastLogin = new Date().toISOString();
      saveDB(db);

      const token = registerAdminSession(matchedAdmin);
      return res.status(200).json({
        success: true,
        token,
        user: matchedAdmin,
        message: `Welcome back, ${matchedAdmin.name}! Signed in as verified ${matchedAdmin.role}.`
      });
    }

    // -------------------------------------------------------------
    // PROTECTED ADMIN ACTIONS: ADD / REMOVE ADMIN
    // -------------------------------------------------------------
    const authorizedAdmin = validateAdminRequest(req, res);
    if (!authorizedAdmin) return;

    if (action === 'add_admin') {
      const { newAdminEmail, newAdminName, newAdminRole } = sanitizedBody;
      if (!newAdminEmail) {
        return res.status(400).json({ success: false, error: 'Google email is required' });
      }

      const cleanEmail = sanitizeString(newAdminEmail, 100).toLowerCase();
      const existing = db.adminUsers.find(u => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return res.status(400).json({ success: false, error: 'This Google account is already authorized as an Admin' });
      }

      const newAdmin = {
        email: cleanEmail,
        name: sanitizeString(newAdminName || cleanEmail.split('@')[0], 80),
        role: sanitizeString(newAdminRole || 'Store Manager', 50),
        avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        addedAt: new Date().toISOString().split('T')[0],
        isGoogleVerified: true
      };

      db.adminUsers.push(newAdmin);
      saveDB(db);

      return res.status(201).json({
        success: true,
        admin: newAdmin,
        admins: db.adminUsers
      });
    }

    if (action === 'remove_admin') {
      const { targetEmail } = sanitizedBody;
      if (!targetEmail) {
        return res.status(400).json({ success: false, error: 'Target email required' });
      }

      const cleanTarget = sanitizeString(targetEmail, 100).toLowerCase();
      if (db.adminUsers.length <= 1) {
        return res.status(400).json({ success: false, error: 'Cannot remove the last remaining Admin account' });
      }

      db.adminUsers = db.adminUsers.filter(u => u.email.toLowerCase() !== cleanTarget);
      saveDB(db);

      return res.status(200).json({ success: true, admins: db.adminUsers });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
