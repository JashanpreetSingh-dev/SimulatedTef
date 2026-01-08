/**
 * Authentication testing utilities
 */

import { Request, Response, NextFunction } from 'express';
import { vi } from 'vitest';

/**
 * Mock Clerk authentication token
 */
export const MOCK_USER_ID = 'test_user_123';
export const MOCK_ORG_ID = 'test_org_123';
export const MOCK_USER_ROLE = 'org:professor';
export const MOCK_SUPER_USER_ID = 'test_super_user';

/**
 * Create a mock request with authentication
 */
export function createMockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    userId: MOCK_USER_ID,
    userRole: MOCK_USER_ROLE,
    orgId: MOCK_ORG_ID,
    userRoles: [MOCK_USER_ROLE],
    headers: {
      authorization: 'Bearer mock_token',
      ...overrides.headers,
    },
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as Partial<Request>;
}

/**
 * Create a mock response
 */
export function createMockResponse(): Partial<Response> {
  const res: any = {
    status: vi.fn(function(this: any, code?: number) {
      this.statusCode = code;
      return this;
    }),
    json: vi.fn(function(this: any, body?: any) {
      this.body = body;
      return this;
    }),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  };
  // Ensure status and json return the same object for chaining
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

/**
 * Create a mock next function
 */
export function createMockNext(): NextFunction {
  return vi.fn();
}

/**
 * Mock requireAuth middleware to bypass authentication
 */
export function mockRequireAuth(req: Request, res: Response, next: NextFunction) {
  req.userId = MOCK_USER_ID;
  req.userRole = MOCK_USER_ROLE;
  req.orgId = MOCK_ORG_ID;
  req.userRoles = [MOCK_USER_ROLE];
  next();
}

/**
 * Mock requireAuth middleware for super user
 */
export function mockRequireAuthSuperUser(req: Request, res: Response, next: NextFunction) {
  req.userId = MOCK_SUPER_USER_ID;
  req.userRole = MOCK_USER_ROLE;
  req.orgId = MOCK_ORG_ID;
  req.userRoles = [MOCK_USER_ROLE];
  next();
}

/**
 * Mock requireAuth middleware for unauthenticated user
 */
export function mockRequireAuthUnauthenticated(req: Request, res: Response, next: NextFunction) {
  // Don't set userId, simulating unauthenticated request
  next();
}
