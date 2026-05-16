import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    schoolId: string;
    role: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify JWT using Supabase secret
    // Note: User must add SUPABASE_JWT_SECRET to .env
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any;

    // 4. Zero-Trust Profile Retrieval
    // Derive institutional context EXCLUSIVELY from the database
    const profile = await prisma.profile.findUnique({
      where: { id: decoded.sub },
      select: { 
        id: true, 
        schoolId: true, 
        role: true,
        status: true // Ensure account is still active
      }
    });

    if (!profile || profile.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Access denied: Profile inactive or not found' });
      return;
    }

    // 5. Attach Immutable Context to Request
    req.user = {
      id: profile.id,
      schoolId: profile.schoolId,
      role: profile.role as any
    };

    next();
  } catch (error) {
    console.error('[AuthMiddleware] Verification failed:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};
