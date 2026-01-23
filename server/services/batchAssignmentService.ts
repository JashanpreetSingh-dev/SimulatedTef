/**
 * BatchAssignment Service - manages assessment assignments to batches
 */

import { randomUUID } from 'crypto';
import { connectDB } from '../db/connection';
import { BatchAssignment, Assignment } from '../../types';
import { createBatchAssignment } from '../models/BatchAssignment';
import { batchService } from './batchService';
import { assignmentService } from './assignmentService';

export const batchAssignmentService = {
  /**
   * Assign assessment to batch
   */
  async assignToBatch(
    batchId: string,
    assignmentId: string,
    assignedBy: string,
    orgId: string
  ): Promise<BatchAssignment> {
    const db = await connectDB();
    const batchAssignmentsCollection = db.collection('batchAssignments');
    const batchesCollection = db.collection('batches');

    // Verify batch exists and belongs to org
    const batch = await batchService.getBatchById(batchId);
    if (!batch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    if (batch.orgId !== orgId) {
      throw new Error('Batch does not belong to this organization.');
    }

    // Verify assignment exists and is published
    const assignment = await assignmentService.getAssignmentById(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found`);
    }

    if (assignment.status !== 'published') {
      throw new Error('Only published assignments can be assigned to batches.');
    }

    if (assignment.orgId !== orgId) {
      throw new Error('Assignment does not belong to this organization.');
    }

    // Check if already assigned
    const existing = await batchAssignmentsCollection.findOne({
      batchId,
      assignmentId,
    });

    if (existing) {
      throw new Error('Assignment already assigned to this batch.');
    }

    // Create batch assignment
    const batchAssignmentId = `batch_assignment_${randomUUID()}`;
    const batchAssignment = createBatchAssignment(
      batchAssignmentId,
      batchId,
      assignmentId,
      assignedBy,
      orgId
    );

    // Save to database
    await batchAssignmentsCollection.insertOne(batchAssignment);

    return batchAssignment;
  },

  /**
   * Unassign assessment from batch
   */
  async unassignFromBatch(batchAssignmentId: string): Promise<void> {
    const db = await connectDB();
    const batchAssignmentsCollection = db.collection('batchAssignments');

    const result = await batchAssignmentsCollection.deleteOne({ batchAssignmentId });
    if (result.deletedCount === 0) {
      throw new Error(`Batch assignment ${batchAssignmentId} not found`);
    }
  },

  /**
   * Get all assignments for a batch
   */
  async getAssignmentsByBatch(batchId: string): Promise<(BatchAssignment & { assignment?: Assignment })[]> {
    const db = await connectDB();
    const batchAssignmentsCollection = db.collection('batchAssignments');

    const batchAssignments = await batchAssignmentsCollection
      .find({ batchId })
      .sort({ assignedAt: -1 })
      .toArray() as unknown as BatchAssignment[];

    // Populate assignment details
    const assignmentsWithDetails = await Promise.all(
      batchAssignments.map(async (ba) => {
        const assignment = await assignmentService.getAssignmentById(ba.assignmentId);
        return {
          ...ba,
          assignment: assignment || undefined,
        };
      })
    );

    return assignmentsWithDetails;
  },

  /**
   * Get assignments for student's batch
   */
  async getAssignmentsForStudent(studentId: string): Promise<(BatchAssignment & { assignment?: Assignment })[]> {
    // Get student's batch
    const batch = await batchService.getBatchByStudent(studentId);
    if (!batch) {
      return [];
    }

    // Get assignments for this batch
    return this.getAssignmentsByBatch(batch.batchId);
  },

  /**
   * Get batches that have a specific assignment
   */
  async getBatchesByAssignment(assignmentId: string): Promise<BatchAssignment[]> {
    const db = await connectDB();
    const batchAssignmentsCollection = db.collection('batchAssignments');

    const batchAssignments = await batchAssignmentsCollection
      .find({ assignmentId })
      .sort({ assignedAt: -1 })
      .toArray();

    return batchAssignments as unknown as BatchAssignment[];
  },
};