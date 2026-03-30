/**
 * Users CLI commands
 */

import yargs from 'yargs';
import { createClerkClient } from '@clerk/backend';
import { connectDB, closeDB } from '../../server/db/connection';

async function ensureDb(): Promise<void> {
  try {
    await connectDB();
  } catch (error: any) {
    console.error('❌ Failed to connect to database:', error?.message || error);
    process.exit(1);
  }
}

export async function listSubscribedUsersCommand(argv: any): Promise<void> {
  const tierFilter = argv.tier as string | undefined;

  try {
    await ensureDb();
    const db = await connectDB();

    const query: Record<string, any> = { tier: { $ne: 'free' } };
    if (tierFilter) query.tier = tierFilter;

    const subscriptions = (await db
      .collection('subscriptions')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()) as any[];

    if (!subscriptions.length) {
      console.log('ℹ️  No subscribed users found.');
      await closeDB();
      process.exit(0);
    }

    // Batch fetch user details from Clerk
    const userIds = subscriptions.map((s) => s.userId);
    const nameByUserId: Record<string, string> = {};
    const emailByUserId: Record<string, string> = {};

    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (clerkSecretKey) {
      try {
        const clerk = createClerkClient({ secretKey: clerkSecretKey });
        const chunkSize = 100;
        for (let i = 0; i < userIds.length; i += chunkSize) {
          const chunk = userIds.slice(i, i + chunkSize);
          const { data: users } = await clerk.users.getUserList({ userId: chunk, limit: chunkSize });
          for (const user of users) {
            emailByUserId[user.id] = user.emailAddresses[0]?.emailAddress || '';
            const full = [user.firstName, user.lastName].filter(Boolean).join(' ');
            nameByUserId[user.id] = full || emailByUserId[user.id] || user.id;
          }
        }
      } catch (err: any) {
        console.warn(`⚠️  Could not fetch user details from Clerk: ${err?.message}`);
      }
    } else {
      console.warn('⚠️  CLERK_SECRET_KEY not set — names and emails will be unavailable');
    }

    const tierLabel = tierFilter ? `tier=${tierFilter}` : 'all paid tiers';
    console.log(`\n📋 Subscribed users (${tierLabel}) — ${subscriptions.length} total\n`);

    const colW = { name: 28, email: 36, tier: 10, status: 12 };
    const header =
      'Name'.padEnd(colW.name) +
      'Email'.padEnd(colW.email) +
      'Tier'.padEnd(colW.tier) +
      'Status'.padEnd(colW.status);
    const divider = '─'.repeat(colW.name + colW.email + colW.tier + colW.status);

    console.log(header);
    console.log(divider);

    for (const sub of subscriptions) {
      const name = (nameByUserId[sub.userId] || sub.userId).slice(0, colW.name - 1).padEnd(colW.name);
      const email = (emailByUserId[sub.userId] || '').slice(0, colW.email - 1).padEnd(colW.email);
      const tier = (sub.tier || '').padEnd(colW.tier);
      const status = (sub.status || '').padEnd(colW.status);
      console.log(`${name}${email}${tier}${status}`);
    }

    console.log(divider);
    console.log(`Total: ${subscriptions.length}`);

    await closeDB();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error listing subscribed users:', error?.message || error);
    await closeDB().catch(() => {});
    process.exit(1);
  }
}

export function registerUsersCommands(yargsInstance: ReturnType<typeof yargs>) {
  return yargsInstance.command(
    'list-subscribed',
    'List all subscribed (paid) users with their names and emails',
    (yargs) => {
      return yargs.option('tier', {
        type: 'string',
        describe: 'Filter by tier (e.g. basic, premium). Shows all paid tiers if omitted.',
      });
    },
    (argv) => {
      void listSubscribedUsersCommand(argv);
    }
  );
}
