/**
 * BatchAssignment API routes - for assigning assessments to batches
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Request, Response } from 'express';
import { batchAssignmentService } from '../services/batchAssignmentService';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// POST /api/batch-assignments - Assign assessment to batch (professor only)
router.post('/', requireRole('org:professor'), asyncHandler(async (req: Request, res: Response) => {
  const { batchId, assignmentId } = req.body;
  const userId = req.userId!;
  const orgId = req.orgId;

  if (!batchId || typeof batchId !== 'string') {
    return res.status(400).json({ error: 'batchId is required' });
  }

  if (!assignmentId || typeof assignmentId !== 'string') {
    return res.status(400).json({ error: 'assignmentId is required' });
  }

  if (!orgId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }

  const batchAssignment = await batchAssignmentService.assignToBatch(
    batchId,
    assignmentId,
    userId,
    orgId
  );

  res.status(201).json(batchAssignment);
}));

// DELETE /api/batch-assignments/:batchAssignmentId - Unassign (professor only)
router.delete('/:batchAssignmentId', requireRole('org:professor'), asyncHandler(async (req: Request, res: Response) => {
  const { batchAssignmentId } = req.params;

  await batchAssignmentService.unassignFromBatch(batchAssignmentId);
  res.json({ success: true, message: 'Assignment unassigned from batch successfully' });
}));

// GET /api/assignments/assigned - Get student's assigned assessments
// Note: This route is mounted at /batch-assignments, but the path is /assignments/assigned
// We'll handle this via assignments router instead
export default router;