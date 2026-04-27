/**
 * Quiz notification service — creates in-app notifications when D2C users
 * complete every 5th non-mock practice result, aggregating weaknesses for
 * targeted quiz generation.
 */

import { connectDB } from '../db/connection';

/**
 * Check whether a quiz notification should be created for this user and, if
 * so, insert one into the quiz_notifications collection.
 *
 * Called fire-and-forget after a non-mock result is saved. Must never throw
 * — errors are swallowed so result saving is never interrupted.
 */
export async function checkAndCreateQuizNotification(
  userId: string,
  newResultId: string,
): Promise<void> {
  try {
    const db = await connectDB();

    // 1. D2C gate — if the user has an orgId they are B2B; skip.
    const existingUsage = await db.collection('usage').findOne({ userId });
    const hasOrgId =
      existingUsage?.orgId !== null && existingUsage?.orgId !== undefined;
    if (hasOrgId) return;

    // 2. Count non-mock results for the user.
    const count = await db
      .collection('results')
      .countDocuments({ userId, mockExamId: { $exists: false } });
    if (count === 0 || count % 5 !== 0) return;

    // 3. Fetch last 5 non-mock results (most recent first), project only
    //    _id and evaluation.weaknesses.
    const last5 = await db
      .collection('results')
      .find(
        { userId, mockExamId: { $exists: false } },
        { projection: { _id: 1, 'evaluation.weaknesses': 1 } },
      )
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();

    // 4. Flatten & deduplicate weaknesses.
    const weaknesses = [
      ...new Set(
        last5.flatMap(
          (r) =>
            (r.evaluation?.weaknesses as string[] | undefined) ?? [],
        ),
      ),
    ];
    if (weaknesses.length === 0) return;

    // 5. Insert quiz notification.
    const resultIds = last5.map((r) => String(r._id));
    await db.collection('quiz_notifications').insertOne({
      userId,
      status: 'unread',
      quizGenerated: false,
      resultIds,
      weaknesses,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Never throw — this runs fire-and-forget after result saving.
  }
}
