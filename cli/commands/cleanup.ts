/**
 * Cleanup CLI commands
 * Remove all documents related to a task ID, mock exam ID, or reading task ID
 */

import yargs from 'yargs';
import { getDB, closeDatabase } from '../utils/db';

export function registerCleanupCommands(yargs: yargs.Argv) {
  return yargs.command(
    'task <ids..>',
    'Remove all documents for one or more task IDs (listening_*, reading_*, mock_*)',
    (yargs) =>
      yargs
        .positional('ids', {
          type: 'string',
          array: true,
          describe: 'Task IDs to remove (e.g. listening_8 reading_8 mock_8)',
        })
        .option('dry-run', {
          type: 'boolean',
          default: false,
          describe: 'Show what would be deleted without actually deleting',
        })
        .option('yes', {
          alias: 'y',
          type: 'boolean',
          default: false,
          describe: 'Skip confirmation prompt',
        }),
    async (argv) => {
      const ids = (argv.ids as string[]).filter(Boolean);
      const dryRun = argv['dry-run'] as boolean;
      const skipConfirm = argv.yes as boolean;

      if (ids.length === 0) {
        console.error('❌ No IDs provided.');
        process.exit(1);
      }

      const db = await getDB();

      const listeningIds = ids.filter((id) => id.startsWith('listening_'));
      const readingIds = ids.filter((id) => id.startsWith('reading_'));
      const mockIds = ids.filter((id) => id.startsWith('mock_'));
      const unknownIds = ids.filter(
        (id) => !id.startsWith('listening_') && !id.startsWith('reading_') && !id.startsWith('mock_')
      );

      if (unknownIds.length > 0) {
        console.warn(`⚠️  Unrecognised ID format (skipping): ${unknownIds.join(', ')}`);
      }

      // Build a summary of what will be deleted
      const plan: { collection: string; filter: object; label: string }[] = [];

      for (const id of listeningIds) {
        plan.push({ collection: 'listeningTasks', filter: { taskId: id }, label: `listeningTasks where taskId = ${id}` });
        plan.push({ collection: 'audioItems',     filter: { taskId: id }, label: `audioItems where taskId = ${id}` });
        plan.push({ collection: 'questions',      filter: { taskId: id }, label: `questions where taskId = ${id}` });
        plan.push({ collection: 'examSessions',   filter: { taskIds: id }, label: `examSessions referencing ${id}` });
        plan.push({ collection: 'mockExams',      filter: { listeningTaskId: id }, label: `mockExams where listeningTaskId = ${id}` });
      }

      for (const id of readingIds) {
        plan.push({ collection: 'readingTasks', filter: { taskId: id }, label: `readingTasks where taskId = ${id}` });
        plan.push({ collection: 'questions',    filter: { taskId: id }, label: `questions where taskId = ${id}` });
        plan.push({ collection: 'examSessions', filter: { taskIds: id }, label: `examSessions referencing ${id}` });
        plan.push({ collection: 'mockExams',    filter: { readingTaskId: id }, label: `mockExams where readingTaskId = ${id}` });
      }

      for (const id of mockIds) {
        plan.push({ collection: 'mockExams',    filter: { mockExamId: id }, label: `mockExams where mockExamId = ${id}` });
        plan.push({ collection: 'examSessions', filter: { mockExamId: id }, label: `examSessions where mockExamId = ${id}` });
        plan.push({ collection: 'results',      filter: { mockExamId: id }, label: `results where mockExamId = ${id}` });
      }

      // Count what exists
      console.log(`\n🔍 Scanning for documents to ${dryRun ? 'delete (DRY RUN)' : 'delete'}...\n`);
      let totalFound = 0;
      const counts: { label: string; count: number }[] = [];

      for (const entry of plan) {
        const count = await db.collection(entry.collection).countDocuments(entry.filter);
        if (count > 0) {
          counts.push({ label: entry.label, count });
          totalFound += count;
        }
      }

      if (totalFound === 0) {
        console.log('✅ Nothing found — no documents to delete.');
        await closeDatabase();
        return;
      }

      console.log('Documents to be deleted:');
      for (const { label, count } of counts) {
        console.log(`   ${count.toString().padStart(4)} × ${label}`);
      }
      console.log(`\n   Total: ${totalFound} document(s)\n`);

      if (dryRun) {
        console.log('🔎 Dry run — nothing deleted.');
        await closeDatabase();
        return;
      }

      if (!skipConfirm) {
        const readline = await import('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await new Promise<string>((resolve) =>
          rl.question('⚠️  Confirm deletion? (yes/no): ', resolve)
        );
        rl.close();
        if (answer.trim().toLowerCase() !== 'yes') {
          console.log('Aborted.');
          await closeDatabase();
          return;
        }
      }

      // Execute deletions
      let totalDeleted = 0;
      for (const entry of plan) {
        const result = await db.collection(entry.collection).deleteMany(entry.filter);
        if (result.deletedCount > 0) {
          console.log(`   🗑️  Deleted ${result.deletedCount} from ${entry.collection}`);
          totalDeleted += result.deletedCount;
        }
      }

      console.log(`\n✅ Done — deleted ${totalDeleted} document(s).`);
      await closeDatabase();
    }
  );
}
