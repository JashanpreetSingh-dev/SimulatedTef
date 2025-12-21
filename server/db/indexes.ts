/**
 * Database index definitions and creation logic
 */

import { connectDB } from './connection';

/**
 * Create all required indexes for the application
 */
export async function createIndexes(): Promise<void> {
  try {
    const db = await connectDB();
    
    console.log('📊 Creating database indexes...');
    
    // Results collection indexes
    const resultsCollection = db.collection('results');
    
    // Compound index for user queries sorted by timestamp
    await resultsCollection.createIndex(
      { userId: 1, timestamp: -1 },
      { name: 'userId_timestamp_idx' }
    );
    console.log('✅ Created index: results.userId_timestamp_idx');
    
    // Alternative sorting by createdAt
    await resultsCollection.createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'userId_createdAt_idx' }
    );
    console.log('✅ Created index: results.userId_createdAt_idx');
    
    // Index for filtering by exam mode
    await resultsCollection.createIndex(
      { mode: 1, timestamp: -1 },
      { name: 'mode_timestamp_idx' }
    );
    console.log('✅ Created index: results.mode_timestamp_idx');
    
    // Ensure _id index exists (should already exist, but verify)
    await resultsCollection.createIndex(
      { _id: 1 },
      { name: '_id_idx' }
    );
    console.log('✅ Verified index: results._id_idx');
    
    // GridFS recordings collection indexes
    const recordingsCollection = db.collection('recordings.files');
    
    // Index for user audio queries
    await recordingsCollection.createIndex(
      { 'metadata.userId': 1 },
      { name: 'metadata_userId_idx' }
    );
    console.log('✅ Created index: recordings.metadata.userId_idx');
    
    // Index for recent uploads
    await recordingsCollection.createIndex(
      { uploadDate: -1 },
      { name: 'uploadDate_idx' }
    );
    console.log('✅ Created index: recordings.uploadDate_idx');
    
    // Compound index for user's recent recordings
    await recordingsCollection.createIndex(
      { 'metadata.userId': 1, uploadDate: -1 },
      { name: 'metadata_userId_uploadDate_idx' }
    );
    console.log('✅ Created index: recordings.metadata.userId_uploadDate_idx');
    
    console.log('✅ All database indexes created successfully');
  } catch (error: any) {
    console.error('❌ Error creating indexes:', error.message);
    // Don't throw - allow application to continue even if index creation fails
    // Indexes will be created on next startup or can be created manually
  }
}

