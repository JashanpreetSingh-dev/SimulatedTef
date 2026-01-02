#!/usr/bin/env node

/**
 * Main CLI entry point
 * TEF Canada Task Management CLI
 */

import 'dotenv/config';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { registerReadingCommands } from './commands/reading';
import { registerListeningCommands } from './commands/listening';
import { registerMockExamCommands } from './commands/mock-exam';

// Main CLI setup
const cli = yargs(hideBin(process.argv))
  .scriptName('tef-cli')
  .usage('$0 <command> [options]')
  .version('1.0.0')
  .alias('v', 'version')
  .help('h')
  .alias('h', 'help')
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
  .demandCommand(1, 'You need at least one command before moving on')
  .strict()
  .recommendCommands()
  .showHelpOnFail(true)
  .epilogue('For more information, visit https://github.com/your-repo/tef-canada')
  .example('$0 reading create --task-id reading_2 --prompt "..." --content "..."', 'Create a new reading task')
  .example('$0 reading questions generate --task-id reading_2 --theme "Télétravail"', 'Generate questions using AI')
  .example('$0 listening generate', 'Generate complete listening mock exam (creates task, questions, and audio)')
  .example('$0 listening generate --skip-audio', 'Generate task and questions only (skip audio generation)')
  .example('$0 listening create --prompt "..."', 'Create a new listening task (auto-generates task ID)')
  .example('$0 listening questions generate --task-id listening_2', 'Generate questions using AI')
  .example('$0 listening questions generate-audio --task-id listening_2', 'Generate audio files from scripts')
  .example('$0 listening questions fill-missing-audio', 'Generate audio for all audio items with missing audio')
  .example('$0 listening questions fill-missing-audio --task-id listening_2', 'Generate missing audio for a specific task')
  .example('$0 mock-exam generate', 'Generate complete mock exam (creates listening, reading, and mock exam automatically)')
  .example('$0 mock-exam generate --reading-theme "Télétravail"', 'Generate mock exam with a specific reading theme')
  .example('$0 mock-exam generate --skip-audio', 'Generate mock exam but skip audio generation')
  .example('$0 mock-exam create', 'Create a mock exam with auto-generated IDs (uses existing listening task)')
  .example('$0 mock-exam create --reading-theme "Télétravail"', 'Create a mock exam with a specific theme')
  .example('$0 mock-exam list', 'List all mock exams');

// Parse and execute
cli.parse();
