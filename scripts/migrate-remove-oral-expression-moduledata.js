/**
 * Migration Script: Remove redundant moduleData for oral expression
 * 
 * This script removes redundant sectionA/sectionB fields from moduleData
 * for oral expression results, since transcript and evaluation are already
 * stored at the top level.
 * 
 * Run with: node scripts/migrate-remove-oral-expression-moduledata.js
 * 
 * Safety: This script only removes redundant data that's already at the top level,
 * so it's safe to run multiple times.
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

async function migrate() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // Get database name from env or use default (matching server.ts)
    const dbName = process.env.MONGODB_DB_NAME || 'tef_master';
    const db = client.db(dbName);
    const resultsCollection = db.collection('results');
    
    console.log(`📂 Using database: ${dbName}`);
    
    // Check if collection exists and has any documents
    const totalDocs = await resultsCollection.countDocuments({});
    console.log(`🔍 Debug: Total documents in results collection: ${totalDocs}`);
    
    // Debug: Check total oral expression results
    const totalOralExpression = await resultsCollection.countDocuments({
      $or: [
        { module: 'oralExpression' },
        { 'moduleData.type': 'oralExpression' }
      ]
    });
    console.log(`\n🔍 Debug: Found ${totalOralExpression} total oral expression results`);
    
    // Debug: Check results with sectionA/sectionB
    const withSectionData = await resultsCollection.countDocuments({
      $or: [
        { 'moduleData.sectionA': { $exists: true } },
        { 'moduleData.sectionB': { $exists: true } }
      ]
    });
    console.log(`🔍 Debug: Found ${withSectionData} results with moduleData.sectionA or sectionB`);
    
    // Debug: Sample a few documents to see their structure
    const sampleDocs = await resultsCollection.find({}).limit(3).toArray();
    console.log(`\n🔍 Debug: Sample documents structure:`);
    sampleDocs.forEach((doc, idx) => {
      console.log(`  Doc ${idx + 1}: module=${doc.module}, has moduleData=${!!doc.moduleData}, moduleData.type=${doc.moduleData?.type}`);
      if (doc.moduleData?.sectionA) {
        console.log(`    - Has moduleData.sectionA`);
      }
      if (doc.moduleData?.sectionB) {
        console.log(`    - Has moduleData.sectionB`);
      }
    });
    
    // Find all oral expression results with redundant moduleData
    // Check both by module field and by moduleData.type, and ensure sectionA/sectionB exists
    const resultsWithRedundantData = await resultsCollection.find({
      $and: [
        {
          $or: [
            { module: 'oralExpression' },
            { 'moduleData.type': 'oralExpression' }
          ]
        },
        {
          $or: [
            { 'moduleData.sectionA': { $exists: true } },
            { 'moduleData.sectionB': { $exists: true } }
          ]
        }
      ]
    }).toArray();
    
    console.log(`\n📊 Found ${resultsWithRedundantData.length} oral expression results with redundant moduleData`);
    
    if (resultsWithRedundantData.length === 0) {
      console.log('✅ No results need migration');
      return;
    }
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const result of resultsWithRedundantData) {
      try {
        // Verify that top-level transcript and evaluation exist (safety check)
        if (!result.transcript && !result.evaluation) {
          console.warn(`  ⚠️  Skipping ${result._id}: No top-level transcript or evaluation found`);
          skipped++;
          continue;
        }
        
        // Remove moduleData entirely for oral expression (not needed)
        await resultsCollection.updateOne(
          { _id: result._id },
          {
            $unset: {
              'moduleData': ''
            },
            $set: {
              updatedAt: new Date().toISOString()
            }
          }
        );
        
        migrated++;
        if (migrated % 10 === 0) {
          console.log(`  ✅ Migrated ${migrated} results...`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${result._id}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n📈 Migration Summary:`);
    console.log(`   ✅ Migrated: ${migrated} results`);
    console.log(`   ⏭️  Skipped: ${skipped} results (no top-level data)`);
    console.log(`   ❌ Errors: ${errors} results`);
    
    // Estimate storage saved
    // Each sectionA/sectionB contains ~25KB of duplicate data (transcript + evaluation)
    const estimatedKB = Math.round(migrated * 25);
    console.log(`\n💾 Estimated storage saved: ~${estimatedKB} KB (assuming ~25KB per duplicate)`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Migration completed');
  }
}

// Run migration
migrate().catch(console.error);
