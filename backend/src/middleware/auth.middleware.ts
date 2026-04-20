/**
 * XSUAA Simulation — JWT Authentication & Authorization Middleware
 * Simulates SAP XSUAA scope-based access control
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AUTH_CONFIG, Role } from '../config/auth';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: Role;
    fullName: string;
  };
}

/**
 * Authenticate request using Bearer JWT token
 * Mirrors XSUAA token validation middleware
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required — no token provided' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, AUTH_CONFIG.jwtSecret) as any;
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      fullName: decoded.fullName,
    };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Authorize request based on XSUAA role scopes
 * Usage: authorize('Admin', 'Operator')
 */
export function authorize(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Insufficient scope — requires: ${roles.join(' or ')}`,
      });
      return;
    }
    next();
  };
}
