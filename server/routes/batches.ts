/**
 * Batch API routes - for creating and managing batches
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Request, Response } from 'express';
import { batchService } from '../services/batchService';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// POST /api/batches - Create batch (professor only)
router.post('/', requireRole('org:professor'), asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  const userId = req.userId!;
  const orgId = req.orgId;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Batch name is required' });
  }

  if (!orgId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }

  const batch = await batchService.createBatch(name.trim(), userId, orgId);
  res.status(201).json(batch);
}));

// GET /api/batches - List professor's batches (professor only)
router.get('/', requireRole('org:professor'), asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const batches = await batchService.getBatchesByProfessor(userId);
  res.json(batches);
}));

// GET /api/batches/my - Get student's batch (student)
router.get('/my', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const batch = await batchService.getBatchByStudent(userId);
  if (!batch) {
    return res.status(404).json({ error: 'You are not assigned to any batch' });
  }

  res.json(batch);
}));

// GET /api/batches/students - Get all students in organization (professor only)
router.get('/students', requireRole('org:professor'), asyncHandler(async (req: Request, res: Response) => {
  const orgId = req.orgId;

  if (!orgId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }

  const students = await batchService.getStudentsInOrg(orgId);
  res.json(students);
}));

// GET /api/batches/:batchId - Get batch details
router.get('/:batchId', asyncHandler(async (req: Request, res: Response) => {
  const { batchId } = req.params;
  const userId = req.userId!;
  const orgId = req.orgId;

  const batch = await batchService.getBatchById(batchId);
  if (!batch) {
    return res.status(404).json({ error: 'Batch not found' });
  }

  // Check access: professor can see their own batches, students can see their batch
  if (batch.professorId === userId) {
    // Professor viewing their own batch
    res.json(batch);
  } else if (batch.studentIds.includes(userId)) {
    // Student viewing their batch
    res.json(batch);
  } else if (orgId && batch.orgId === orgId) {
    // Same org member (could be another professor)
    res.json(batch);
  } else {
    return res.status(403).json({ error: 'You do not have access to this batch' });
  }
}));

// PUT /api/batches/:batchId - Update batch name (professor only)
router.put('/:batchId', requireRole('org:professor'), asyncHandler(async (req: Request, res: Response) => {
  const { batchId } = req.params;
  const userId = req.userId!;
  const { name } = req.body;

  // Verify batch exists and belongs to user
  const batch = await batchService.getBatchById(batchId);
  if (!batch) {
    return res.status(404).json({ error: 'Batch not found' });
  }

  if (batch.professorId !== userId) {
    return res.status(403).json({ error: 'You do not have permission to modify this batch' });
  }

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Batch name is required' });
  }

  const updated = await batchService.updateBatch(batchId, name.trim());
  res.json(updated);
}));

// DELETE /api/batches/:batchId - Delete batch (professor only)
router.delete('/:batchId', requireRole('org:professor'), asyncHandler(async (req: Request, res: Response) => {
  const { batchId } = req.params;
  const userId = req.userId!;

  // Verify batch exists and belongs to user
  const batch = await batchService.getBatchById(batchId);
  if (!batch) {
    return res.status(404).json({ error: 'Batch not found' });
  }

  if (batch.professorId !== userId) {
    return res.status(403).json({ error: 'You do not have permission to delete this batch' });
  }

  await batchService.deleteBatch(batchId);
  res.json({ success: true, message: 'Batch deleted successfully' });
}));

// POST /api/batches/:batchId/students - Add student (professor only)
router.post('/:batchId/students', requireRole('org:professor'), asyncHandler(async (req: Request, res: Response) => {
  const { batchId } = req.params;
  const userId = req.userId!;
  const orgId = req.orgId;
  const { studentUserId } = req.body;

  if (!orgId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }

  if (!studentUserId) {
    return res.status(400).json({ error: 'studentUserId is required' });
  }

  // Verify batch exists and belongs to user
  const batch = await batchService.getBatchById(batchId);
  if (!batch) {
    return res.status(404).json({ error: 'Batch not found' });
  }

  if (batch.professorId !== userId) {
    return res.status(403).json({ error: 'You do not have permission to modify this batch' });
  }

  const updated = await batchService.addStudentToBatch(studentUserId, batchId, orgId);
  res.json(updated);
}));

// DELETE /api/batches/:batchId/students/:studentId - Remove student (professor only)
router.delete('/:batchId/students/:studentId', requireRole('org:professor'), asyncHandler(async (req: Request, res: Response) => {
  const { batchId, studentId } = req.params;
  const userId = req.userId!;

  // Verify batch exists and belongs to user
  const batch = await batchService.getBatchById(batchId);
  if (!batch) {
    return res.status(404).json({ error: 'Batch not found' });
  }

  if (batch.professorId !== userId) {
    return res.status(403).json({ error: 'You do not have permission to modify this batch' });
  }

  await batchService.removeStudentFromBatch(batchId, studentId);
  res.json({ success: true, message: 'Student removed from batch successfully' });
}));

// GET /api/batches/:batchId/assignments - Get batch assignments
router.get('/:batchId/assignments', asyncHandler(async (req: Request, res: Response) => {
  const { batchId } = req.params;
  const userId = req.userId!;
  const orgId = req.orgId;

  const { batchAssignmentService } = await import('../services/batchAssignmentService');
  const batch = await batchService.getBatchById(batchId);
  if (!batch) {
    return res.status(404).json({ error: 'Batch not found' });
  }

  // Check access: professor can see their own batches, students can see their batch
  if (batch.professorId === userId) {
    // Professor viewing their own batch
    const assignments = await batchAssignmentService.getAssignmentsByBatch(batchId);
    res.json(assignments);
  } else if (batch.studentIds.includes(userId)) {
    // Student viewing their batch
    const assignments = await batchAssignmentService.getAssignmentsByBatch(batchId);
    res.json(assignments);
  } else if (orgId && batch.orgId === orgId) {
    // Same org member
    const assignments = await batchAssignmentService.getAssignmentsByBatch(batchId);
    res.json(assignments);
  } else {
    return res.status(403).json({ error: 'You do not have access to this batch' });
  }
}));

export default router;