/**
 * Service layer for recordings database operations
 * Now uses MongoDB recordings collection instead of GridFS
 */

import { ObjectId } from 'mongodb';
import { connectDB } from '../db/connection';

export interface RecordingDocument {
  _id: ObjectId;
  s3Key: string;
  userId: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: Date;
}

export const recordingsService = {
  /**
   * Find recording metadata by ID
   */
  async findById(recordingId: string, userId: string): Promise<RecordingDocument | null> {
    if (!ObjectId.isValid(recordingId)) {
      return null;
    }
    
    const db = await connectDB();
    
    const recording = await db.collection('recordings').findOne({ 
      _id: new ObjectId(recordingId) 
    }) as RecordingDocument | null;
    
    if (!recording) {
      return null;
    }
    
    // Verify ownership
    if (recording.userId && recording.userId !== userId) {
      return null;
    }
    
    return recording;
  },

  /**
   * Find recordings by user ID
   */
  async findByUserId(
    userId: string,
    limit: number = 50
  ): Promise<RecordingDocument[]> {
    const db = await connectDB();
    
    const recordings = await db.collection('recordings')
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray() as RecordingDocument[];
    
    return recordings;
  },

  /**
   * Delete recording metadata by ID
   */
  async deleteById(recordingId: string, userId: string): Promise<boolean> {
    if (!ObjectId.isValid(recordingId)) {
      return false;
    }
    
    const db = await connectDB();
    
    const result = await db.collection('recordings').deleteOne({ 
      _id: new ObjectId(recordingId),
      userId 
    });
    
    return result.deletedCount > 0;
  },
};
