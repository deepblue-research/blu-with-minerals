import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';

export interface AuthRequest extends Request {
  user?: {
    email: string;
    name?: string;
    picture?: string;
  };
}

/**
 * Middleware to protect routes and verify JWT tokens.
 * Expects 'Authorization: Bearer <token>' header.
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Invalid token:', error);
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};
