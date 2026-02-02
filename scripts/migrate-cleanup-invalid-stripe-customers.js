/**
 * Migration script to clean up invalid Stripe customer IDs
 * 
 * This script:
 * 1. Finds all subscriptions with stripeCustomerId
 * 2. Verifies each customer exists in Stripe
 * 3. Removes invalid customer IDs (from different Stripe environment/account)
 * 
 * Run with: npm run migrate-cleanup-stripe-customers
 */

import 'dotenv/config';
import { MongoClient } from 'mongodb';
import Stripe from 'stripe';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'tef_master';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not set. Exiting migration.');
  process.exit(1);
}

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not set. Exiting migration.');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

async function cleanupInvalidStripeCustomers() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(MONGODB_DB_NAME);
    const subscriptionsCollection = db.collection('subscriptions');

    // Find all subscriptions with stripeCustomerId
    const subscriptions = await subscriptionsCollection.find({
      stripeCustomerId: { $exists: true, $ne: null }
    }).toArray();

    console.log(`\n📊 Found ${subscriptions.length} subscriptions with Stripe customer IDs`);

    if (subscriptions.length === 0) {
      console.log('✅ No subscriptions with customer IDs to verify');
      return;
    }

    let validCount = 0;
    let invalidCount = 0;
    let errorCount = 0;

    for (const subscription of subscriptions) {
      const customerId = subscription.stripeCustomerId;
      const userId = subscription.userId;

      try {
        // Try to retrieve customer from Stripe
        await stripe.customers.retrieve(customerId);
        validCount++;
        console.log(`✅ Customer ${customerId} (user: ${userId}) is valid`);
      } catch (error) {
        if (error.code === 'resource_missing') {
          // Customer doesn't exist in Stripe
          console.log(`❌ Customer ${customerId} (user: ${userId}) not found in Stripe - removing from database`);
          
          // Remove the invalid customer ID (but keep the subscription)
          await subscriptionsCollection.updateOne(
            { _id: subscription._id },
            { 
              $unset: { stripeCustomerId: '' },
              $set: { updatedAt: new Date().toISOString() }
            }
          );
          
          invalidCount++;
        } else {
          // Other error (network, etc.)
          console.error(`⚠️  Error checking customer ${customerId} (user: ${userId}):`, error.message);
          errorCount++;
        }
      }
    }

    console.log('\n📊 Cleanup Summary:');
    console.log(`  ✅ Valid customers: ${validCount}`);
    console.log(`  ❌ Invalid customers removed: ${invalidCount}`);
    console.log(`  ⚠️  Errors: ${errorCount}`);
    console.log(`\n✅ Cleanup completed!`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await client.close();
    console.log('✅ Disconnected from MongoDB');
  }
}

cleanupInvalidStripeCustomers()
  .then(() => {
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
