/**
 * Migration script to initialize subscription tiers and set all D2C users to free tier
 * Run with: npm run migrate-subscriptions
 * Or: tsx scripts/migrate-init-subscriptions.js
 */

import { MongoClient } from 'mongodb';
import { createClerkClient } from '@clerk/backend';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'tef_master';
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is required!');
  process.exit(1);
}

if (!CLERK_SECRET_KEY) {
  console.error('CLERK_SECRET_KEY is required!');
  process.exit(1);
}

const clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });

async function migrate() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(MONGODB_DB_NAME);
    const tiersCollection = db.collection('subscriptionTiers');
    const subscriptionsCollection = db.collection('subscriptions');
    
    // Initialize subscription tiers (price → tier mapping is via STRIPE_PRICE_ID_BASIC / STRIPE_PRICE_ID_PREMIUM in .env only)
    const defaultTiers = [
      {
        id: 'free',
        name: 'Free',
        limits: {
          sectionALimit: 1,
          sectionBLimit: 1,
          writtenExpressionSectionALimit: 1,
          writtenExpressionSectionBLimit: 1,
          mockExamLimit: 1,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'basic',
        name: 'Basic',
        limits: {
          sectionALimit: 10,
          sectionBLimit: 10,
          writtenExpressionSectionALimit: 10,
          writtenExpressionSectionBLimit: 10,
          mockExamLimit: 5,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'premium',
        name: 'Premium',
        limits: {
          sectionALimit: 30,
          sectionBLimit: 30,
          writtenExpressionSectionALimit: 30,
          writtenExpressionSectionBLimit: 30,
          mockExamLimit: 10,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const tier of defaultTiers) {
      const existing = await tiersCollection.findOne({ id: tier.id });
      if (!existing) {
        await tiersCollection.insertOne(tier);
        console.log(`✅ Created subscription tier: ${tier.name}`);
      } else {
        console.log(`⏭️  Subscription tier ${tier.name} already exists, skipping`);
      }
    }
    
    // Find all D2C users (users without organization membership)
    console.log('\nFinding D2C users (users without organization membership)...');
    
    // Get all users from Clerk
    let allUsers = [];
    let hasMore = true;
    let offset = 0;
    
    while (hasMore) {
      const response = await clerkClient.users.getUserList({ limit: 500, offset });
      allUsers = [...allUsers, ...response.data];
      hasMore = response.data.length === 500;
      offset += 500;
    }
    
    console.log(`Found ${allUsers.length} total users in Clerk`);
    
    // Filter D2C users (no org membership)
    const d2cUserIds = [];
    
    for (const user of allUsers) {
      try {
        const memberships = await clerkClient.users.getOrganizationMembershipList({
          userId: user.id,
        });
        
        if (memberships.data.length === 0) {
          d2cUserIds.push(user.id);
        }
      } catch (error) {
        console.error(`Error checking memberships for user ${user.id}:`, error);
      }
    }
    
    console.log(`Found ${d2cUserIds.length} D2C users (no organization membership)`);
    
    // Set all D2C users to free tier
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const userId of d2cUserIds) {
      const existing = await subscriptionsCollection.findOne({ userId });
      if (!existing) {
        const subscription = {
          userId,
          tier: 'free',
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await subscriptionsCollection.insertOne(subscription);
        createdCount++;
      } else {
        skippedCount++;
      }
    }
    
    console.log(`\n✅ Migration completed:`);
    console.log(`  - Created ${createdCount} free tier subscriptions for D2C users`);
    console.log(`  - Skipped ${skippedCount} users who already have subscriptions`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

migrate()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
