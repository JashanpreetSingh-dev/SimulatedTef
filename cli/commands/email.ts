/**
 * Email notifications CLI commands
 *
 * Allows manual triggering of welcome and subscription congratulation emails.
 */

import yargs from 'yargs';
import { createClerkClient } from '@clerk/backend';
import { connectDB, closeDB } from '../../server/db/connection';
import { enqueueEmailJob } from '../../server/jobs/emailQueue';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function ensureDb(): Promise<void> {
  try {
    await connectDB();
  } catch (error: any) {
    console.error('❌ Failed to connect to database:', error?.message || error);
    process.exit(1);
  }
}

export async function sendWelcomeEmailCommand(argv: any): Promise<void> {
  const { userId, email, firstName } = argv;

  if (!userId || typeof userId !== 'string') {
    console.error('❌ --user-id is required');
    process.exit(1);
  }

  try {
    await ensureDb();

    await enqueueEmailJob({
      templateKind: 'welcome',
      userId,
      email,
      firstName,
    });

    console.log(`✅ Enqueued welcome email for user ${userId}${email ? ` <${email}>` : ''}`);
    await closeDB();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error enqueuing welcome email:', error?.message || error);
    await closeDB().catch(() => {});
    process.exit(1);
  }
}

export async function sendSubscriptionCongratsEmailCommand(argv: any): Promise<void> {
  const { userId, email, firstName, tierId, tierName, periodStart, periodEnd } = argv;

  if (!userId || typeof userId !== 'string') {
    console.error('❌ --user-id is required');
    process.exit(1);
  }
  if (!tierId || typeof tierId !== 'string') {
    console.error('❌ --tier-id is required (e.g. basic, premium)');
    process.exit(1);
  }

  try {
    await ensureDb();

    await enqueueEmailJob({
      templateKind: 'subscription_congrats',
      userId,
      email,
      firstName,
      tierId,
      tierName,
      periodStart,
      periodEnd,
    });

    console.log(
      `✅ Enqueued subscription congrats email for user ${userId} (tier: ${tierId}${
        tierName ? ` / ${tierName}` : ''
      })`
    );
    await closeDB();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error enqueuing subscription congrats email:', error?.message || error);
    await closeDB().catch(() => {});
    process.exit(1);
  }
}

export async function sendSubscriptionCongratsAllCommand(argv: any): Promise<void> {
  const dryRun = Boolean(argv['dry-run']);

  try {
    await ensureDb();
    const db = await connectDB();

    const subscriptions = (await db
      .collection('subscriptions')
      .find({
        tier: { $ne: 'free' },
      })
      .toArray()) as any[];

    if (!subscriptions.length) {
      console.log('ℹ️ No paid subscriptions found (tier != "free").');
      await closeDB();
      process.exit(0);
    }

    if (dryRun) {
      console.log(
        `🔎 Dry run: would enqueue subscription congrats for ${subscriptions.length} subscribers:`
      );
      for (const sub of subscriptions) {
        console.log(
          ` - userId=${sub.userId}, tier=${sub.tier}, status=${sub.status ?? 'unknown'}`
        );
      }
      await closeDB();
      process.exit(0);
    }

    let count = 0;
    for (const sub of subscriptions) {
      // Simple rate limiting: sleep 2 seconds between enqueues
      if (count > 0) {
        await sleep(2000);
      }

      await enqueueEmailJob({
        templateKind: 'subscription_congrats',
        userId: sub.userId,
        tierId: sub.tier,
        // tierName is optional; template will derive a label from tierId if missing
        periodStart: sub.currentPeriodStart,
        periodEnd: sub.currentPeriodEnd,
      });
      count += 1;
    }

    console.log(`✅ Enqueued subscription congrats email for ${count} subscribers.`);
    await closeDB();
    process.exit(0);
  } catch (error: any) {
    console.error(
      '❌ Error enqueuing subscription congrats emails for all subscribers:',
      error?.message || error
    );
    await closeDB().catch(() => {});
    process.exit(1);
  }
}

