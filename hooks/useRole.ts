/**
 * React hook for checking user roles and permissions
 * Uses Clerk organization context to determine user's role
 */

import { useOrganization, useOrganizationList, useUser } from '@clerk/clerk-react';
import { useMemo, useEffect } from 'react';

export interface RoleInfo {
  isSuperUser: boolean;
  isProfessor: boolean;
  isStudent: boolean;
  canCreateAssignments: boolean;
  organizationId: string | undefined;
  organizationName: string | undefined;
  role: string | undefined;
}

/**
 * Hook to get current user's role and permissions
 */
export function useRole(): RoleInfo {
  const { user } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { userMemberships, isLoaded: orgListLoaded, setActive } = useOrganizationList();

  // Auto-set first organization as active if none is active (for backend session token)
  useEffect(() => {
    if (orgLoaded && orgListLoaded && !organization && userMemberships?.data?.length > 0) {
      const firstMembership = userMemberships.data[0];
      if (firstMembership?.organization?.id) {
        setActive({ organization: firstMembership.organization.id }).catch((err) => {
          console.warn('[useRole] Failed to set active organization:', err);
        });
      }
    }
  }, [orgLoaded, orgListLoaded, organization, userMemberships, setActive]);

  return useMemo(() => {
    // Wait for user data to load
    if (!user) {
      return {
        isSuperUser: false,
        isProfessor: false,
        isStudent: false,
        canCreateAssignments: false,
        organizationId: undefined,
        organizationName: undefined,
        role: undefined,
      };
    }

    // PRIMARY METHOD: Get organization and role from user.organizationMemberships
    // This is the most reliable source as it comes directly from the user object
    const userOrgMemberships = (user as any)?.organizationMemberships || [];
    
    if (userOrgMemberships.length === 0) {
      // User is not in any organization
      return {
        isSuperUser: false,
        isProfessor: false,
        isStudent: false,
        canCreateAssignments: false,
        organizationId: undefined,
        organizationName: undefined,
        role: undefined,
      };
    }

    // Get the first organization membership (or active one if available)
    // Prefer active organization if available, otherwise use first
    let membership = userOrgMemberships.find(
      (m: any) => m.organization?.id === organization?.id
    ) || userOrgMemberships[0];

    const currentOrg = membership?.organization;
    const role = membership?.role;

    if (!currentOrg || !role) {
      return {
        isSuperUser: false,
        isProfessor: false,
        isStudent: false,
        canCreateAssignments: false,
        organizationId: undefined,
        organizationName: undefined,
        role: undefined,
      };
    }
    
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('[useRole] Debug:', {
        hasActiveOrganization: !!organization,
        activeOrgId: organization?.id,
        userOrgMembershipsCount: userOrgMemberships.length,
        currentOrgId: currentOrg.id,
        currentOrgName: currentOrg.name,
        extractedRole: role,
        allUserOrgMemberships: userOrgMemberships.map((m: any) => ({
          orgId: m.organization?.id,
          orgName: m.organization?.name,
          role: m.role
        }))
      });
    }
    
    // Check for superuser status from user metadata (primary method - gives cross-org access)
    const isSuperUserFromMetadata = user?.publicMetadata?.isSuperUser === true;
    
    // Determine role flags
    // Superuser can be: 1) From metadata (cross-org), 2) org:admin role in current org
    const isSuperUser = isSuperUserFromMetadata || role === 'org:admin';
    const isProfessor = role === 'org:professor';
    const isStudent = role === 'org:student';
    const canCreateAssignments = isSuperUser || isProfessor;

    return {
      isSuperUser,
      isProfessor,
      isStudent,
      canCreateAssignments,
      organizationId: currentOrg.id,
      organizationName: currentOrg.name,
      role,
    };
  }, [user, organization]);
}
