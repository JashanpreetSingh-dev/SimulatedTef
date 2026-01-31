/**
 * Admin API routes - organization-level access only
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Request, Response } from 'express';
import { conversationLogService } from '../services/conversationLogService';
import { voteAnalyticsService } from '../services/voteAnalyticsService';
import { organizationConfigService } from '../services/organizationConfigService';
import { d2cConfigService } from '../services/d2cConfigService';
import { createClerkClient } from '@clerk/backend';

const router = Router();
const clerkSecretKey = process.env.CLERK_SECRET_KEY || '';
const clerkClient = clerkSecretKey ? createClerkClient({ secretKey: clerkSecretKey }) : null;

/**
 * GET /api/admin/conversation-logs
 * Get all conversation logs for users in the admin's organization
 * Requires org:admin role
 */
router.get(
  '/conversation-logs',
  requireAuth,
  requireRole('org:admin'),
  asyncHandler(async (req: Request, res: Response) => {
    // Prefer explicit orgId from query param (for org switching), fallback to token orgId
    const explicitOrgId = req.query.orgId as string | undefined;
    const tokenOrgId = req.orgId;
    const orgId = explicitOrgId || tokenOrgId;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID not found' });
    }

    // Validate that explicit orgId matches token orgId (security check)
    if (explicitOrgId && tokenOrgId && explicitOrgId !== tokenOrgId) {
      // Check if user has admin access to the requested org
      const userRoles = req.userRoles || [];
      if (!userRoles.includes('org:admin')) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }
      // If admin, allow access to any org they're admin of (for org switching)
    }

    // Get all user IDs in the organization
    let orgUserIds: string[] = [];
    
    if (clerkClient && clerkSecretKey) {
      try {
        const members = await clerkClient.organizations.getOrganizationMembershipList({
          organizationId: orgId,
        });
        orgUserIds = members.data.map((m) => m.publicUserData?.userId || '').filter(Boolean);
      } catch (error: any) {
        console.error('Error fetching org members:', error);
        return res.status(500).json({ error: 'Failed to fetch organization members' });
      }
    } else {
      // Development mode - return empty or use a fallback
      console.warn('Clerk client not available, returning empty results');
      return res.json({
        logs: [],
        pagination: { total: 0, limit: 50, skip: 0, hasMore: false },
        summary: {
          totalSessions: 0,
          totalTokens: 0,
          totalBilledTokens: 0,
          totalCost: 0,
          uniqueUsers: 0,
        },
      });
    }

    if (orgUserIds.length === 0) {
      return res.json({
        logs: [],
        pagination: { total: 0, limit: 50, skip: 0, hasMore: false },
        summary: {
          totalSessions: 0,
          totalTokens: 0,
          totalBilledTokens: 0,
          totalCost: 0,
          uniqueUsers: 0,
        },
      });
    }

    // Parse query parameters
    const examType = req.query.examType as 'partA' | 'partB' | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;

    try {
      const result = await conversationLogService.getOrgLogs(orgUserIds, {
        examType,
        startDate,
        endDate,
        limit,
        skip,
        orgId: orgId, // Pass orgId for accurate filtering
      });

      res.json({
        logs: result.logs,
        pagination: {
          total: result.total,
          limit,
          skip,
          hasMore: result.hasMore,
        },
        summary: result.summary,
      });
    } catch (error: any) {
      console.error('Error fetching org conversation logs:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch organization conversation logs' });
    }
  })
);

/**
 * GET /api/admin/results/vote-analytics
 * Get vote analytics for oral expression results in the admin's organization
 * Requires org:admin role
 */
router.get(
  '/results/vote-analytics',
  requireAuth,
  requireRole('org:admin'),
  asyncHandler(async (req: Request, res: Response) => {
    // Prefer explicit orgId from query param (for org switching), fallback to token orgId
    const explicitOrgId = req.query.orgId as string | undefined;
    const tokenOrgId = req.orgId;
    const orgId = explicitOrgId || tokenOrgId;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID not found' });
    }

    // Validate that explicit orgId matches token orgId (security check)
    if (explicitOrgId && tokenOrgId && explicitOrgId !== tokenOrgId) {
      // Check if user has admin access to the requested org
      const userRoles = req.userRoles || [];
      if (!userRoles.includes('org:admin')) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }
      // If admin, allow access to any org they're admin of (for org switching)
    }

    // Get all user IDs in the organization
    let orgUserIds: string[] = [];
    
    if (clerkClient && clerkSecretKey) {
      try {
        const members = await clerkClient.organizations.getOrganizationMembershipList({
          organizationId: orgId,
        });
        orgUserIds = members.data.map((m) => m.publicUserData?.userId || '').filter(Boolean);
      } catch (error: any) {
        console.error('Error fetching org members:', error);
        return res.status(500).json({ error: 'Failed to fetch organization members' });
      }
    } else {
      // Development mode - return empty analytics
      console.warn('Clerk client not available, returning empty analytics');
      return res.json({
        summary: {
          totalResults: 0,
          totalUpvotes: 0,
          totalDownvotes: 0,
          totalVotes: 0,
          upvotePercentage: 0,
          downvotePercentage: 0,
        },
        byMode: {
          full: { totalResults: 0, upvotes: 0, downvotes: 0, votes: 0 },
          partA: { totalResults: 0, upvotes: 0, downvotes: 0, votes: 0 },
          partB: { totalResults: 0, upvotes: 0, downvotes: 0, votes: 0 },
        },
        byReason: {
          inaccurate_score: 0,
          poor_feedback: 0,
          technical_issue: 0,
        },
        topDownvotedResults: [],
        recentVotes: [],
      });
    }

    // Parse query parameters
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    try {
      const analytics = await voteAnalyticsService.getAnalytics(
        orgUserIds.length > 0 ? orgUserIds : undefined,
        startDate,
        endDate,
        orgId // Pass orgId for accurate filtering
      );

      res.json(analytics);
    } catch (error: any) {
      console.error('Error fetching vote analytics:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch vote analytics' });
    }
  })
);

