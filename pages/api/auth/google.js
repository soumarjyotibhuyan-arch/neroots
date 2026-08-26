import { getDB, saveDB } from '../../../lib/db';
import { verifyGoogleIdToken, findOrCreateCustomer } from '../../../lib/googleAuth';
import { checkRateLimit, sanitizeObject, registerAdminSession, validateAdminRequest } from '../../../lib/security';

const activeCustomerSessions = global._activeCustomerSessions || (global._activeCustomerSessions = new Map());

export default async function handler(req, res) {
  // Anti-Brute Force Rate Limiting
  if (!checkRateLimit(req, res, { max: 30, windowMs: 60000, keyPrefix: 'google_auth' })) {
    return;
  }

  const db = getDB();

  // -------------------------------------------------------------
  // GET: CURRENT AUTHENTICATED CUSTOMER STATE
  // -------------------------------------------------------------
  if (req.method === 'GET') {
    const authHeader = req.headers['authorization'];
    const cookieHeader = req.headers['cookie'] || '';
    let token = '';

    if (authHeader) {
      token = authHeader.replace(/^Bearer\s+/i, '').trim();
    } else if (cookieHeader.includes('pickle_session=')) {
      const match = cookieHeader.match(/pickle_session=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) {
      return res.status(200).json({ isAuthenticated: false, user: null });
    }

    const session = activeCustomerSessions.get(token);
    if (!session || Date.now() > session.expiresAt) {
      if (session) activeCustomerSessions.delete(token);
      return res.status(200).json({ isAuthenticated: false, user: null });
    }

    return res.status(200).json({
      isAuthenticated: true,
      user: session.user,
      isAdmin: session.isAdmin,
      adminRole: session.adminRole
    });
  }

  // -------------------------------------------------------------
  // POST: SIGN IN / ONE-TAP GOOGLE AUTHENTICATION
  // -------------------------------------------------------------
  if (req.method === 'POST') {
    try {
      const sanitizedBody = sanitizeObject(req.body) || {};
      const { credential, profile } = sanitizedBody;

      let googleUser;
      if (credential) {
        googleUser = await verifyGoogleIdToken(credential);
      } else if (profile && profile.email) {
        const isVerified = profile.email_verified === true || profile.email_verified === 'true' || profile.email_verified === undefined || profile.verified_email === true || profile.verified_email === 'true';
        googleUser = {
          sub: profile.sub || profile.id || `google_${profile.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email: sanitizeString(profile.email.toLowerCase(), 100),
          email_verified: isVerified,
          name: sanitizeString(profile.name || profile.email.split('@')[0], 80),
          picture: sanitizeString(profile.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c', 255)
        };
      } else {
        return res.status(400).json({ success: false, error: 'Valid Google credential token required.' });
      }

      // Perform Account Linking in Database
      const { customer, isAdmin, adminRole } = findOrCreateCustomer(googleUser, db);
      saveDB(db);

      // Create Secure Session
      const sessionToken = `gsess_${Date.now()}_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
      const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7-day session

      const sessionUser = {
        id: customer.id,
        sub: customer.googleSub,
        email: customer.email,
        name: customer.name,
        picture: customer.picture,
        email_verified: customer.email_verified,
        savedAddresses: customer.savedAddresses || []
      };

      activeCustomerSessions.set(sessionToken, {
        user: sessionUser,
        isAdmin,
        adminRole,
        expiresAt
      });

      // Set Secure Cookie
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieString = `pickle_session=${sessionToken}; Path=/; Max-Age=${7 * 24 * 60 * 60}; HttpOnly; SameSite=Lax${isProduction ? '; Secure' : ''}`;
      res.setHeader('Set-Cookie', cookieString);

      return res.status(200).json({
        success: true,
        token: sessionToken,
        user: sessionUser,
        isAdmin,
        adminRole,
        message: `Welcome back, ${sessionUser.name}!`
      });
    } catch (err) {
      console.error('Google Auth Error:', err);
      return res.status(400).json({
        success: false,
        error: err.message || 'Failed to authenticate with Google.'
      });
    }
  }

  // -------------------------------------------------------------
  // DELETE: LOG OUT
  // -------------------------------------------------------------
  if (req.method === 'DELETE') {
    const cookieHeader = req.headers['cookie'] || '';
    if (cookieHeader.includes('pickle_session=')) {
      const match = cookieHeader.match(/pickle_session=([^;]+)/);
      if (match) activeCustomerSessions.delete(match[1]);
    }

    res.setHeader('Set-Cookie', 'pickle_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
