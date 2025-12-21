/**
 * Authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';

const clerkSecretKey = process.env.CLERK_SECRET_KEY || "";

/**
 * Require authentication middleware
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Skip auth if CLERK_SECRET_KEY is not set (for development)
  if (!clerkSecretKey) {
    // In development, allow requests but warn
    req.userId = req.body.userId || req.params.userId || 'guest';
    return next();
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Clerk
    const sessionClaims = await verifyToken(token, { secretKey: clerkSecretKey });
    
    // Extract userId from session claims
    req.userId = sessionClaims.sub; // 'sub' is the user ID in Clerk tokens
    next();
  } catch (error: any) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

