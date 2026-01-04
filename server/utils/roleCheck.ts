/**
 * Role checking utilities for RBAC
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Check if user is a superuser
 * Superusers are identified by:
 * 1. User metadata: publicMetadata.isSuperUser = true (primary method - gives cross-org access)
 * 2. org:admin role in current org (secondary - org-scoped)
 * 3. SUPER_USER_ID env var (fallback for backward compatibility)
 */
export function isSuperUser(
  userId: string | undefined, 
  orgId: string | undefined, 
  role: string | undefined,
  isSuperUserFromMetadata?: boolean
): boolean {
  // Primary: Check user metadata (gives cross-org access)
  if (isSuperUserFromMetadata === true) {
    return true;
  }
  
  // Secondary: Check org:admin role in current org
  if (role === 'org:admin') {
    return true;
  }
  
  // Fallback: Check SUPER_USER_ID env var (deprecated but kept for backward compatibility)
  const superUserId = process.env.SUPER_USER_ID;
  if (superUserId && userId === superUserId) {
    return true;
  }
  
  return false;
}

/**
 * Check if user is a professor
 */
export function isProfessor(userId: string | undefined, orgId: string | undefined, role: string | undefined): boolean {
  return role === 'org:professor';
}

/**
 * Check if user is a student
 */
export function isStudent(userId: string | undefined, orgId: string | undefined, role: string | undefined): boolean {
  return role === 'org:student';
}

/**
 * Check if user can create assignments
 * Professors and superusers can create assignments
 */
export function canCreateAssignments(
  userId: string | undefined, 
  orgId: string | undefined, 
  role: string | undefined,
  isSuperUserFromMetadata?: boolean
): boolean {
  return isSuperUser(userId, orgId, role, isSuperUserFromMetadata) || isProfessor(userId, orgId, role);
}

/**
 * Middleware factory to require a specific role
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { userId, orgId, userRole, isSuperUser: isSuperUserFromMetadata } = req;
    
    // Check if user has one of the allowed roles
    if (userRole && allowedRoles.includes(userRole)) {
      return next();
    }
    
    // Check if user is superuser - superusers have access to everything
    if (isSuperUser(userId, orgId, userRole, isSuperUserFromMetadata)) {
      return next();
    }
    
    return res.status(403).json({ 
      error: 'Forbidden: Insufficient permissions',
      required: allowedRoles,
      current: userRole || 'none'
    });
  };
}

/**
 * Middleware to require assignment creation permissions
 */
export function requireAssignmentCreation(req: Request, res: Response, next: NextFunction) {
  const { userId, orgId, userRole, isSuperUser: isSuperUserFromMetadata } = req;
  
  if (canCreateAssignments(userId, orgId, userRole, isSuperUserFromMetadata)) {
    return next();
  }
  
  return res.status(403).json({ 
    error: 'Forbidden: Only professors and administrators can create assignments',
    current: userRole || 'none'
  });
}

/**
 * Check if user belongs to the same organization as the resource
 */
export function belongsToOrganization(userOrgId: string | undefined, resourceOrgId: string | undefined): boolean {
  // If user is not in an org, they can't access org-scoped resources
  if (!userOrgId) {
    return false;
  }
  
  // If resource has no org (legacy data), allow access
  if (!resourceOrgId) {
    return true;
  }
  
  return userOrgId === resourceOrgId;
}
