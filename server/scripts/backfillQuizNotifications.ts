/**
 * One-time backfill script: create quiz_notifications for existing premium/basic
 * D2C users who already have >= 5 non-mock results.
 *
 * Idempotent — skips users who already have quiz_notifications.
 *
 * Usage:
 *   npx tsx server/scripts/backfillQuizNotifications.ts
 */

import 'dotenv/config';
import { connectDB, closeDB } from '../db/connection';

async function backfill() {
  const db = await connectDB();

  // 1. Find paid D2C subscribers (basic or premium).
  const subscriptions = await db
    .collection('subscriptions')
    .find({ tier: { $in: ['basic', 'premium'] } })
    .toArray();

  console.log(`Found ${subscriptions.length} paid subscriptions to check.`);

  let created = 0;
  let skipped = 0;

  for (const sub of subscriptions) {
    const userId: string = sub.userId;

    // 2. D2C gate — skip if user has orgId in usage.
    const usage = await db.collection('usage').findOne({ userId });
    const hasOrgId = usage?.orgId !== null && usage?.orgId !== undefined;
    if (hasOrgId) {
      skipped++;
      continue;
    }

    // 3. Skip if user already has quiz_notifications (idempotent).
    const existing = await db
      .collection('quiz_notifications')
      .countDocuments({ userId });
    if (existing > 0) {
      skipped++;
      continue;
    }

    // 4. Fetch all non-mock results, sorted oldest first.
    const results = await db
      .collection('results')
      .find(
        { userId, mockExamId: { $exists: false } },
        { projection: { _id: 1, 'evaluation.weaknesses': 1, timestamp: 1 } },
      )
      .sort({ timestamp: 1 })
      .toArray();

    // 5. Group into chunks of 5 and create notifications.
    const chunkSize = 5;
    for (let i = 0; i + chunkSize <= results.length; i += chunkSize) {
      const chunk = results.slice(i, i + chunkSize);
      const weaknesses = [
        ...new Set(
          chunk.flatMap(
            (r) =>
              (r.evaluation?.weaknesses as string[] | undefined) ?? [],
          ),
        ),
      ];
      if (weaknesses.length === 0) continue;

      const resultIds = chunk.map((r) => String(r._id));
      await db.collection('quiz_notifications').insertOne({
        userId,
        status: 'unread',
        quizGenerated: false,
        resultIds,
        weaknesses,
        createdAt: new Date().toISOString(),
      });
      created++;
    }
  }

  console.log(
    `Backfill complete. Created: ${created} notifications, Skipped: ${skipped} users.`,
  );

  await closeDB();
}

backfill().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
