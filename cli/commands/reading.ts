/**
 * Reading task CLI commands
 */

import yargs from 'yargs';
import { getDB, closeDatabase } from '../utils/db';
import { validateTaskId, validateTimeLimit, validateQuestionStructure } from '../utils/validators';
import { formatReadingTaskTable, printReadingTaskDetails, formatJSON, formatQuestionsTable } from '../utils/formatters';
import { createReadingTask } from '../../server/models/ReadingTask';
import { createQuestion } from '../../server/models/Question';
import { generateQuestions, validateGeneratedQuestions } from '../services/questionGenerator';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Create a new reading task
 */
export async function createReadingTaskCommand(argv: any) {
  try {
    const { taskId, prompt, content, timeLimit, active } = argv;

    // Validate inputs
    if (!validateTaskId(taskId, 'reading')) {
      console.error('❌ Invalid task ID format. Must be: reading_<number>');
      process.exit(1);
    }

    if (!prompt || typeof prompt !== 'string') {
      console.error('❌ Prompt is required');
      process.exit(1);
    }

    if (!content || typeof content !== 'string') {
      console.error('❌ Content is required');
      process.exit(1);
    }

    const timeLimitSec = parseInt(timeLimit) || 3600;
    if (!validateTimeLimit(timeLimitSec)) {
      console.error('❌ Time limit must be a positive number');
      process.exit(1);
    }

    const db = await getDB();
    const readingTasksCollection = db.collection('readingTasks');

    // Check if task already exists
    const existing = await readingTasksCollection.findOne({ taskId });
    if (existing) {
      console.error(`❌ Task ${taskId} already exists`);
      process.exit(1);
    }

    // Create task
    const task = createReadingTask(
      taskId,
      prompt,
      content,
      timeLimitSec,
      active !== false
    );

    await readingTasksCollection.insertOne(task);
    console.log(`✅ Created reading task: ${taskId}`);
    
    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating reading task:', error.message);
    await closeDatabase().catch(() => {});
    process.exit(1);
  }
}

/**
 * List reading tasks
 */
export async function listReadingTasksCommand(argv: any) {
  try {
    const { activeOnly, format } = argv;
    const db = await getDB();
    const readingTasksCollection = db.collection('readingTasks');

    const query = activeOnly ? { isActive: true } : {};
    const tasks = await readingTasksCollection.find(query).toArray();

    if (format === 'json') {
      console.log(formatJSON(tasks));
    } else {
      formatReadingTaskTable(tasks as any[]);
    }

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error listing reading tasks:', error.message);
    await closeDatabase().catch(() => {});
    process.exit(1);
  }
}

/**
 * Show reading task details
 */
export async function showReadingTaskCommand(argv: any) {
  try {
    const { taskId } = argv;
    const db = await getDB();
    const readingTasksCollection = db.collection('readingTasks');

    const task = await readingTasksCollection.findOne({ taskId });
    if (!task) {
      console.error(`❌ Task ${taskId} not found`);
      process.exit(1);
    }

    printReadingTaskDetails(task as any);
    
    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error showing reading task:', error.message);
    await closeDatabase().catch(() => {});
    process.exit(1);
  }
}

/**
 * Generate questions for a reading task using AI
 */
export async function generateQuestionsCommand(argv: any) {
  try {
    const { taskId, theme, sections } = argv;
    const db = await getDB();

    // Validate task exists
    const readingTasksCollection = db.collection('readingTasks');
    const task = await readingTasksCollection.findOne({ taskId });
    if (!task) {
      console.error(`❌ Task ${taskId} not found. Create it first using 'reading create'`);
      process.exit(1);
    }

    // Parse sections if provided
    const sectionsArray = sections 
      ? sections.split(',').map((s: string) => s.trim().toUpperCase())
      : undefined;

    // Generate questions
    const questions = await generateQuestions(taskId, {
      theme,
      sections: sectionsArray
    });

    // Validate questions
    const validation = validateGeneratedQuestions(questions);
    if (!validation.valid) {
      console.error('❌ Generated questions validation failed:');
      validation.errors.forEach(err => console.error(`   - ${err}`));
      process.exit(1);
    }

    // Save questions to database
    const questionsCollection = db.collection('questions');
    
    // Check if questions already exist
    const existingCount = await questionsCollection.countDocuments({ taskId });
    if (existingCount > 0) {
      console.log(`⚠️  Warning: ${existingCount} questions already exist for this task.`);
      console.log('   Deleting existing questions...');
      await questionsCollection.deleteMany({ taskId });
    }

    await questionsCollection.insertMany(questions);
    console.log(`✅ Saved ${questions.length} questions to database`);

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error generating questions:', error.message);
    await closeDatabase().catch(() => {});
    process.exit(1);
  }
}

