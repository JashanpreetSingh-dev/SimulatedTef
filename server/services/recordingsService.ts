/**
 * Service layer for recordings database operations
 */

import { ObjectId } from 'mongodb';
import { connectDB, getGridFSBucket } from '../db/connection';

export const recordingsService = {
  /**
   * Find recording metadata by ID
   */
  async findById(recordingId: string, userId: string) {
    if (!ObjectId.isValid(recordingId)) {
      return null;
    }
    
    await connectDB();
    const gridFSBucket = getGridFSBucket();
    
    const files = await gridFSBucket.find({ 
      _id: new ObjectId(recordingId) 
    }).toArray();
    
    if (files.length === 0) {
      return null;
    }
    
    const file = files[0];
    
    // Verify ownership
    if (file.metadata?.userId && file.metadata.userId !== userId) {
      return null;
    }
    
    return file;
  },

  /**
   * Find recordings by user ID
   */
  async findByUserId(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    await connectDB();
    const gridFSBucket = getGridFSBucket();
    
    const files = await gridFSBucket.find({ 
      'metadata.userId': userId 
    })
      .sort({ uploadDate: -1 })
      .limit(limit)
      .toArray();
    
    return files;
  },
};

