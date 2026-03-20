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
    
    // Recordings collection indexes (S3 metadata storage)
    const recordingsCollection = db.collection('recordings');
    
    // Index for user audio queries
    await recordingsCollection.createIndex(
      { userId: 1 },
      { name: 'userId_idx' }
    );
    console.log('Created index: recordings.userId_idx');
    
    // Index for recent uploads
    await recordingsCollection.createIndex(
      { createdAt: -1 },
      { name: 'createdAt_idx' }
    );
    console.log('Created index: recordings.createdAt_idx');
    
    // Compound index for user's recent recordings
    await recordingsCollection.createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'userId_createdAt_idx' }
    );
    console.log('Created index: recordings.userId_createdAt_idx');
    
    // Index for S3 key lookups
    await recordingsCollection.createIndex(
      { s3Key: 1 },
      { name: 's3Key_idx', unique: true }
    );
    console.log('Created index: recordings.s3Key_idx');
    
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

    // Usage events collection (time-boundary for resubscribe same day)
    const usageEventsCollection = db.collection('usageEvents');
    await usageEventsCollection.createIndex(
      { userId: 1, date: 1, createdAt: 1 },
      { name: 'userId_date_createdAt_idx' }
    );
    console.log('Created index: usageEvents.userId_date_createdAt_idx');
    
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
    
    // Index for S3 key lookups in audioItems
    await audioItemsCollection.createIndex(
      { s3Key: 1 },
      { name: 's3Key_idx', sparse: true }
    );
    console.log(' Created index: audioItems.s3Key_idx');
    
    // Batches collection indexes
    const batchesCollection = db.collection('batches');
    
    // Index for finding professor's batches
    await batchesCollection.createIndex(
      { professorId: 1 },
      { name: 'professorId_idx' }
    );
    console.log(' Created index: batches.professorId_idx');
    
    // Index for finding student's batch (array index)
    await batchesCollection.createIndex(
      { studentIds: 1 },
      { name: 'studentIds_idx' }
    );
    console.log(' Created index: batches.studentIds_idx');
    
    // Unique index on batchId
    await batchesCollection.createIndex(
      { batchId: 1 },
      { name: 'batchId_idx', unique: true }
    );
    console.log(' Created index: batches.batchId_idx');
    
    // Index for org filtering
    await batchesCollection.createIndex(
      { orgId: 1 },
      { name: 'orgId_idx' }
    );
    console.log(' Created index: batches.orgId_idx');
    
    // BatchAssignments collection indexes
    const batchAssignmentsCollection = db.collection('batchAssignments');
    
    // Index for finding batch assignments
    await batchAssignmentsCollection.createIndex(
      { batchId: 1 },
      { name: 'batchId_idx' }
    );
    console.log(' Created index: batchAssignments.batchId_idx');
    
    // Index for finding batches with assignment
    await batchAssignmentsCollection.createIndex(
      { assignmentId: 1 },
      { name: 'assignmentId_idx' }
    );
    console.log(' Created index: batchAssignments.assignmentId_idx');
    
    // Index for org filtering
    await batchAssignmentsCollection.createIndex(
      { orgId: 1 },
      { name: 'orgId_idx' }
    );
    console.log(' Created index: batchAssignments.orgId_idx');
    
    // Compound index for checking if assignment already assigned to batch
    await batchAssignmentsCollection.createIndex(
      { batchId: 1, assignmentId: 1 },
      { name: 'batchId_assignmentId_idx', unique: true }
    );
    console.log(' Created index: batchAssignments.batchId_assignmentId_idx');
    
    // Unique index on batchAssignmentId
    await batchAssignmentsCollection.createIndex(
      { batchAssignmentId: 1 },
      { name: 'batchAssignmentId_idx', unique: true }
    );
    console.log(' Created index: batchAssignments.batchAssignmentId_idx');
    
    // Assignments collection indexes
    const assignmentsCollection = db.collection('assignments');
    
    // Unique index for primary lookup by assignmentId
    await assignmentsCollection.createIndex(
      { assignmentId: 1 },
      { name: 'assignmentId_idx', unique: true }
    );
    console.log(' Created index: assignments.assignmentId_idx');
    
    // Compound index for creator list sorted by createdAt
    await assignmentsCollection.createIndex(
      { createdBy: 1, createdAt: -1 },
      { name: 'createdBy_createdAt_idx' }
    );
    console.log(' Created index: assignments.createdBy_createdAt_idx');
    
    // Compound index for org list sorted by createdAt
    await assignmentsCollection.createIndex(
      { orgId: 1, createdAt: -1 },
      { name: 'orgId_createdAt_idx' }
    );
    console.log(' Created index: assignments.orgId_createdAt_idx');
    
    // Compound index for published list (status, type, orgId, createdAt)
    await assignmentsCollection.createIndex(
      { status: 1, type: 1, orgId: 1, createdAt: -1 },
      { name: 'status_type_orgId_createdAt_idx' }
    );
    console.log(' Created index: assignments.status_type_orgId_createdAt_idx');
    
    // Seed assignments counter if it does not exist (for existing DBs before counter was introduced)
    const countersCollection = db.collection<{ _id: string; seq: number }>('counters');
    const existingCounter = await countersCollection.findOne({ _id: 'assignments' });
    if (!existingCounter) {
      const assignmentDocs = await assignmentsCollection
        .find({ assignmentId: { $regex: /^assignment_\d+$/ } })
        .toArray();
      let maxNum = 0;
      for (const doc of assignmentDocs as any[]) {
        const match = doc.assignmentId?.match(/^assignment_(\d+)$/);
        if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
      }
      await countersCollection.insertOne({ _id: 'assignments', seq: maxNum });
      console.log(` Seeded assignments counter at seq=${maxNum}`);
    }
    
    // Conversation Logs collection indexes
    const conversationLogsCollection = db.collection('conversationLogs');
    
    // Compound index for user log queries sorted by start time
    await conversationLogsCollection.createIndex(
      { userId: 1, startedAt: -1 },
      { name: 'userId_startedAt_idx' }
    );
    console.log(' Created index: conversationLogs.userId_startedAt_idx');
    
    // Index for session detail queries
    await conversationLogsCollection.createIndex(
      { sessionId: 1 },
      { name: 'sessionId_idx' }
    );
    console.log(' Created index: conversationLogs.sessionId_idx');
    
    // Compound index for filtered queries by examType
    await conversationLogsCollection.createIndex(
      { userId: 1, examType: 1, startedAt: -1 },
      { name: 'userId_examType_startedAt_idx' }
    );
    console.log(' Created index: conversationLogs.userId_examType_startedAt_idx');
    
    // Compound index for filtering by part (A or B)
    await conversationLogsCollection.createIndex(
      { userId: 1, part: 1, startedAt: -1 },
      { name: 'userId_part_startedAt_idx' }
    );
    console.log(' Created index: conversationLogs.userId_part_startedAt_idx');

    // userNotifications: unique on userId+type for atomic "claim" (prevents duplicate subscription congrats)
    const userNotificationsCollection = db.collection('userNotifications');
    await userNotificationsCollection.createIndex(
      { userId: 1, type: 1 },
      { unique: true, name: 'userId_type_idx' }
    );
    console.log('Created index: userNotifications.userId_type_idx');

    // Warmup sessions collection indexes
    const warmupSessionsCollection = db.collection('warmupSessions');

    // One session per user per local date
    await warmupSessionsCollection.createIndex(
      { userId: 1, date: 1 },
      { name: 'userId_date_idx', unique: true }
    );
    console.log('Created index: warmupSessions.userId_date_idx');

    // Recent sessions per user
    await warmupSessionsCollection.createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'userId_createdAt_idx' }
    );
    console.log('Created index: warmupSessions.userId_createdAt_idx');

    // Status index (sparse to avoid indexing missing/legacy docs)
    await warmupSessionsCollection.createIndex(
      { status: 1 },
      { name: 'status_idx', sparse: true }
    );
    console.log('Created index: warmupSessions.status_idx');

    // Warmup user profiles collection indexes
    const warmupUserProfilesCollection = db.collection('warmupUserProfiles');

    await warmupUserProfilesCollection.createIndex(
      { userId: 1 },
      { name: 'userId_idx', unique: true }
    );
    console.log('Created index: warmupUserProfiles.userId_idx');

    console.log(' All database indexes created successfully');
  } catch (error: any) {
    console.error('Error creating indexes:', error.message);
    // Don't throw - allow application to continue even if index creation fails
    // Indexes will be created on next startup or can be created manually
  }
}