/**
 * List questions for a reading task
 */
export async function listQuestionsCommand(argv: any) {
  try {
    const { taskId, format } = argv;
    const db = await getDB();
    const questionsCollection = db.collection('questions');

    const questions = await questionsCollection
      .find({ taskId, type: 'reading' })
      .sort({ questionNumber: 1 })
      .toArray();

    if (format === 'json') {
      console.log(formatJSON(questions));
    } else {
      formatQuestionsTable(questions);
    }

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error listing questions:', error.message);
    await closeDatabase().catch(() => {});
    process.exit(1);
  }
}

/**
 * Import questions from JSON file
 */
export async function importQuestionsCommand(argv: any) {
  try {
    const { taskId, file } = argv;
    const db = await getDB();

    // Validate task exists
    const readingTasksCollection = db.collection('readingTasks');
    const task = await readingTasksCollection.findOne({ taskId });
    if (!task) {
      console.error(`❌ Task ${taskId} not found. Create it first using 'reading create'`);
      process.exit(1);
    }

    // Read and parse JSON file
    const filePath = join(process.cwd(), file);
    const fileContent = readFileSync(filePath, 'utf-8');
    const questionsData = JSON.parse(fileContent);

    if (!Array.isArray(questionsData)) {
      throw new Error('JSON file must contain an array of questions');
    }

    if (questionsData.length !== 40) {
      console.warn(`⚠️  Warning: Expected 40 questions, found ${questionsData.length}`);
    }

    // Validate and create questions
    const questions = questionsData.map((q: any, index: number) => {
      const validation = validateQuestionStructure(q);
      if (!validation.valid) {
        throw new Error(`Question ${index + 1}: ${validation.error}`);
      }

      return createQuestion(
        `${taskId}_q${index + 1}`,
        taskId,
        'reading',
        index + 1,
        q.question,
        q.options,
        q.correctAnswer,
        q.explanation,
        true,
        q.questionText
      );
    });

    // Save to database
    const questionsCollection = db.collection('questions');
    
    // Delete existing questions
    const existingCount = await questionsCollection.countDocuments({ taskId });
    if (existingCount > 0) {
      console.log(`⚠️  Warning: ${existingCount} questions already exist. Deleting...`);
      await questionsCollection.deleteMany({ taskId });
    }

    await questionsCollection.insertMany(questions);
    console.log(`✅ Imported ${questions.length} questions from ${file}`);

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error importing questions:', error.message);
    await closeDatabase().catch(() => {});
    process.exit(1);
  }
}

/**
 * Add a single question manually
 */
