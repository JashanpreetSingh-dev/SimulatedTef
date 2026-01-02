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
    
    console.log('Creating database indexes...');
    
    // Results collection indexes
    const resultsCollection = db.collection('results');
    
    // Compound index for user queries sorted by timestamp
    await resultsCollection.createIndex(
      { userId: 1, timestamp: -1 },
      { name: 'userId_timestamp_idx' }
    );
    console.log('Created index: results.userId_timestamp_idx');
    
    // Alternative sorting by createdAt
    await resultsCollection.createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'userId_createdAt_idx' }
    );
    console.log('Created index: results.userId_createdAt_idx');
    
    // Index for filtering by exam mode
    await resultsCollection.createIndex(
      { mode: 1, timestamp: -1 },
      { name: 'mode_timestamp_idx' }
    );
    console.log('Created index: results.mode_timestamp_idx');
    
    // Ensure _id index exists (should already exist, but verify)
    await resultsCollection.createIndex(
      { _id: 1 },
      { name: '_id_idx' }
    );
    console.log('Verified index: results._id_idx');
    
    // GridFS recordings collection indexes
    const recordingsCollection = db.collection('recordings.files');
    
    // Index for user audio queries
    await recordingsCollection.createIndex(
      { 'metadata.userId': 1 },
      { name: 'metadata_userId_idx' }
    );
    console.log('Created index: recordings.metadata.userId_idx');
    
    // Index for recent uploads
    await recordingsCollection.createIndex(
      { uploadDate: -1 },
      { name: 'uploadDate_idx' }
    );
    console.log('Created index: recordings.uploadDate_idx');
    
    // Compound index for user's recent recordings
    await recordingsCollection.createIndex(
      { 'metadata.userId': 1, uploadDate: -1 },
      { name: 'metadata_userId_uploadDate_idx' }
    );
    console.log('Created index: recordings.metadata.userId_uploadDate_idx');
    
    // Subscriptions collection indexes
    const subscriptionsCollection = db.collection('subscriptions');
    
    // Index for user subscription queries
    await subscriptionsCollection.createIndex(
      { userId: 1 },
      { name: 'userId_idx', unique: true }
    );
    console.log('Created index: subscriptions.userId_idx');
    
    // Index for Stripe customer lookups
    await subscriptionsCollection.createIndex(
      { stripeCustomerId: 1 },
      { name: 'stripeCustomerId_idx' }
    );
    console.log('Created index: subscriptions.stripeCustomerId_idx');
    
    // Index for pack expiry queries (find expired packs)
    await subscriptionsCollection.createIndex(
      { packExpirationDate: 1 },
      { name: 'packExpirationDate_idx' }
    );
    console.log('Created index: subscriptions.packExpirationDate_idx');
    
    // Index for pack type queries (analytics)
    await subscriptionsCollection.createIndex(
      { packType: 1 },
      { name: 'packType_idx' }
    );
    console.log('Created index: subscriptions.packType_idx');
    
    // Usage collection indexes
    const usageCollection = db.collection('usage');
    
    // Compound index for daily usage queries
    await usageCollection.createIndex(
      { userId: 1, date: 1 },
      { name: 'userId_date_idx', unique: true }
    );
    console.log('Created index: usage.userId_date_idx');
    
    // Exam sessions collection indexes
    const examSessionsCollection = db.collection('examSessions');
    
    // Index for session validation
    await examSessionsCollection.createIndex(
      { sessionId: 1 },
      { name: 'sessionId_idx', unique: true }
    );
    console.log('Created index: examSessions.sessionId_idx');
    
    // Compound index for user session queries
    await examSessionsCollection.createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'userId_createdAt_idx' }
    );
    console.log('Created index: examSessions.userId_createdAt_idx');
    
    // Webhook events collection indexes
    const webhookEventsCollection = db.collection('webhookEvents');
    
    // Index for idempotency checks
    await webhookEventsCollection.createIndex(
      { eventId: 1 },
      { name: 'eventId_idx', unique: true }
    );
    console.log('Created index: webhookEvents.eventId_idx');
    
    // Index for cleanup queries (processed events older than 30 days)
    await webhookEventsCollection.createIndex(
      { processed: 1, processedAt: 1 },
      { name: 'processed_processedAt_idx' }
    );
    console.log('Created index: webhookEvents.processed_processedAt_idx');
    
    // Reading Tasks collection indexes
    const readingTasksCollection = db.collection('readingTasks');
    
    // Unique index on taskId
    await readingTasksCollection.createIndex(
      { taskId: 1 },
      { name: 'taskId_idx', unique: true }
    );
    console.log('Created index: readingTasks.taskId_idx');
    
    // Compound index for filtering active tasks by type
    await readingTasksCollection.createIndex(
      { isActive: 1, type: 1 },
      { name: 'isActive_type_idx' }
    );
    console.log('Created index: readingTasks.isActive_type_idx');
    
    // Listening Tasks collection indexes
    const listeningTasksCollection = db.collection('listeningTasks');
    
    // Unique index on taskId
    await listeningTasksCollection.createIndex(
      { taskId: 1 },
      { name: 'taskId_idx', unique: true }
    );
    console.log('Created index: listeningTasks.taskId_idx');
    
    // Compound index for filtering active tasks by type
    await listeningTasksCollection.createIndex(
      { isActive: 1, type: 1 },
      { name: 'isActive_type_idx' }
    );
    console.log('Created index: listeningTasks.isActive_type_idx');
    
    // Questions collection indexes
    const questionsCollection = db.collection('questions');
    
    // Compound index for fetching questions by taskId sorted by questionNumber
    await questionsCollection.createIndex(
      { taskId: 1, questionNumber: 1 },
      { name: 'taskId_questionNumber_idx' }
    );
    console.log('Created index: questions.taskId_questionNumber_idx');
    
    // Unique index on questionId
    await questionsCollection.createIndex(
      { questionId: 1 },
      { name: 'questionId_idx', unique: true }
    );
    console.log('Created index: questions.questionId_idx');
    
    // Index for filtering active questions
    await questionsCollection.createIndex(
      { isActive: 1 },
      { name: 'isActive_idx' }
    );
    console.log('Created index: questions.isActive_idx');
    
    // Results collection - add indexes for mock exam results
    // Unique constraint for sessionId + module (prevents duplicate results per module)
    // Only applies to documents with sessionId (mock exams), not practice exams
    try {
      // Drop the old index if it exists (to handle migration)
      await resultsCollection.dropIndex('sessionId_module_idx').catch(() => {
        // Index might not exist, ignore error
      });
    } catch (error) {
      // Ignore errors when dropping index
    }
    
    await resultsCollection.createIndex(
      { sessionId: 1, module: 1 },
      { 
        name: 'sessionId_module_idx', 
        unique: true, 
        partialFilterExpression: { sessionId: { $exists: true, $type: 'string' } }
      }
    );
    console.log('Created index: results.sessionId_module_idx (partial, only for mock exams)');
    
    // Index for querying results by mockExamId
    await resultsCollection.createIndex(
      { mockExamId: 1, createdAt: -1 },
      { name: 'mockExamId_createdAt_idx', sparse: true }
    );
    console.log('Created index: results.mockExamId_createdAt_idx');
    
    // Compound index for querying results by userId + mockExamId (critical for /mock/status endpoint)
    await resultsCollection.createIndex(
      { userId: 1, mockExamId: 1 },
      { name: 'userId_mockExamId_idx', sparse: true }
    );
    console.log('Created index: results.userId_mockExamId_idx');
    
    // Compound index for querying results by userId + mockExamId + module
    await resultsCollection.createIndex(
      { userId: 1, mockExamId: 1, module: 1 },
      { name: 'userId_mockExamId_module_idx', sparse: true }
    );
    console.log('Created index: results.userId_mockExamId_module_idx');
    
    // Exam Sessions collection - add indexes for mock exam sessions
    await examSessionsCollection.createIndex(
      { mockExamId: 1, userId: 1 },
      { name: 'mockExamId_userId_idx', sparse: true }
    );
    console.log('Created index: examSessions.mockExamId_userId_idx');
    
    // Usage collection - add indexes for mock exam tracking
    await usageCollection.createIndex(
      { activeMockExamId: 1 },
      { name: 'activeMockExamId_idx', sparse: true }
    );
    console.log('Created index: usage.activeMockExamId_idx');
    
    // Mock Exams indexes
    await db.collection('mockExams').createIndex(
      { mockExamId: 1 },
      { unique: true, name: 'mockExamId_idx' }
    );
    console.log('Created index: mockExams.mockExamId_idx');
    
    await db.collection('mockExams').createIndex(
      { isActive: 1 },
      { name: 'isActive_idx' }
    );
    console.log(' Created index: mockExams.isActive_idx');
    
    // AudioItems collection indexes
    const audioItemsCollection = db.collection('audioItems');
    
    // Compound index for querying and sorting audioItems by taskId, sectionId, and audioId
    // This index supports the query pattern: find({ taskId }).sort({ sectionId: 1, audioId: 1 })
    await audioItemsCollection.createIndex(
      { taskId: 1, sectionId: 1, audioId: 1 },
      { name: 'taskId_sectionId_audioId_idx' }
    );
    console.log(' Created index: audioItems.taskId_sectionId_audioId_idx');
    
    // Unique index on audioId + taskId (ensures no duplicate audio items per task)
    await audioItemsCollection.createIndex(
      { taskId: 1, audioId: 1 },
      { name: 'taskId_audioId_idx', unique: true }
    );
    console.log(' Created index: audioItems.taskId_audioId_idx');
    
    console.log(' All database indexes created successfully');
  } catch (error: any) {
    console.error('Error creating indexes:', error.message);
    // Don't throw - allow application to continue even if index creation fails
    // Indexes will be created on next startup or can be created manually
  }
}

