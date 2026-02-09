/**
 * Clear Database Script
 * WARNING: This will delete ALL data from the database!
 * Use with caution - this is irreversible.
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'tef_master';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set. Exiting.');
  process.exit(1);
}

async function clearDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB_NAME);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📋 Found ${collections.length} collections:`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });

    // Confirm before proceeding
    console.log(`\n⚠️  WARNING: This will DELETE ALL DATA from database: ${MONGODB_DB_NAME}`);
    console.log('⚠️  This action is IRREVERSIBLE!\n');

    // In a real scenario, you might want to add a confirmation prompt
    // For now, we'll proceed (you can add readline if needed)
    
    // Delete all collections
    console.log('🗑️  Deleting all collections...');
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
      console.log(`   ✅ Cleared: ${collection.name}`);
    }

    // Drop all collections to remove indexes and metadata
    console.log('\n🗑️  Dropping all collections...');
    for (const collection of collections) {
      await db.collection(collection.name).drop().catch(err => {
        // Ignore errors if collection doesn't exist
        if (err.code !== 26) {
          console.warn(`   ⚠️  Could not drop ${collection.name}:`, err.message);
        }
      });
      console.log(`   ✅ Dropped: ${collection.name}`);
    }

    console.log('\n✅ Database cleared successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run migrate:init-d2c-config');
    console.log('   2. Run: npm run migrate:init-subscriptions');
    console.log('   (Or use: node scripts/migrate-init-d2c-config.js)');
    console.log('   (Or use: node scripts/migrate-init-subscriptions.js)');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
clearDatabase()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
