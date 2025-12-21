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
   * Find results by user ID with pagination
   */
  async findByUserId(
    userId: string,
    limit: number = DEFAULT_LIMIT,
    skip: number = 0
  ): Promise<SavedResult[]> {
    const db = await connectDB();
    
    const results = await db.collection('results')
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(Math.min(limit, MAX_LIMIT))
      .skip(skip)
      .toArray();
    
    return results as unknown as SavedResult[];
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

