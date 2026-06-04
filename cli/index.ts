#!/usr/bin/env node

/**
 * Main CLI entry point
 * TEF Canada Task Management CLI
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load env before anything else. --prod loads .env.prod.local, otherwise .env
const isProd = process.argv.includes('--prod');
const envFile = isProd ? '.env.local.prod' : '.env';
dotenv.config({ path: resolve(process.cwd(), envFile) });
if (isProd) console.log('🚀 Using prod environment (.env.local.prod)');
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { registerReadingCommands } from './commands/reading';
import { registerListeningCommands } from './commands/listening';
import { registerMockExamCommands } from './commands/mock-exam';
import { registerEmailCommands } from './commands/email';
import { registerUsersCommands } from './commands/users';
import { registerCleanupCommands } from './commands/cleanup';

// Main CLI setup
const cli = yargs(hideBin(process.argv))
  .scriptName('tef-cli')
  .usage('$0 <command> [options]')
  .version('1.0.0')
  .alias('v', 'version')
  .help('h')
  .alias('h', 'help')
  .option('prod', {
    type: 'boolean',
    description: 'Use production environment (.env.prod.local)',
    default: false
  })
  .option('verbose', {
    alias: 'V',
    type: 'boolean',
    description: 'Run with verbose logging',
    default: false
  })
  .command('reading', 'Manage reading tasks', (yargs) => {
    return registerReadingCommands(yargs)
      .demandCommand(1, 'You need at least one command after reading');
  })
  .command('listening', 'Manage listening tasks', (yargs) => {
    return registerListeningCommands(yargs)
      .demandCommand(1, 'You need at least one command after listening');
  })
  .command('mock-exam', 'Manage mock exams', (yargs) => {
    return registerMockExamCommands(yargs)
      .demandCommand(1, 'You need at least one command after mock-exam');
  })
  .command('email', 'Send notification emails manually', (yargs) => {
    return registerEmailCommands(yargs)
      .demandCommand(1, 'You need at least one command after email');
  })
  .command('users', 'Manage and inspect users', (yargs) => {
    return registerUsersCommands(yargs)
      .demandCommand(1, 'You need at least one command after users');
  })
  .command('cleanup', 'Remove all documents for a task or mock exam ID', (yargs) => {
    return registerCleanupCommands(yargs)
      .demandCommand(1, 'You need at least one command after cleanup');
  })
  .demandCommand(1, 'You need at least one command before moving on')
  .strict()
  .recommendCommands()
  .showHelpOnFail(true)
  .epilogue('For more information, visit https://github.com/your-repo/tef-canada')
  .example('$0 reading generate', 'Generate complete reading task (auto ID + AI questions in one shot)')
  .example('$0 reading generate --theme "Télétravail"', 'Generate reading task with a specific theme')
  .example('$0 reading generate --task-id reading_5 --theme "Immigration"', 'Generate reading task with specific ID and theme')
  .example('$0 reading create --task-id reading_2 --prompt "..." --content "..."', 'Create a new reading task')
  .example('$0 reading questions generate --task-id reading_2 --theme "Télétravail"', 'Generate questions using AI')
  .example('$0 listening generate', 'Generate complete listening task (creates task, questions, audio, and Section 1 images)')
  .example('$0 listening generate --skip-audio', 'Generate task and questions only (skip audio generation)')
  .example('$0 listening generate --skip-section1-images', 'Generate task, questions, and audio (skip Section 1 images)')
  .example('$0 listening create --prompt "..."', 'Create a new listening task (auto-generates task ID)')
  .example('$0 listening questions generate --task-id listening_2', 'Generate questions using AI')
  .example('$0 listening questions generate-audio --task-id listening_2', 'Generate audio files from scripts')
  .example('$0 listening questions fill-missing-audio', 'Generate audio for all audio items with missing audio')
  .example('$0 listening questions fill-missing-audio --task-id listening_2', 'Generate missing audio for a specific task')
  .example('$0 listening section1-images --task-id listening_1', 'Generate Section 1 option images for one task (redo or first time)')
  .example('$0 listening fill-missing-section1-images', 'Generate Section 1 images for all tasks that are missing them')
  .example('$0 listening fill-missing-section1-images --task-id listening_1', 'Generate Section 1 images for a specific task only')
  .example('$0 mock-exam generate', 'Generate complete mock exam (creates listening, reading, and mock exam automatically)')
  .example('$0 mock-exam generate --reading-theme "Télétravail"', 'Generate mock exam with a specific reading theme')
  .example('$0 mock-exam generate --skip-audio', 'Generate mock exam but skip audio generation')
  .example('$0 mock-exam generate --skip-section1-images', 'Generate mock exam but skip Section 1 option images (Gemini image model)')
  .example('$0 mock-exam create', 'Create a mock exam with auto-generated IDs (uses existing listening task)')
  .example('$0 mock-exam create --reading-theme "Télétravail"', 'Create a mock exam with a specific theme')
  .example('$0 mock-exam list', 'List all mock exams')
  .example('$0 mock-exam remove mock_1', 'Remove mock exam mock_1 and all its data')
  .example('$0 email send-welcome --user-id user_123', 'Enqueue a welcome email for a specific user')
  .example('$0 email send-subscription-congrats --user-id user_123 --tier-id basic', 'Enqueue a subscription congratulations email for a specific user and tier');

// Parse and execute
cli.parse();
