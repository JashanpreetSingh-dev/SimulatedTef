#!/usr/bin/env node

/**
 * Main CLI entry point
 * TEF Canada Task Management CLI
 */

import 'dotenv/config';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { registerReadingCommands } from './commands/reading';
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
  .example('$0 mock-exam create', 'Create a mock exam with auto-generated IDs (all parameters optional)')
  .example('$0 mock-exam create --reading-theme "Télétravail"', 'Create a mock exam with a specific theme')
  .example('$0 mock-exam list', 'List all mock exams');

// Parse and execute
cli.parse();
