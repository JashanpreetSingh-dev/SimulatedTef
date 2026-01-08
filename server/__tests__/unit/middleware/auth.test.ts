/**
 * Unit tests for authentication middleware
 */

import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { createMockRequest, createMockResponse, createMockNext } from '../../helpers/testAuth';

// Mock Clerk first
const { mockVerifyToken, mockGetOrganizationMembershipList, mockCreateClerkClient } = vi.hoisted(() => {
  const mockGetOrgMembershipList = vi.fn();
  return {
    mockVerifyToken: vi.fn(),
    mockGetOrganizationMembershipList: mockGetOrgMembershipList,
    mockCreateClerkClient: vi.fn(() => ({
      users: {
        getOrganizationMembershipList: mockGetOrgMembershipList,
      },
    })),
  };
});

vi.mock('@clerk/backend', () => ({
  verifyToken: mockVerifyToken,
  createClerkClient: mockCreateClerkClient,
}));

// Set CLERK_SECRET_KEY and import after mocks
process.env.CLERK_SECRET_KEY = 'test_secret';
import { requireAuth, requireRole } from '../../../middleware/auth';

describe('auth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure CLERK_SECRET_KEY is set
    process.env.CLERK_SECRET_KEY = 'test_secret';
  });

  describe('requireAuth', () => {
    it('should authenticate user with valid token', async () => {
      mockVerifyToken.mockResolvedValueOnce({
        sub: 'user_123',
        org_role: 'org:professor',
        org_id: 'org_123',
      });

      const req = createMockRequest({
        headers: {
          authorization: 'Bearer valid_token',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await requireAuth(req as any, res as any, next);

      expect(req.userId).toBe('user_123');
      expect(req.userRole).toBe('org:professor');
      expect(req.orgId).toBe('org_123');
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 for missing token', async () => {
      const req = createMockRequest({
        headers: {},
      });
      const res = createMockResponse();
      const next = createMockNext();

      await requireAuth(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized: No token provided',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      mockVerifyToken.mockRejectedValueOnce(new Error('Invalid token'));

      const req = createMockRequest({
        headers: {
          authorization: 'Bearer invalid_token',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await requireAuth(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Unauthorized: Invalid or expired token',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should fetch organization memberships if no org role in token', async () => {
      mockVerifyToken.mockResolvedValueOnce({
        sub: 'user_123',
      });
      mockGetOrganizationMembershipList.mockResolvedValueOnce({
        data: [
          {
            role: 'org:professor',
            organization: { id: 'org_123' },
          },
        ],
      });

      const req = createMockRequest({
        headers: {
          authorization: 'Bearer valid_token',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      await requireAuth(req as any, res as any, next);

      expect(mockGetOrganizationMembershipList).toHaveBeenCalledWith({
        userId: 'user_123',
      });
      expect(req.userRole).toBe('org:professor');
      expect(next).toHaveBeenCalled();
    });

    it('should bypass auth in development when CLERK_SECRET_KEY not set', async () => {
      delete process.env.CLERK_SECRET_KEY;

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      await requireAuth(req as any, res as any, next);

      expect(req.userId).toBe('guest');
      expect(req.userRole).toBe('org:professor');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access with correct role', () => {
      const middleware = requireRole('org:professor');
      const req = createMockRequest({
        userRoles: ['org:professor'],
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access without required role', () => {
      const middleware = requireRole('org:professor');
      const req = createMockRequest({
        userRoles: ['org:student'],
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden: Insufficient permissions',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access with no roles', () => {
      const middleware = requireRole('org:professor');
      const req = createMockRequest({
        userRoles: [],
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden: No organization role found',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access if user has any of the allowed roles', () => {
      const middleware = requireRole('org:professor', 'org:admin');
      const req = createMockRequest({
        userRoles: ['org:student', 'org:professor'],
      });
      const res = createMockResponse();
      const next = createMockNext();

      middleware(req as any, res as any, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