export async function addQuestionCommand(argv: any) {
  try {
    const { taskId, questionNumber, question, options, correctAnswer, explanation, questionText } = argv;
    const db = await getDB();

    // Validate task exists
    const readingTasksCollection = db.collection('readingTasks');
    const task = await readingTasksCollection.findOne({ taskId });
    if (!task) {
      console.error(`❌ Task ${taskId} not found. Create it first using 'reading create'`);
      process.exit(1);
    }

    // Parse options
    const optionsArray = typeof options === 'string' 
      ? options.split(',').map((opt: string) => opt.trim())
      : options;

    if (!Array.isArray(optionsArray) || optionsArray.length !== 4) {
      console.error('❌ Options must be 4 comma-separated values or an array of 4 strings');
      process.exit(1);
    }

    const correctAnswerNum = parseInt(correctAnswer);
    if (isNaN(correctAnswerNum) || correctAnswerNum < 0 || correctAnswerNum > 3) {
      console.error('❌ Correct answer must be a number between 0 and 3');
      process.exit(1);
    }

    const questionNum = parseInt(questionNumber);
    if (isNaN(questionNum) || questionNum < 1 || questionNum > 40) {
      console.error('❌ Question number must be between 1 and 40');
      process.exit(1);
    }

    // Validate question structure
    const validation = validateQuestionStructure({
      question,
      options: optionsArray,
      correctAnswer: correctAnswerNum,
      explanation
    });

    if (!validation.valid) {
      console.error(`❌ ${validation.error}`);
      process.exit(1);
    }

    // Check if question already exists
    const questionsCollection = db.collection('questions');
    const existing = await questionsCollection.findOne({
      taskId,
      questionNumber: questionNum
    });

    if (existing) {
      console.error(`❌ Question ${questionNum} already exists for this task`);
      process.exit(1);
    }

    // Create question
    const questionDoc = createQuestion(
      `${taskId}_q${questionNum}`,
      taskId,
      'reading',
      questionNum,
      question,
      optionsArray,
      correctAnswerNum,
      explanation,
      true,
      questionText
    );

    await questionsCollection.insertOne(questionDoc);
    console.log(`✅ Added question ${questionNum} to task ${taskId}`);

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error adding question:', error.message);
    await closeDatabase().catch(() => {});
    process.exit(1);
  }
}

/**
 * Register reading commands with yargs
 */
export function registerReadingCommands(yargsInstance: ReturnType<typeof yargs>) {
  return yargsInstance
    .command('create', 'Create a new reading task', (yargs) => {
      return yargs
        .option('task-id', { type: 'string', demandOption: true, describe: 'Task ID (e.g., reading_2)' })
        .option('prompt', { type: 'string', demandOption: true, describe: 'Task prompt/instructions' })
        .option('content', { type: 'string', demandOption: true, describe: 'Reading content/passage' })
        .option('time-limit', { type: 'number', default: 3600, describe: 'Time limit in seconds' })
        .option('active', { type: 'boolean', default: true, describe: 'Whether task is active' });
    }, createReadingTaskCommand)
    .command('list', 'List all reading tasks', (yargs) => {
      return yargs
        .option('active-only', { type: 'boolean', default: false, describe: 'Show only active tasks' })
        .option('format', { type: 'string', choices: ['table', 'json'], default: 'table', describe: 'Output format' });
    }, listReadingTasksCommand)
    .command('show <taskId>', 'Show reading task details', (yargs) => {
      return yargs
        .positional('taskId', { type: 'string', demandOption: true, describe: 'Task ID to show' });
    }, showReadingTaskCommand)
    .command('questions generate', 'Generate questions using AI', (yargs) => {
      return yargs
        .option('task-id', { type: 'string', demandOption: true, describe: 'Task ID' })
        .option('theme', { type: 'string', describe: 'Optional theme for questions' })
        .option('sections', { type: 'string', describe: 'Comma-separated sections to generate (A-G), default: all' });
    }, generateQuestionsCommand)
    .command('questions list', 'List questions for a task', (yargs) => {
      return yargs
        .option('task-id', { type: 'string', demandOption: true, describe: 'Task ID' })
        .option('format', { type: 'string', choices: ['table', 'json'], default: 'table', describe: 'Output format' });
    }, listQuestionsCommand)
    .command('questions import', 'Import questions from JSON file', (yargs) => {
      return yargs
        .option('task-id', { type: 'string', demandOption: true, describe: 'Task ID' })
        .option('file', { type: 'string', demandOption: true, describe: 'Path to JSON file' });
    }, importQuestionsCommand)
    .command('questions add', 'Add a single question manually', (yargs) => {
      return yargs
        .option('task-id', { type: 'string', demandOption: true, describe: 'Task ID' })
        .option('question-number', { type: 'number', demandOption: true, describe: 'Question number (1-40)' })
        .option('question', { type: 'string', demandOption: true, describe: 'Question text' })
        .option('options', { type: 'string', demandOption: true, describe: 'Comma-separated options (4 required)' })
        .option('correct-answer', { type: 'number', demandOption: true, describe: 'Correct answer index (0-3)' })
        .option('explanation', { type: 'string', demandOption: true, describe: 'Explanation for correct answer' })
        .option('question-text', { type: 'string', describe: 'Optional question-specific text/passage' });
    }, addQuestionCommand);
}
