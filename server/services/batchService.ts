/**
 * Batch Service - manages student batches created by professors
 */

import { connectDB } from '../db/connection';
import { Batch } from '../../types';
import { createBatch } from '../models/Batch';
import { createClerkClient } from '@clerk/backend';

const clerkSecretKey = process.env.CLERK_SECRET_KEY || '';
const clerkClient = clerkSecretKey ? createClerkClient({ secretKey: clerkSecretKey }) : null;

/**
 * Validate user exists in organization (via Clerk API)
 */
async function validateUserInOrg(userId: string, orgId: string): Promise<boolean> {
  if (!clerkClient || !clerkSecretKey) {
    // Skip validation in dev mode
    return true;
  }

  try {
    const memberships = await clerkClient.users.getOrganizationMembershipList({
      userId,
    });

    return memberships.data.some(m => m.organization.id === orgId);
  } catch (error) {
    console.error('Error validating user in org:', error);
    return false;
  }
}

/**
 * Get all students in organization (users with org:student role)
 */
async function getStudentsInOrg(orgId: string): Promise<Array<{ userId: string; email: string; firstName?: string; lastName?: string }>> {
  if (!clerkClient || !clerkSecretKey) {
    // Dev mode - return empty array
    return [];
  }

  try {
    // Get organization members with student role
    const members = await clerkClient.organizations.getOrganizationMembershipList({
      organizationId: orgId,
    });

    // Filter for students and fetch user details
    const studentMembers = members.data.filter(m => m.role === 'org:student');
    
    const students = await Promise.all(
      studentMembers.map(async (member) => {
        try {
          // Get user ID from membership
          // Clerk membership object structure: member.publicUserData.userId or member.userId
          const userId = (member as any).publicUserData?.userId || (member as any).userId || (member as any).id;
          if (!userId) {
            console.warn('Membership missing userId:', member);
            return null;
          }
          
          const user = await clerkClient.users.getUser(userId);
          return {
            userId: user.id,
            email: user.emailAddresses[0]?.emailAddress || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
          };
        } catch (err) {
          console.error(`Failed to fetch user for membership:`, err);
          return null;
        }
      })
    );

    return students.filter(Boolean) as Array<{ userId: string; email: string; firstName?: string; lastName?: string }>;
  } catch (error) {
    console.error('Error fetching students in org:', error);
    return [];
  }
}

/**
 * Find user by email or ID
 */
