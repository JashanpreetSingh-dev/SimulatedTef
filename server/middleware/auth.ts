/**
 * Authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, createClerkClient } from '@clerk/backend';

// Use a function to get the secret key so it can be read dynamically in tests
function getClerkSecretKey(): string {
  return process.env.CLERK_SECRET_KEY || "";
}
const clerkSecretKey = getClerkSecretKey();

// Create Clerk client for API calls (will be recreated if secret key changes)
function getClerkClient() {
  return createClerkClient({ secretKey: getClerkSecretKey() });
}
const clerkClient = getClerkClient();

// Extend Express Request type to include user role
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      orgId?: string;
      userRoles?: string[]; // All roles from all org memberships
    }
  }
}

/**
 * Require authentication middleware
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Skip auth if CLERK_SECRET_KEY is not set (for development)
  const secretKey = getClerkSecretKey();
  if (!secretKey) {
    // In development, allow requests but warn
    req.userId = req.body.userId || req.params.userId || 'guest';
    req.userRole = 'org:professor'; // Default to professor in dev mode
    req.userRoles = ['org:professor'];
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
    const sessionClaims = await verifyToken(token, { secretKey });
    
    // Extract userId from session claims
    const userId = sessionClaims.sub; // 'sub' is the user ID in Clerk tokens
    req.userId = userId;
    
    // Extract organization role from session claims (if org is active)
    req.userRole = (sessionClaims as any).org_role || null;
    req.orgId = (sessionClaims as any).org_id || null;
    
    // If no active org role, fetch user's organization memberships from Clerk API
    if (!req.userRole && userId) {
      try {
        const client = getClerkClient();
        const memberships = await client.users.getOrganizationMembershipList({
          userId,
        });
        
        // Collect all roles from all memberships
        req.userRoles = memberships.data.map((m) => m.role);
        
        // Set userRole to professor if they have it in any org
        if (req.userRoles.includes('org:professor')) {
          req.userRole = 'org:professor';
          // Also set orgId from the professor membership
          const professorMembership = memberships.data.find(m => m.role === 'org:professor');
          if (professorMembership) {
            req.orgId = professorMembership.organization.id;
          }
        } else if (req.userRoles.length > 0) {
          req.userRole = req.userRoles[0]; // Use first role
          // Set orgId from first membership
          req.orgId = memberships.data[0]?.organization.id || null;
        }
      } catch (err) {
        console.error('Failed to fetch user memberships:', err);
        // Continue without role - will be blocked by requireRole if needed
      }
    } else {
      req.userRoles = req.userRole ? [req.userRole] : [];
    }
    
    next();
  } catch (error: any) {
    // Log full error in development, sanitized in production
    const errorMessage = error.message || 'Unknown error';
    if (process.env.NODE_ENV === 'development') {
      console.error('Authentication error:', errorMessage);
    } else {
      // In production, log without sensitive details
      console.error('Authentication error:', errorMessage.includes('expired') ? 'Token expired' : 'Invalid token');
    }
    
    // Return generic error message to avoid leaking sensitive information
    return res.status(401).json({ 
      error: 'Unauthorized: Invalid or expired token',
      // Only include detailed error in development
      ...(process.env.NODE_ENV === 'development' && { details: errorMessage })
    });
  }
}

/**
 * Require specific role middleware
 * Checks if user has any of the allowed roles (from active org or any membership)
 * Use after requireAuth middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user has any of the allowed roles
    const userRoles = req.userRoles || (req.userRole ? [req.userRole] : []);
    
    if (userRoles.length === 0) {
      return res.status(403).json({ error: 'Forbidden: No organization role found' });
    }
    
    const hasAllowedRole = userRoles.some(role => allowedRoles.includes(role));
    
    if (!hasAllowedRole) {
      return res.status(403).json({ 
        error: 'Forbidden: Insufficient permissions',
        required: allowedRoles,
        current: userRoles
      });
    }
    
    next();
  };
}
