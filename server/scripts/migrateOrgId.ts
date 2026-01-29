/**
 * Migration script to add orgId to existing conversation logs and results
 * 
 * Usage: 
 *   npm run migrate-org-id <orgId>
 * 
 * Example:
 *   npm run migrate-org-id org_37lRuQ13LuzztSgHNezjeGqirtG
 */

import 'dotenv/config';
import { connectDB } from '../db/connection';
import { createClerkClient } from '@clerk/backend';

const clerkSecretKey = process.env.CLERK_SECRET_KEY || '';
const clerkClient = clerkSecretKey ? createClerkClient({ secretKey: clerkSecretKey }) : null;

async function migrateOrgId(orgId: string) {
  if (!clerkClient) {
    console.error('❌ CLERK_SECRET_KEY not set. Cannot fetch organization members.');
    process.exit(1);
  }

  console.log(`🔄 Starting migration for organization: ${orgId}`);

  try {
    // Get all users in the organization
    console.log('📋 Fetching organization members...');
    const members = await clerkClient.organizations.getOrganizationMembershipList({
      organizationId: orgId,
    });

    const userIds = members.data
      .map((m) => m.publicUserData?.userId || '')
      .filter(Boolean);

    console.log(`✅ Found ${userIds.length} users in organization`);

    if (userIds.length === 0) {
      console.log('⚠️  No users found in organization. Nothing to migrate.');
      return;
    }

    const db = await connectDB();

    // Migrate conversation logs
    console.log('\n📝 Migrating conversation logs...');
    const conversationLogsResult = await db.collection('conversationLogs').updateMany(
      {
        userId: { $in: userIds },
        orgId: { $exists: false }, // Only update records without orgId
      },
      {
        $set: { orgId },
      }
    );
    console.log(`✅ Updated ${conversationLogsResult.modifiedCount} conversation logs`);

    // Migrate results
    console.log('\n📊 Migrating results...');
    const resultsResult = await db.collection('results').updateMany(
      {
        userId: { $in: userIds },
        orgId: { $exists: false }, // Only update records without orgId
      },
      {
        $set: { orgId },
      }
    );
    console.log(`✅ Updated ${resultsResult.modifiedCount} results`);

    // Migrate usage records
    console.log('\n📈 Migrating usage records...');
    const usageResult = await db.collection('usage').updateMany(
      {
        userId: { $in: userIds },
        orgId: { $exists: false }, // Only update records without orgId
      },
      {
        $set: { orgId },
      }
    );
    console.log(`✅ Updated ${usageResult.modifiedCount} usage records`);

    // Migrate exam sessions
    console.log('\n🎯 Migrating exam sessions...');
    const examSessionsResult = await db.collection('examSessions').updateMany(
      {
        userId: { $in: userIds },
        orgId: { $exists: false }, // Only update records without orgId
      },
      {
        $set: { orgId },
      }
    );
    console.log(`✅ Updated ${examSessionsResult.modifiedCount} exam sessions`);

    console.log('\n✨ Migration completed successfully!');
    console.log('\nSummary:');
    console.log(`  - Conversation logs: ${conversationLogsResult.modifiedCount}`);
    console.log(`  - Results: ${resultsResult.modifiedCount}`);
    console.log(`  - Usage records: ${usageResult.modifiedCount}`);
    console.log(`  - Exam sessions: ${examSessionsResult.modifiedCount}`);
    console.log(`  - Total records updated: ${conversationLogsResult.modifiedCount + resultsResult.modifiedCount + usageResult.modifiedCount + examSessionsResult.modifiedCount}`);

  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Get orgId from command line arguments
const orgId = process.argv[2];

if (!orgId) {
  console.error('❌ Please provide an organization ID as an argument');
  console.error('Usage: ts-node server/scripts/migrateOrgId.ts <orgId>');
  console.error('Example: ts-node server/scripts/migrateOrgId.ts org_37lRuQ13LuzztSgHNezjeGqirtG');
  process.exit(1);
}

if (!orgId.startsWith('org_')) {
  console.error('❌ Invalid organization ID format. Should start with "org_"');
  process.exit(1);
}

migrateOrgId(orgId);
