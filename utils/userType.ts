/**
 * User Type Utility - detects if user is D2C (no org membership) vs B2B
 */

import { useUser } from '@clerk/clerk-react';
import { useMemo } from 'react';

/**
 * Check if user is D2C (Direct-to-Consumer) - no organization membership
 * @param orgId - Organization ID from auth context
 * @returns true if user is D2C (no org), false if B2B (has org)
 */
export function isD2CUser(orgId: string | null | undefined): boolean {
  return orgId === null || orgId === undefined;
}

/**
 * React hook to check if current user is D2C
 * @returns true if user is D2C, false if B2B
 */
export function useIsD2C(): boolean {
  const { user } = useUser();
  
  return useMemo(() => {
    if (!user) return false;
    
    // Check if user has any organization memberships
    const hasOrgMembership = user.organizationMemberships && user.organizationMemberships.length > 0;
    return !hasOrgMembership;
  }, [user]);
}