async function findUserByEmailOrId(emailOrId: string): Promise<string | null> {
  if (!clerkClient || !clerkSecretKey) {
    // In dev mode, return the input as userId
    return emailOrId;
  }

  try {
    // Try as user ID first
    try {
      const user = await clerkClient.users.getUser(emailOrId);
      return user.id;
    } catch {
      // If not found, try as email
      const users = await clerkClient.users.getUserList({
        emailAddress: [emailOrId],
      });

      if (users.data.length > 0) {
        return users.data[0].id;
      }

      return null;
    }
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

export const batchService = {
  /**
   * Create a new batch (professor only)
   */
  async createBatch(
    name: string,
    professorId: string,
    orgId: string
  ): Promise<Batch> {
    const db = await connectDB();
    const batchesCollection = db.collection('batches');

    // Generate batch ID
    const existingBatches = await batchesCollection.find({}).toArray();
    const batchNumbers = existingBatches
      .map((b: any) => {
        const match = b.batchId?.match(/^batch_(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((n: number) => n > 0);
    const nextNumber = batchNumbers.length > 0 ? Math.max(...batchNumbers) + 1 : 1;
    const batchId = `batch_${nextNumber}`;

    // Create batch
    const batch = createBatch(batchId, name, professorId, orgId);

    // Save to database
    await batchesCollection.insertOne(batch);

    return batch;
  },

  /**
   * Get batch by ID
   */
  async getBatchById(batchId: string): Promise<Batch | null> {
    const db = await connectDB();
    const batchesCollection = db.collection('batches');

    const batch = await batchesCollection.findOne({ batchId });
    return batch as unknown as Batch | null;
  },

  /**
   * Get all batches for a professor
   */
  async getBatchesByProfessor(professorId: string): Promise<Batch[]> {
    const db = await connectDB();
    const batchesCollection = db.collection('batches');

    const batches = await batchesCollection
      .find({ professorId })
      .sort({ createdAt: -1 })
      .toArray();

    return batches as unknown as Batch[];
  },

  /**
   * Get batch by student (student can only be in one batch)
   */
  async getBatchByStudent(studentId: string): Promise<Batch | null> {
    const db = await connectDB();
    const batchesCollection = db.collection('batches');

    const batch = await batchesCollection.findOne({
      studentIds: studentId,
    });

    return batch as unknown as Batch | null;
  },

  /**
   * Add student to batch (removes from old batch if exists)
   */
  async addStudentToBatch(
    studentUserId: string,
    batchId: string,
    orgId: string
  ): Promise<Batch> {
    const db = await connectDB();
    const batchesCollection = db.collection('batches');

    // Validate user exists in same organization
    const userInOrg = await validateUserInOrg(studentUserId, orgId);
    if (!userInOrg) {
      throw new Error('User does not belong to this organization.');
    }

    // Get target batch
    const targetBatch = await batchesCollection.findOne({ batchId });
    if (!targetBatch) {
      throw new Error(`Batch ${batchId} not found`);
    }

    const batchData = targetBatch as unknown as Batch;
    if (batchData.orgId !== orgId) {
      throw new Error('Batch does not belong to this organization.');
    }

    // Remove student from any existing batch
    await batchesCollection.updateMany(
      { studentIds: studentUserId },
      { $pull: { studentIds: studentUserId }, $set: { updatedAt: new Date().toISOString() } }
    );

    // Add student to new batch (only if not already in it)
    if (!batchData.studentIds.includes(studentUserId)) {
      await batchesCollection.updateOne(
        { batchId },
        {
          $addToSet: { studentIds: studentUserId },
          $set: { updatedAt: new Date().toISOString() },
        }
      );
    }

    // Return updated batch
    const updated = await batchesCollection.findOne({ batchId });
    return updated as unknown as Batch;
  },

  /**
   * Remove student from batch
   */
  async removeStudentFromBatch(batchId: string, studentId: string): Promise<void> {
    const db = await connectDB();
    const batchesCollection = db.collection('batches');

    await batchesCollection.updateOne(
      { batchId },
      {
        $pull: { studentIds: studentId },
        $set: { updatedAt: new Date().toISOString() },
      }
    );
  },

  /**
   * Update batch name
   */
  async updateBatch(batchId: string, name: string): Promise<Batch> {
    const db = await connectDB();
    const batchesCollection = db.collection('batches');

    await batchesCollection.updateOne(
      { batchId },
      {
        $set: {
          name,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    const updated = await batchesCollection.findOne({ batchId });
    if (!updated) {
      throw new Error(`Batch ${batchId} not found`);
    }

    return updated as unknown as Batch;
  },

  /**
   * Delete batch (only if no assignments exist)
   */
  async deleteBatch(batchId: string): Promise<void> {
    const db = await connectDB();
    const batchesCollection = db.collection('batches');
    const batchAssignmentsCollection = db.collection('batchAssignments');

    // Check if batch has assignments
    const assignmentCount = await batchAssignmentsCollection.countDocuments({ batchId });
    if (assignmentCount > 0) {
      throw new Error('Cannot delete batch with assigned assessments. Unassign them first.');
    }

    // Delete batch
    await batchesCollection.deleteOne({ batchId });
  },

  /**
   * Get all students in organization
   */
  async getStudentsInOrg(orgId: string): Promise<Array<{ userId: string; email: string; firstName?: string; lastName?: string }>> {
    return getStudentsInOrg(orgId);
  },
};