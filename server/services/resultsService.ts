/**
 * Service layer for results database operations
 */

import { ObjectId } from 'mongodb';
import { connectDB } from '../db/connection';
import { SavedResult, VoteType, DownvoteReason, ResultVotes } from '../../types';
import * as taskService from './taskService';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export const resultsService = {
  /**
   * Find results by user ID with pagination and optional filters
   */
  async findByUserId(
    userId: string,
    limit: number = DEFAULT_LIMIT,
    skip: number = 0,
    mockExamId?: string,
    assignmentId?: string,
    module?: string,
    resultType?: 'practice' | 'mockExam' | 'assignment',
    populateTasks: boolean = false
  ): Promise<{ results: SavedResult[]; pagination?: { total: number; limit: number; skip: number; hasMore: boolean } }> {
    const db = await connectDB();

    // Build filter query
    const filter: any = { userId };
    if (mockExamId) {
      filter.mockExamId = mockExamId;
    }
    if (assignmentId) {
      filter.assignmentId = assignmentId;
    }
    if (module) {
      filter.module = module;
    }
    if (resultType) {
      filter.resultType = resultType;
    }

    // Get total count for pagination
    const totalCount = await db.collection('results').countDocuments(filter);

    const results = await db.collection('results')
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(Math.min(limit, MAX_LIMIT))
      .skip(skip)
      .toArray();

    let populatedResults = results as unknown as SavedResult[];

    // Optionally populate task references
    if (populateTasks) {
      const taskIds: string[] = [];
      results.forEach((result: any) => {
        if (result.taskReferences?.taskA?.taskId) {
          taskIds.push(result.taskReferences.taskA.taskId);
        }
        if (result.taskReferences?.taskB?.taskId) {
          taskIds.push(result.taskReferences.taskB.taskId);
        }
      });

      if (taskIds.length > 0) {
        const tasks = await taskService.getTasks([...new Set(taskIds)]);
        const taskMap = new Map(tasks.map(t => [t.taskId, t]));

        populatedResults = results.map((result: any) => {
          const populated = { ...result };
          // Add populated tasks to result for frontend access
          if (result.taskReferences?.taskA?.taskId) {
            const task = taskMap.get(result.taskReferences.taskA.taskId);
            if (task) {
              populated.taskA = task;
            }
          }
          if (result.taskReferences?.taskB?.taskId) {
            const task = taskMap.get(result.taskReferences.taskB.taskId);
            if (task) {
              populated.taskB = task;
            }
          }
          return populated;
        }) as SavedResult[];
      }
    }

    return {
      results: populatedResults,
      pagination: {
        total: totalCount,
        limit: Math.min(limit, MAX_LIMIT),
        skip,
        hasMore: skip + results.length < totalCount
      }
    };
  },

  /**
   * Check if user has completed an assignment (for access control)
   */
  async hasUserCompletedAssignment(userId: string, assignmentId: string): Promise<boolean> {
    const db = await connectDB();
    const count = await db.collection('results').countDocuments({
      userId,
      assignmentId,
      resultType: 'assignment'
    });
    return count > 0;
  },

  /**
   * Update result metadata (for adding mock exam fields)
   */
  async updateResultMetadata(resultId: string, metadata: { mockExamId: string; module: string }): Promise<void> {
    const db = await connectDB();

    await db.collection('results').updateOne(
      { _id: new ObjectId(resultId) },
      {
        $set: {
          mockExamId: metadata.mockExamId,
          module: metadata.module,
          updatedAt: new Date().toISOString(),
        },
      }
    );
  },

  /**
   * Update evaluation data for an existing result (for re-evaluation)
   */
  async updateEvaluation(resultId: string, userId: string, evaluation: any, moduleData?: any): Promise<SavedResult> {
    const db = await connectDB();

    if (!ObjectId.isValid(resultId)) {
      throw new Error('Invalid result ID');
    }

    // Verify the result belongs to the user
    const existingResult = await db.collection('results').findOne({
      _id: new ObjectId(resultId),
      userId
    });

    if (!existingResult) {
      throw new Error('Result not found or access denied');
    }

    // Build update object
    const updateData: any = {
      evaluation,
      updatedAt: new Date().toISOString(),
    };

    // Update moduleData if provided
    if (moduleData) {
      updateData.moduleData = moduleData;
    }

    // Update the result
    await db.collection('results').updateOne(
      { _id: new ObjectId(resultId) },
      { $set: updateData }
    );

    // Return updated result
    const updatedResult = await db.collection('results').findOne({
      _id: new ObjectId(resultId)
    });

    return updatedResult as unknown as SavedResult;
  },

  /**
   * Find result by ID
   */
  async findById(resultId: string, userId: string, populateTasks: boolean = true): Promise<SavedResult | null> {
    const db = await connectDB();
    
    if (!ObjectId.isValid(resultId)) {
      return null;
    }
    
    const result = await db.collection('results').findOne({ 
      _id: new ObjectId(resultId),
      userId 
    });
    
    if (!result) {
      return null;
    }
    
    let populatedResult = result as unknown as SavedResult;
    
    // Optionally populate task references
    if (populateTasks && result.taskReferences) {
      const taskIds: string[] = [];
      if (result.taskReferences.taskA?.taskId) {
        taskIds.push(result.taskReferences.taskA.taskId);
      }
      if (result.taskReferences.taskB?.taskId) {
        taskIds.push(result.taskReferences.taskB.taskId);
      }

      if (taskIds.length > 0) {
        const tasks = await taskService.getTasks([...new Set(taskIds)]);
        const taskMap = new Map(tasks.map(t => [t.taskId, t]));

        populatedResult = {
          ...result,
          ...(result.taskReferences?.taskA?.taskId && {
            taskA: taskMap.get(result.taskReferences.taskA.taskId)
          }),
          ...(result.taskReferences?.taskB?.taskId && {
            taskB: taskMap.get(result.taskReferences.taskB.taskId)
          })
        } as unknown as SavedResult;
      }
    }
    
    return populatedResult;
  },

  /**
   * Create a new result
   * Validates task references exist before saving
   */
  async create(result: SavedResult): Promise<SavedResult> {
    const db = await connectDB();
    
    // Validate task references if present
    if (result.taskReferences) {
      if (result.taskReferences.taskA) {
        const isValid = await taskService.validateTaskReference(
          result.taskReferences.taskA.taskId,
          result.taskReferences.taskA.type
        );
        if (!isValid) {
          throw new Error(`Invalid task reference: ${result.taskReferences.taskA.taskId} (type: ${result.taskReferences.taskA.type})`);
        }
      }
      if (result.taskReferences.taskB) {
        const isValid = await taskService.validateTaskReference(
          result.taskReferences.taskB.taskId,
          result.taskReferences.taskB.type
        );
        if (!isValid) {
          throw new Error(`Invalid task reference: ${result.taskReferences.taskB.taskId} (type: ${result.taskReferences.taskB.type})`);
        }
      }
    }
    
    result.createdAt = new Date().toISOString();
    result.updatedAt = new Date().toISOString();
    
    // Remove _id if it's a string (MongoDB will generate ObjectId)
    const { _id, ...resultWithoutId } = result;
    
    const doc = await db.collection('results').insertOne(resultWithoutId as any);
    
    return {
      ...result,
      _id: doc.insertedId.toString(),
    } as SavedResult;
  },

  /**
   * Count results for a user
   */
  async countByUserId(userId: string): Promise<number> {
    const db = await connectDB();
    
    return db.collection('results').countDocuments({ userId });
  },

  /**
   * Upsert a result for mock exams
   * Uses mockExamId + module + userId as unique key
   * This prevents duplicate results when worker and completeModule both try to save
   */
  async upsertMockExamResult(result: SavedResult): Promise<SavedResult> {
    const db = await connectDB();
    
    if (!result.mockExamId || !result.module) {
      throw new Error('mockExamId and module are required for upsert');
    }
    
    // Validate task references if present
    if (result.taskReferences) {
      if (result.taskReferences.taskA) {
        const isValid = await taskService.validateTaskReference(
          result.taskReferences.taskA.taskId,
          result.taskReferences.taskA.type
        );
        if (!isValid) {
          throw new Error(`Invalid task reference: ${result.taskReferences.taskA.taskId} (type: ${result.taskReferences.taskA.type})`);
        }
      }
      if (result.taskReferences.taskB) {
        const isValid = await taskService.validateTaskReference(
          result.taskReferences.taskB.taskId,
          result.taskReferences.taskB.type
        );
        if (!isValid) {
          throw new Error(`Invalid task reference: ${result.taskReferences.taskB.taskId} (type: ${result.taskReferences.taskB.type})`);
        }
      }
    }
    
    const now = new Date().toISOString();
    result.updatedAt = now;
    
    // Remove _id and createdAt for the update operation
    // createdAt should only be set on insert, not on update
    const { _id, createdAt, ...resultWithoutIdAndCreatedAt } = result;
    
    // Upsert: update if exists, insert if not
    // This will update an existing placeholder (isLoading: true) or create new if none exists
    const doc = await db.collection('results').findOneAndUpdate(
      {
        userId: result.userId,
        mockExamId: result.mockExamId,
        module: result.module,
      },
      {
        $set: {
          ...resultWithoutIdAndCreatedAt,
          isLoading: false, // Worker result is complete
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      }
    );
    
    return {
      ...result,
      _id: doc?._id?.toString(),
      isLoading: false,
    } as SavedResult;
  },

  /**
   * Add or update a vote for a result
   * Vote scope is determined by result.mode (full, partA, partB)
   */
  async addVote(
    resultId: string,
    userId: string,
    vote: VoteType,
    reason?: DownvoteReason
  ): Promise<SavedResult> {
    const db = await connectDB();

    if (!ObjectId.isValid(resultId)) {
      throw new Error('Invalid result ID');
    }

    // Get the result to check mode and existing votes
    const result = await db.collection('results').findOne({
      _id: new ObjectId(resultId),
    });

    if (!result) {
      throw new Error('Result not found');
    }

    // Only allow voting on oral expression results
    if (result.module !== 'oralExpression') {
      throw new Error('Voting is only available for oral expression results');
    }

    // Initialize votes if it doesn't exist
    const currentVotes: ResultVotes = result.votes || {
      upvotes: 0,
      downvotes: 0,
      downvoteReasons: {
        inaccurate_score: 0,
        poor_feedback: 0,
        technical_issue: 0,
      },
      userVotes: [],
    };

    // Find existing vote from this user
    const existingVoteIndex = currentVotes.userVotes.findIndex(
      (v) => v.userId === userId
    );

    let previousVote: VoteType | null = null;
    let previousReason: DownvoteReason | undefined = undefined;

    // If user already voted, remove the previous vote
    if (existingVoteIndex !== -1) {
      const existingVote = currentVotes.userVotes[existingVoteIndex];
      previousVote = existingVote.vote;
      previousReason = existingVote.reason;

      // Decrement previous vote count
      if (previousVote === 'upvote') {
        currentVotes.upvotes = Math.max(0, currentVotes.upvotes - 1);
      } else if (previousVote === 'downvote') {
        currentVotes.downvotes = Math.max(0, currentVotes.downvotes - 1);
        // Decrement previous reason count if it exists
        if (previousReason && currentVotes.downvoteReasons[previousReason] > 0) {
          currentVotes.downvoteReasons[previousReason]--;
        }
      }

      // Remove the old vote
      currentVotes.userVotes.splice(existingVoteIndex, 1);
    }

    // Add the new vote
    if (vote === 'upvote') {
      currentVotes.upvotes++;
    } else if (vote === 'downvote') {
      currentVotes.downvotes++;
      if (reason) {
        currentVotes.downvoteReasons[reason]++;
      }
    }

    // Add user vote record
    currentVotes.userVotes.push({
      userId,
      vote,
      reason,
      timestamp: new Date().toISOString(),
    });

    // Update the result
    await db.collection('results').updateOne(
      { _id: new ObjectId(resultId) },
      {
        $set: {
          votes: currentVotes,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    // Return updated result
    const updatedResult = await db.collection('results').findOne({
      _id: new ObjectId(resultId),
    });

    return updatedResult as unknown as SavedResult;
  },

  /**
   * Remove a vote from a result
   * Vote scope is determined by result.mode (full, partA, partB)
   */
  async removeVote(resultId: string, userId: string): Promise<SavedResult> {
    const db = await connectDB();

    if (!ObjectId.isValid(resultId)) {
      throw new Error('Invalid result ID');
    }

    // Get the result
    const result = await db.collection('results').findOne({
      _id: new ObjectId(resultId),
    });

    if (!result) {
      throw new Error('Result not found');
    }

    if (!result.votes) {
      return result as unknown as SavedResult;
    }

    const currentVotes: ResultVotes = result.votes;

    // Find and remove user's vote
    const existingVoteIndex = currentVotes.userVotes.findIndex(
      (v) => v.userId === userId
    );

    if (existingVoteIndex === -1) {
      // No vote to remove
      return result as unknown as SavedResult;
    }

    const existingVote = currentVotes.userVotes[existingVoteIndex];

    // Decrement vote count
    if (existingVote.vote === 'upvote') {
      currentVotes.upvotes = Math.max(0, currentVotes.upvotes - 1);
    } else if (existingVote.vote === 'downvote') {
      currentVotes.downvotes = Math.max(0, currentVotes.downvotes - 1);
      // Decrement reason count if it exists
      if (existingVote.reason && currentVotes.downvoteReasons[existingVote.reason] > 0) {
        currentVotes.downvoteReasons[existingVote.reason]--;
      }
    }

    // Remove user vote
    currentVotes.userVotes.splice(existingVoteIndex, 1);

    // Update the result
    await db.collection('results').updateOne(
      { _id: new ObjectId(resultId) },
      {
        $set: {
          votes: currentVotes,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    // Return updated result
    const updatedResult = await db.collection('results').findOne({
      _id: new ObjectId(resultId),
    });

    return updatedResult as unknown as SavedResult;
  },
};

