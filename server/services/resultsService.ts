/**
 * Service layer for results database operations
 */

import { ObjectId } from 'mongodb';
import { connectDB } from '../db/connection';
import { SavedResult } from '../../types';

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
    module?: string
  ): Promise<SavedResult[]> {
    const db = await connectDB();

    // Build filter query
    const filter: any = { userId };
    if (mockExamId) {
      filter.mockExamId = mockExamId;
    }
    if (module) {
      filter.module = module;
    }

    const results = await db.collection('results')
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(Math.min(limit, MAX_LIMIT))
      .skip(skip)
      .toArray();

    return results as unknown as SavedResult[];
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
   * Find result by ID
   */
  async findById(resultId: string, userId: string): Promise<SavedResult | null> {
    const db = await connectDB();
    
    if (!ObjectId.isValid(resultId)) {
      return null;
    }
    
    const result = await db.collection('results').findOne({ 
      _id: new ObjectId(resultId),
      userId 
    });
    
    return result as unknown as SavedResult | null;
  },

  /**
   * Create a new result
   */
  async create(result: SavedResult): Promise<SavedResult> {
    const db = await connectDB();
    
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
};

