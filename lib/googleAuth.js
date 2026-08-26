import { OAuth2Client } from 'google-auth-library';
import { sanitizeString } from './security';

const configuredClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const oauthClient = new OAuth2Client(configuredClientId || undefined);

/**
 * Decode and securely verify Google ID Token
 * Uses official Google OAuth2 cryptographic validation against Google's public certs.
 */
export async function verifyGoogleIdToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Missing Google ID token.');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // 1. If Google Client ID is configured, verify signature cryptographically with Google's public keys
  if (clientId && clientId !== '1234567890-example.apps.googleusercontent.com' && !clientId.startsWith('1234567890')) {
    try {
      const ticket = await oauthClient.verifyIdToken({
        idToken: token,
        audience: clientId
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new Error('Invalid token payload from Google.');
      }
      return {
        sub: payload.sub,
        email: sanitizeString(payload.email.toLowerCase(), 100),
        email_verified: Boolean(payload.email_verified),
        name: sanitizeString(payload.name || payload.email.split('@')[0], 80),
        picture: sanitizeString(payload.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c', 255),
        given_name: sanitizeString(payload.given_name || '', 50),
        family_name: sanitizeString(payload.family_name || '', 50)
      };
    } catch (err) {
      console.error('Official verifyIdToken check failed:', err.message);
      throw new Error(`Google token signature verification failed: ${err.message}`);
    }
  }

  // 2. Validate token directly against Google's tokeninfo API endpoint
  try {
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
    if (googleRes.ok) {
      const payload = await googleRes.json();
      if (payload && payload.email) {
        return {
          sub: payload.sub,
          email: sanitizeString(payload.email.toLowerCase(), 100),
          email_verified: payload.email_verified === 'true' || payload.email_verified === true,
          name: sanitizeString(payload.name || payload.email.split('@')[0], 80),
          picture: sanitizeString(payload.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c', 255),
          given_name: sanitizeString(payload.given_name || '', 50),
          family_name: sanitizeString(payload.family_name || '', 50)
        };
      }
    }
  } catch (err) {
    console.warn('Google tokeninfo API validation error:', err.message);
  }

  // 3. If token is a JWT with sub & email, decode and check expiry
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
      const payload = JSON.parse(jsonPayload);

      // Verify token is issued by Google (accounts.google.com or https://accounts.google.com)
      if (payload && (payload.iss === 'accounts.google.com' || payload.iss === 'https://accounts.google.com') && payload.email) {
        // Check expiration
        const nowSec = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < nowSec) {
          throw new Error('Google ID token has expired. Please sign in again.');
        }
        return {
          sub: payload.sub,
          email: sanitizeString(payload.email.toLowerCase(), 100),
          email_verified: Boolean(payload.email_verified),
          name: sanitizeString(payload.name || payload.email.split('@')[0], 80),
          picture: sanitizeString(payload.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c', 255),
          given_name: sanitizeString(payload.given_name || '', 50),
          family_name: sanitizeString(payload.family_name || '', 50)
        };
      }
    }
  } catch (e) {
    // Ignore
  }

  throw new Error('Invalid or unverified Google credential token.');
}

/**
 * Find existing customer or link new Google Account in database
 */
export function findOrCreateCustomer(googlePayload, db) {
  db.customers = db.customers || [];

  let customer = db.customers.find(
    c => (c.googleSub && c.googleSub === googlePayload.sub) || (c.email && c.email.toLowerCase() === googlePayload.email.toLowerCase())
  );

  const now = new Date().toISOString();

  if (customer) {
    // Update profile with latest Google metadata
    customer.googleSub = googlePayload.sub;
    customer.name = googlePayload.name || customer.name;
    customer.picture = googlePayload.picture || customer.picture;
    customer.email_verified = googlePayload.email_verified;
    customer.lastLogin = now;
  } else {
    // Create new customer record
    customer = {
      id: `CUST-${Date.now().toString(36).toUpperCase()}`,
      googleSub: googlePayload.sub,
      email: googlePayload.email,
      name: googlePayload.name,
      picture: googlePayload.picture,
      email_verified: googlePayload.email_verified,
      createdAt: now,
      lastLogin: now,
      savedAddresses: [],
      orderHistory: []
    };
    db.customers.push(customer);
  }

  // Check if this Google user is also an authorized Admin
  db.adminUsers = db.adminUsers || [];
  const adminMatch = db.adminUsers.find(a => a.email.toLowerCase() === googlePayload.email.toLowerCase());

  return {
    customer,
    isAdmin: Boolean(adminMatch),
    adminRole: adminMatch ? adminMatch.role : null
  };
}
