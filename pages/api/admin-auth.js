import { getDB, saveDB, syncAdminUsers } from '../../lib/db';
import { verifyGoogleIdToken } from '../../lib/googleAuth';
import {
  sanitizeObject,
  sanitizeString,
  checkRateLimit,
  registerAdminSession,
  validateAdminRequest,
  isAuthorizedAdminEmail
} from '../../lib/security';

export default async function handler(req, res) {
  // Anti-cache headers
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // 1. Anti-Brute-Force Rate Limiting (Max 30 auth requests per minute)
  if (!checkRateLimit(req, res, { max: 30, windowMs: 60000, keyPrefix: 'admin_auth' })) {
    return;
  }

  const db = getDB();
  syncAdminUsers(db);

  if (req.method === 'GET') {
    // Requires authenticated admin to list the full admin directory
    const adminUser = validateAdminRequest(req, res);
    if (!adminUser) return;

    return res.status(200).json({
      admins: (db.adminUsers || []).map(u => ({
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
    const sanitizedBody = sanitizeObject(req.body) || {};
    const { action, credential, email, name, avatar, clientAdminWhitelist } = sanitizedBody;

    // Merge any client-stored admin whitelist entries
    if (clientAdminWhitelist && Array.isArray(clientAdminWhitelist)) {
      for (const clientAdmin of clientAdminWhitelist) {
        if (clientAdmin && clientAdmin.email) {
          const cEmail = sanitizeString(clientAdmin.email.toLowerCase().trim(), 100);
          if (cEmail && !db.adminUsers.some(u => u.email.toLowerCase().trim() === cEmail)) {
            const addedObj = {
              email: cEmail,
              name: sanitizeString(clientAdmin.name || cEmail.split('@')[0], 80),
              role: sanitizeString(clientAdmin.role || 'Store Administrator', 50),
              avatar: clientAdmin.avatar || 'https://lh3.googleusercontent.com/a/default-user=s96-c',
              addedAt: clientAdmin.addedAt || new Date().toISOString().split('T')[0],
              isGoogleVerified: true
            };
            db.adminUsers.push(addedObj);
            if (typeof global !== 'undefined' && global._neroots_admin_whitelist) {
              global._neroots_admin_whitelist.set(cEmail, addedObj);
            }
          }
        }
      }
      saveDB(db);
    }

    // -------------------------------------------------------------
    // GOOGLE OAUTH / IDENTITY VERIFICATION & ADMIN LOGIN
    // -------------------------------------------------------------
    if (action === 'google_login') {
      let userEmail = '';
      let userName = '';
      let userAvatar = '';

      try {
        if (credential) {
          const verified = await verifyGoogleIdToken(credential);
          userEmail = verified.email.toLowerCase().trim();
          userName = name || verified.name;
          userAvatar = avatar || verified.picture;
        } else if (email) {
          userEmail = sanitizeString(email.toLowerCase().trim(), 100);
          userName = name || userEmail.split('@')[0];
          userAvatar = avatar || 'https://lh3.googleusercontent.com/a/default-user=s96-c';
        } else {
          return res.status(400).json({ success: false, error: 'Google email or credential required' });
        }
      } catch (err) {
        return res.status(400).json({ success: false, error: err.message || 'Invalid Google credential token' });
      }

      // Check if user is in authorized admin list or matches environment whitelist
      const isAuthorized = isAuthorizedAdminEmail(userEmail, db);
      let matchedAdmin = (db.adminUsers || []).find(u => u.email.toLowerCase().trim() === userEmail);

      // Fresh installation fallback: first Google user becomes the Owner
      if (!isAuthorized && !matchedAdmin && (db.adminUsers || []).length === 0) {
        const newOwner = {
          email: userEmail,
          name: userName,
          role: 'Owner / Super Admin',
          avatar: userAvatar,
          addedAt: new Date().toISOString().split('T')[0],
          isGoogleVerified: true
        };
        db.adminUsers.push(newOwner);
        if (typeof global !== 'undefined' && global._neroots_admin_whitelist) {
          global._neroots_admin_whitelist.set(userEmail, newOwner);
        }
        saveDB(db);

        const token = registerAdminSession(newOwner);
        return res.status(200).json({
          success: true,
          token,
          user: newOwner,
          message: 'Welcome! You have claimed ownership of this store as the first Admin.'
        });
      }

      if (!isAuthorized && !matchedAdmin) {
        return res.status(403).json({
          success: false,
          error: `Access Denied: The Google Account (${userEmail}) is not authorized as an Admin for this store.`,
          unauthorizedEmail: userEmail,
          help: 'Please ask an existing store owner to add your email address in Admin > Admins tab.'
        });
      }

      // If authorized via env/whitelist but not yet in db.adminUsers, create record
      if (!matchedAdmin) {
        matchedAdmin = {
          email: userEmail,
          name: userName || userEmail.split('@')[0],
          role: userEmail.includes('soumarjyoti') || userEmail.includes('utpala') ? 'Owner / Super Admin' : 'Store Administrator',
          avatar: userAvatar || 'https://lh3.googleusercontent.com/a/default-user=s96-c',
          addedAt: new Date().toISOString().split('T')[0],
          isGoogleVerified: true
        };
        db.adminUsers.push(matchedAdmin);
      }

      // Update avatar or name if newly provided
      if (userAvatar && userAvatar !== matchedAdmin.avatar) {
        matchedAdmin.avatar = userAvatar;
      }
      if (userName && userName !== matchedAdmin.name) {
        matchedAdmin.name = userName;
      }
      matchedAdmin.lastLogin = new Date().toISOString();

      if (typeof global !== 'undefined' && global._neroots_admin_whitelist) {
        global._neroots_admin_whitelist.set(userEmail, matchedAdmin);
      }
      saveDB(db);

      const token = registerAdminSession(matchedAdmin);
      return res.status(200).json({
        success: true,
        token,
        user: matchedAdmin,
        admins: db.adminUsers,
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

      const cleanEmail = sanitizeString(newAdminEmail, 100).toLowerCase().trim();
      const existing = db.adminUsers.find(u => u.email.toLowerCase().trim() === cleanEmail);
      if (existing) {
        return res.status(400).json({ success: false, error: 'This Google account is already authorized as an Admin' });
      }

      const newAdmin = {
        email: cleanEmail,
        name: sanitizeString(newAdminName || cleanEmail.split('@')[0], 80),
        role: sanitizeString(newAdminRole || 'Store Administrator', 50),
        avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        addedAt: new Date().toISOString().split('T')[0],
        isGoogleVerified: true
      };

      db.adminUsers.push(newAdmin);
      if (typeof global !== 'undefined' && global._neroots_admin_whitelist) {
        global._neroots_admin_whitelist.set(cleanEmail, newAdmin);
      }
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

      const cleanTarget = sanitizeString(targetEmail, 100).toLowerCase().trim();
      if (db.adminUsers.length <= 1) {
        return res.status(400).json({ success: false, error: 'Cannot remove the last remaining Admin account' });
      }

      db.adminUsers = db.adminUsers.filter(u => u.email.toLowerCase().trim() !== cleanTarget);
      if (typeof global !== 'undefined' && global._neroots_admin_whitelist) {
        global._neroots_admin_whitelist.delete(cleanTarget);
      }
      saveDB(db);

      return res.status(200).json({ success: true, admins: db.adminUsers });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
