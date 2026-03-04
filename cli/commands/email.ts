/**
 * Email notifications CLI commands
 *
 * Allows manual triggering of welcome and subscription congratulation emails.
 */

import yargs from 'yargs';
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
    );
}