/**
 * GET /api/admin/org-config
 * Get current organization configuration (or defaults)
 * Requires org:admin role
 */
router.get(
  '/org-config',
  requireAuth,
  requireRole('org:admin'),
  asyncHandler(async (req: Request, res: Response) => {
    // Prefer explicit orgId from query param (for org switching), fallback to token orgId
    const explicitOrgId = req.query.orgId as string | undefined;
    const tokenOrgId = req.orgId;
    const orgId = explicitOrgId || tokenOrgId;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID not found' });
    }

    // Validate that explicit orgId matches token orgId (security check)
    if (explicitOrgId && tokenOrgId && explicitOrgId !== tokenOrgId) {
      // Check if user has admin access to the requested org
      const userRoles = req.userRoles || [];
      if (!userRoles.includes('org:admin')) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }
      // If admin, allow access to any org they're admin of (for org switching)
      // The orgId will be validated by organizationConfigService
    }

    try {
      const config = await organizationConfigService.getConfig(orgId);
      res.json(config);
    } catch (error: any) {
      console.error('Error fetching org config:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch organization configuration' });
    }
  })
);

/**
 * PUT /api/admin/org-config
 * Update organization configuration limits
 * Requires org:admin role
 */
router.put(
  '/org-config',
  requireAuth,
  requireRole('org:admin'),
  asyncHandler(async (req: Request, res: Response) => {
    // Prefer explicit orgId from query param (for org switching), fallback to token orgId
    const explicitOrgId = req.query.orgId as string | undefined;
    const tokenOrgId = req.orgId;
    const orgId = explicitOrgId || tokenOrgId;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID not found' });
    }

    // Validate that explicit orgId matches token orgId (security check)
    if (explicitOrgId && tokenOrgId && explicitOrgId !== tokenOrgId) {
      // Check if user has admin access to the requested org
      const userRoles = req.userRoles || [];
      if (!userRoles.includes('org:admin')) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }
      // If admin, allow access to any org they're admin of (for org switching)
    }

    const { sectionALimit, sectionBLimit } = req.body;

    if (typeof sectionALimit !== 'number' || typeof sectionBLimit !== 'number') {
      return res.status(400).json({ error: 'sectionALimit and sectionBLimit must be numbers' });
    }

    if (sectionALimit < 1 || sectionBLimit < 1) {
      return res.status(400).json({ error: 'Limits must be at least 1' });
    }

    try {
      const updated = await organizationConfigService.updateConfig(orgId, {
        sectionALimit,
        sectionBLimit,
      });
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating org config:', error);
      res.status(500).json({ error: error.message || 'Failed to update organization configuration' });
    }
  })
);

/**
 * GET /api/admin/d2c-config
 * Get current D2C configuration (default limits for D2C users)
 * Requires org:admin role
 */
router.get(
  '/d2c-config',
  requireAuth,
  requireRole('org:admin'),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const config = await d2cConfigService.getConfig();
      res.json(config);
    } catch (error: any) {
      console.error('Error fetching D2C config:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch D2C configuration' });
    }
  })
);

/**
 * PUT /api/admin/d2c-config
 * Update D2C configuration limits (default limits for D2C users)
 * Requires org:admin role
 */
router.put(
  '/d2c-config',
  requireAuth,
  requireRole('org:admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const { sectionALimit, sectionBLimit, writtenExpressionSectionALimit, writtenExpressionSectionBLimit, mockExamLimit } = req.body;

    if (typeof sectionALimit !== 'number' || typeof sectionBLimit !== 'number') {
      return res.status(400).json({ error: 'sectionALimit and sectionBLimit must be numbers' });
    }

    if (sectionALimit < 0 || sectionBLimit < 0) {
      return res.status(400).json({ error: 'Limits must be non-negative' });
    }

    if (writtenExpressionSectionALimit !== undefined && typeof writtenExpressionSectionALimit !== 'number') {
      return res.status(400).json({ error: 'writtenExpressionSectionALimit must be a number' });
    }

    if (writtenExpressionSectionBLimit !== undefined && typeof writtenExpressionSectionBLimit !== 'number') {
      return res.status(400).json({ error: 'writtenExpressionSectionBLimit must be a number' });
    }

    if (mockExamLimit !== undefined && (typeof mockExamLimit !== 'number' || mockExamLimit < 0)) {
      return res.status(400).json({ error: 'mockExamLimit must be a non-negative number' });
    }

    try {
      const updated = await d2cConfigService.updateConfig({
        sectionALimit,
        sectionBLimit,
        writtenExpressionSectionALimit: writtenExpressionSectionALimit ?? 1,
        writtenExpressionSectionBLimit: writtenExpressionSectionBLimit ?? 1,
        mockExamLimit: mockExamLimit ?? 1,
      });
      res.json(updated);
    } catch (error: any) {
      console.error('Error updating D2C config:', error);
      res.status(500).json({ error: error.message || 'Failed to update D2C configuration' });
    }
  })
);

export default router;
