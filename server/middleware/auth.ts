/**
 * Authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, createClerkClient } from '@clerk/backend';

const clerkSecretKey = process.env.CLERK_SECRET_KEY || "";

// Create Clerk client for API calls
const clerkClient = createClerkClient({ secretKey: clerkSecretKey });

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
  if (!clerkSecretKey) {
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
    const sessionClaims = await verifyToken(token, { secretKey: clerkSecretKey });
    
    // Extract userId from session claims
    const userId = sessionClaims.sub; // 'sub' is the user ID in Clerk tokens
    req.userId = userId;
    
    // Extract organization role and ID from session claims (if org is active in Clerk)
    // When setActive() is called on frontend, Clerk updates token with org_id and org_role
    req.userRole = (sessionClaims as any).org_role || null;
    req.orgId = (sessionClaims as any).org_id || null;
    
    // If no active org in token, fetch user's organization memberships from Clerk API
    // This handles cases where user hasn't set an active org yet
    if (!req.orgId && userId) {
      try {
        const memberships = await clerkClient.users.getOrganizationMembershipList({
          userId,
        });
        
        // Collect all roles from all memberships
        req.userRoles = memberships.data.map((m) => m.role);
        
        // If user has no organization memberships, they are a D2C user
        if (memberships.data.length === 0) {
          req.orgId = null; // Explicitly set to null for D2C users
          req.userRole = null;
          req.userRoles = [];
        } else {
          // Set userRole to admin if they have it in any org (highest priority)
          if (req.userRoles.includes('org:admin')) {
            req.userRole = req.userRole || 'org:admin';
            // Set orgId from the first admin membership (or use active org if available)
            if (!req.orgId) {
              const adminMembership = memberships.data.find(m => m.role === 'org:admin');
              if (adminMembership) {
                req.orgId = adminMembership.organization.id;
              }
            }
          } else if (req.userRoles.includes('org:professor')) {
            req.userRole = req.userRole || 'org:professor';
            // Set orgId from the first professor membership (or use active org if available)
            if (!req.orgId) {
              const professorMembership = memberships.data.find(m => m.role === 'org:professor');
              if (professorMembership) {
                req.orgId = professorMembership.organization.id;
              }
            }
          } else if (req.userRoles.length > 0) {
            req.userRole = req.userRole || req.userRoles[0]; // Use first role
            // Set orgId from first membership (or use active org if available)
            if (!req.orgId) {
              req.orgId = memberships.data[0]?.organization.id || null;
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch user memberships:', err);
        // If error fetching memberships, assume D2C user (no org)
        req.orgId = null;
        req.userRole = null;
        req.userRoles = [];
      }
    } else {
      // If we have orgId and org_role in the token, skip Clerk API call for performance
      if (req.orgId != null && req.userRole != null) {
        req.userRoles = [req.userRole];
      } else if (userId && req.orgId != null) {
        // orgId in token but no role - fetch memberships to get role
        try {
          const memberships = await clerkClient.users.getOrganizationMembershipList({
            userId,
          });
          req.userRoles = memberships.data.map((m) => m.role);
          if (!req.userRole && req.userRoles.length > 0) {
            const activeMembership = memberships.data.find(m => m.organization.id === req.orgId);
            if (activeMembership) {
              req.userRole = activeMembership.role;
            } else if (req.userRoles.includes('org:admin')) {
              req.userRole = 'org:admin';
            } else if (req.userRoles.includes('org:professor')) {
              req.userRole = 'org:professor';
            } else {
              req.userRole = req.userRoles[0];
            }
          }
        } catch (err) {
          console.error('Failed to fetch user memberships:', err);
          req.userRoles = req.userRole ? [req.userRole] : [];
        }
      } else {
        req.orgId = req.orgId ?? null;
        req.userRoles = req.userRole ? [req.userRole] : [];
      }
    }
    
    // Ensure orgId is explicitly set (null for D2C users)
    if (req.orgId === undefined) {
      req.orgId = null;
    }
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development' && req.orgId) {
      console.debug(`[Auth] User ${userId} - OrgId: ${req.orgId}, Role: ${req.userRole}`);
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
 * Require app owner middleware
 * Gates routes to the single owner user identified by OWNER_USER_ID env var.
 * Use after requireAuth middleware.
 */
export function requireOwner(req: Request, res: Response, next: NextFunction) {
  const ownerId = process.env.OWNER_USER_ID;
  if (!ownerId || req.userId !== ownerId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
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
