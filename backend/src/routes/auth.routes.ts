import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';
const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'aspecificdomain.in';

/**
 * POST /api/auth/google
 * Verifies Google ID Token and issues a JWT if the domain matches
 */
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    // Verify the Google ID Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token payload' });
    }

    const { email, name, picture, email_verified } = payload;

    // 1. Ensure email is verified by Google
    if (!email_verified) {
      return res.status(401).json({ error: 'Google email is not verified' });
    }

    // 2. Check if the email domain matches the requirement
    // Supports both exact domain (e.g. "example.com") and suffix (e.g. "@example.com")
    const domainSuffix = ALLOWED_DOMAIN.startsWith('@') ? ALLOWED_DOMAIN : `@${ALLOWED_DOMAIN}`;

    if (!email.toLowerCase().endsWith(domainSuffix.toLowerCase())) {
      console.warn(`Unauthorized login attempt from: ${email}`);
      return res.status(403).json({
        error: `Access restricted. You must use an account ending with ${domainSuffix}`
      });
    }

    // 3. Generate our own JWT for subsequent API calls
    const userPayload = {
      email,
      name,
      picture,
    };

    const sessionToken = jwt.sign(userPayload, JWT_SECRET, {
      expiresIn: '24h', // Token valid for 24 hours
    });

    res.json({
      token: sessionToken,
      user: userPayload
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

export default router;
