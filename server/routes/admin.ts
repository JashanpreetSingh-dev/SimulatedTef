/**
 * Admin API routes - organization-level access only
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Request, Response } from 'express';
import { conversationLogService } from '../services/conversationLogService';
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
    const orgId = req.orgId;
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID not found' });
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

export default router;
