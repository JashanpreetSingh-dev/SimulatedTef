/**
 * Script to clear all mock exam related data
 *
 * This script removes:
 * - All mock exams from mockExams collection
 * - All mock exam sessions from examSessions collection
 * - Mock exam related fields from usage collection
 * - Mock exam results from results collection
 *
 * Usage: npm run clear-mock-data
 */

import 'dotenv/config';
import { connectDB } from '../db/connection';

async function clearMockData(): Promise<void> {
  try {
    console.log('🧹 Starting mock exam data cleanup...\n');

    const db = await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // 1. Clear mock exams collection
    console.log('📋 Clearing mock exams collection...');
    const mockExamsDeleted = await db.collection('mockExams').deleteMany({});
    console.log(`   ✅ Deleted ${mockExamsDeleted.deletedCount} mock exams`);

    // 2. Clear mock exam sessions
    console.log('\n📝 Clearing mock exam sessions...');
    const sessionsDeleted = await db.collection('examSessions').deleteMany({
      examType: 'mock'
    });
    console.log(`   ✅ Deleted ${sessionsDeleted.deletedCount} mock exam sessions`);

    // 3. Clear mock exam results
    console.log('\n📊 Clearing mock exam results...');
    const resultsDeleted = await db.collection('results').deleteMany({
      mockExamId: { $exists: true, $ne: null }
    });
    console.log(`   ✅ Deleted ${resultsDeleted.deletedCount} mock exam results`);

    // 4. Clear mock exam fields from usage collection
    console.log('\n👤 Clearing mock exam data from user usage records...');
    const usageUpdated = await db.collection('usage').updateMany(
      {},
      {
        $unset: {
          activeMockExamId: '',
          activeMockExamSessionId: '',
          completedMockExamIds: []
        }
      }
    );
    console.log(`   ✅ Updated ${usageUpdated.modifiedCount} user usage records`);

    // 5. Optional: Clear any mock exam recordings
    console.log('\n🎙️ Checking for mock exam recordings...');
    const recordingsDeleted = await db.collection('recordings').deleteMany({
      'metadata.mockExamId': { $exists: true, $ne: null }
    });
    console.log(`   ✅ Deleted ${recordingsDeleted.deletedCount} mock exam recordings`);

    console.log('\n🎉 Mock exam data cleanup completed successfully!');
    console.log('\n💡 You can now run: npm run seed-mock-exams');

    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Cleanup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
clearMockData();

export { clearMockData };