export async function sendGoodFridayPromoAllCommand(argv: any): Promise<void> {
  const dryRun = Boolean(argv['dry-run']);
  const force = Boolean(argv['force']);

  try {
    await ensureDb();
    const db = await connectDB();

    const subscriptions = (await db
      .collection('subscriptions')
      .find({ tier: 'free' })
      .toArray()) as any[];

    if (!subscriptions.length) {
      console.log('ℹ️ No free-tier users found.');
      await closeDB();
      process.exit(0);
    }

    if (dryRun) {
      console.log(
        `🔎 Dry run: would enqueue Good Friday promo for ${subscriptions.length} free-tier users:`
      );

      // Build email map from userNotifications (welcome emails store the address)
      const notifications = (await db
        .collection('userNotifications')
        .find({ userId: { $in: subscriptions.map((s: any) => s.userId) }, type: 'welcome' })
        .toArray()) as any[];
      const emailByUserId: Record<string, string> = Object.fromEntries(
        notifications.map((n: any) => [n.userId, n.email])
      );

      // For users still missing an email, batch fetch from Clerk
      const unknownUserIds = subscriptions
        .map((s: any) => s.userId)
        .filter((id: string) => !emailByUserId[id]);

      if (unknownUserIds.length > 0) {
        const clerkSecretKey = process.env.CLERK_SECRET_KEY;
        if (clerkSecretKey) {
          try {
            const clerk = createClerkClient({ secretKey: clerkSecretKey });
            // Clerk supports up to 100 userIds per request
            const chunkSize = 100;
            for (let i = 0; i < unknownUserIds.length; i += chunkSize) {
              const chunk = unknownUserIds.slice(i, i + chunkSize);
              const { data: users } = await clerk.users.getUserList({ userId: chunk, limit: chunkSize });
              for (const user of users) {
                const email = user.emailAddresses[0]?.emailAddress;
                if (email) emailByUserId[user.id] = email;
              }
            }
          } catch (err: any) {
            console.warn(`⚠️  Could not fetch emails from Clerk: ${err?.message}`);
          }
        } else {
          console.warn('⚠️  CLERK_SECRET_KEY not set — some emails will show as unknown');
        }
      }

      for (const sub of subscriptions) {
        const email = emailByUserId[sub.userId] || '(email unknown)';
        console.log(` - userId=${sub.userId}  email=${email}`);
      }
      await closeDB();
      process.exit(0);
    }

    if (force) {
      const userIds = subscriptions.map((s: any) => s.userId);
      const { deletedCount } = await db
        .collection('userNotifications')
        .deleteMany({ userId: { $in: userIds }, type: 'good_friday_promo' });
      console.log(`🗑️  Cleared ${deletedCount} existing good_friday_promo notification records.`);
    }

    let count = 0;
    for (const sub of subscriptions) {
      if (count > 0) {
        await sleep(2000);
      }
      await enqueueEmailJob({
        templateKind: 'good_friday_promo',
        userId: sub.userId,
      });
      count += 1;
    }

    console.log(`✅ Enqueued Good Friday promo email for ${count} free-tier users.`);
    await closeDB();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error enqueuing Good Friday promo emails:', error?.message || error);
    await closeDB().catch(() => {});
    process.exit(1);
  }
}

export function registerEmailCommands(yargsInstance: ReturnType<typeof yargs>) {
  return yargsInstance
    .command(
      'send-welcome',
      'Send a welcome email to a user (via background job)',
      (yargs) => {
        return yargs
          .option('user-id', {
            type: 'string',
            demandOption: true,
            describe: 'Clerk user ID',
          })
          .option('email', {
            type: 'string',
            describe: 'Override email address (optional)',
          })
          .option('first-name', {
            type: 'string',
            describe: 'Override first name used in template (optional)',
          });
      },
      (argv) => {
        void sendWelcomeEmailCommand(argv);
      }
    )
    .command(
      'send-subscription-congrats',
      'Send a subscription congratulations email to a user (via background job)',
      (yargs) => {
        return yargs
          .option('user-id', {
            type: 'string',
            demandOption: true,
            describe: 'Clerk user ID',
          })
          .option('tier-id', {
            type: 'string',
            demandOption: true,
            describe: 'Internal tier ID (e.g. basic, premium)',
          })
          .option('tier-name', {
            type: 'string',
            describe: 'Display name for the tier (optional)',
          })
          .option('email', {
            type: 'string',
            describe: 'Override email address (optional)',
          })
          .option('first-name', {
            type: 'string',
            describe: 'Override first name used in template (optional)',
          })
          .option('period-start', {
            type: 'string',
            describe:
              'Subscription period start (ISO date or date-time). If omitted, template falls back to default labeling.',
          })
          .option('period-end', {
            type: 'string',
            describe:
              'Subscription period end (ISO date or date-time). If omitted, template falls back to default labeling.',
          });
      },
      (argv) => {
        void sendSubscriptionCongratsEmailCommand(argv);
      }
    )
    .command(
      'send-subscription-congrats-all',
      'Send subscription congratulations email to all users with a paid subscription (tier != free)',
      (yargs) => {
        return yargs.option('dry-run', {
          type: 'boolean',
          default: false,
          describe: 'If true, only list which users would receive the email without enqueuing jobs',
        });
      },
      (argv) => {
        void sendSubscriptionCongratsAllCommand(argv);
      }
    )
    .command(
      'send-good-friday-promo',
      'Send Good Friday promo email (GOODFRIDAY40) to all free-tier users',
      (yargs) => {
        return yargs
          .option('dry-run', {
            type: 'boolean',
            default: false,
            describe: 'If true, only list which users would receive the email without enqueuing jobs',
          })
          .option('force', {
            type: 'boolean',
            default: false,
            describe: 'Clear existing idempotency records and re-send to all free-tier users',
          });
      },
      (argv) => {
        void sendGoodFridayPromoAllCommand(argv);
      }
    );
}

