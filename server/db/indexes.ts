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
    
    // Subscriptions collection indexes
    const subscriptionsCollection = db.collection('subscriptions');
    
    // Index for user subscription queries
    await subscriptionsCollection.createIndex(
      { userId: 1 },
      { name: 'userId_idx', unique: true }
    );
    console.log('✅ Created index: subscriptions.userId_idx');
    
    // Index for Stripe customer lookups
    await subscriptionsCollection.createIndex(
      { stripeCustomerId: 1 },
      { name: 'stripeCustomerId_idx' }
    );
    console.log('✅ Created index: subscriptions.stripeCustomerId_idx');
    
    // Index for pack expiry queries (find expired packs)
    await subscriptionsCollection.createIndex(
      { packExpirationDate: 1 },
      { name: 'packExpirationDate_idx' }
    );
    console.log('✅ Created index: subscriptions.packExpirationDate_idx');
    
    // Index for pack type queries (analytics)
    await subscriptionsCollection.createIndex(
      { packType: 1 },
      { name: 'packType_idx' }
    );
    console.log('✅ Created index: subscriptions.packType_idx');
    
    // Usage collection indexes
    const usageCollection = db.collection('usage');
    
    // Compound index for daily usage queries
    await usageCollection.createIndex(
      { userId: 1, date: 1 },
      { name: 'userId_date_idx', unique: true }
    );
    console.log('✅ Created index: usage.userId_date_idx');
    
    // Exam sessions collection indexes
    const examSessionsCollection = db.collection('examSessions');
    
    // Index for session validation
    await examSessionsCollection.createIndex(
      { sessionId: 1 },
      { name: 'sessionId_idx', unique: true }
    );
    console.log('✅ Created index: examSessions.sessionId_idx');
    
    // Compound index for user session queries
    await examSessionsCollection.createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'userId_createdAt_idx' }
    );
    console.log('✅ Created index: examSessions.userId_createdAt_idx');
    
    // Webhook events collection indexes
    const webhookEventsCollection = db.collection('webhookEvents');
    
    // Index for idempotency checks
    await webhookEventsCollection.createIndex(
      { eventId: 1 },
      { name: 'eventId_idx', unique: true }
    );
    console.log('✅ Created index: webhookEvents.eventId_idx');
    
    // Index for cleanup queries (processed events older than 30 days)
    await webhookEventsCollection.createIndex(
      { processed: 1, processedAt: 1 },
      { name: 'processed_processedAt_idx' }
    );
    console.log('✅ Created index: webhookEvents.processed_processedAt_idx');
    
    // API logs collection indexes
    const apiLogsCollection = db.collection('api_logs');
    
    // Compound index for user queries sorted by timestamp
    await apiLogsCollection.createIndex(
      { userId: 1, timestamp: -1 },
      { name: 'userId_timestamp_idx' }
    );
    console.log('✅ Created index: api_logs.userId_timestamp_idx');
    
    // Index for timestamp queries (for date range filtering)
    await apiLogsCollection.createIndex(
      { timestamp: -1 },
      { name: 'timestamp_idx' }
    );
    console.log('✅ Created index: api_logs.timestamp_idx');
    
    // Compound index for function name and timestamp
    await apiLogsCollection.createIndex(
      { functionName: 1, timestamp: -1 },
      { name: 'functionName_timestamp_idx' }
    );
    console.log('✅ Created index: api_logs.functionName_timestamp_idx');
    
    // Index for session tracking
    await apiLogsCollection.createIndex(
      { sessionId: 1, timestamp: -1 },
      { name: 'sessionId_timestamp_idx' }
    );
    console.log('✅ Created index: api_logs.sessionId_timestamp_idx');
    
    console.log('✅ All database indexes created successfully');
  } catch (error: any) {
    console.error('❌ Error creating indexes:', error.message);
    // Don't throw - allow application to continue even if index creation fails
    // Indexes will be created on next startup or can be created manually
  }
}

