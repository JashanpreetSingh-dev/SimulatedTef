/**
 * Migration script to initialize D2C config with default values
 * Run with: npm run migrate-d2c-config
 * Or: tsx scripts/migrate-init-d2c-config.js
 */

import { MongoClient } from 'mongodb';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'tef_master';

if (!MONGODB_URI) {
  console.error('MONGODB_URI is required!');
  process.exit(1);
}

async function migrate() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(MONGODB_DB_NAME);
    const collection = db.collection('d2cConfigs');
    
    // Check if config already exists
    const existing = await collection.findOne({ _id: 'default' });
    
    if (existing) {
      console.log('D2C config already exists, skipping migration');
      console.log('Current config:', existing);
      return;
    }
    
    // Create default D2C config (Free tier baseline)
    const defaultConfig = {
      _id: 'default',
      sectionALimit: 1,
      sectionBLimit: 1,
      writtenExpressionSectionALimit: 1,
      writtenExpressionSectionBLimit: 1,
      mockExamLimit: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await collection.insertOne(defaultConfig);
    console.log('✅ D2C config initialized with default values:');
    console.log('  - Section A: 1/month');
    console.log('  - Section B: 1/month');
    console.log('  - Written Expression Section A: 1/month');
    console.log('  - Written Expression Section B: 1/month');
    console.log('  - Mock Exams: 1/month');
    
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
