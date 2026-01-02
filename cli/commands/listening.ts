/**
 * Listening task CLI commands
 */

import yargs from 'yargs';
import { getDB, closeDatabase } from '../utils/db';
import { validateTaskId, validateTimeLimit, validateQuestionStructure, validateListeningQuestionStructure } from '../utils/validators';
import { formatListeningTaskTable, printListeningTaskDetails, formatJSON, formatQuestionsTable } from '../utils/formatters';
import { createListeningTask } from '../../server/models/ListeningTask';
import { createQuestion } from '../../server/models/Question';
import { createAudioItem } from '../../server/models/AudioItem';
import { generateListeningQuestions, validateGeneratedListeningQuestions } from '../services/listeningQuestionGenerator';
import { generateAudioForTask } from '../services/ttsGenerator';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Create a new listening task (auto-generates task ID if not provided)
 */
export async function createListeningTaskCommand(argv: any) {
  try {
    const { taskId, prompt, timeLimit, active } = argv;

    // Validate prompt
    if (!prompt || typeof prompt !== 'string') {
      console.error('❌ Prompt is required');
      process.exit(1);
    }

    const timeLimitSec = parseInt(timeLimit) || 2400;
    if (!validateTimeLimit(timeLimitSec)) {
      console.error('❌ Time limit must be a positive number');
      process.exit(1);
    }

    const db = await getDB();
    const listeningTasksCollection = db.collection('listeningTasks');

    // Auto-generate task ID if not provided
    let finalTaskId = taskId;
    if (!finalTaskId) {
      const existingTasks = await listeningTasksCollection.find({}).toArray();
      const taskNumbers = existingTasks
        .map((task: any) => {
          const match = task.taskId?.match(/^listening_(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter((n: number) => n > 0);
      const nextNumber = taskNumbers.length > 0 ? Math.max(...taskNumbers) + 1 : 1;
      finalTaskId = `listening_${nextNumber}`;
      console.log(`📝 Auto-generated task ID: ${finalTaskId}`);
    } else {
      // Validate provided task ID format
      if (!validateTaskId(finalTaskId, 'listening')) {
        console.error('❌ Invalid task ID format. Must be: listening_<number>');
        process.exit(1);
      }

      // Check if task already exists
      const existing = await listeningTasksCollection.findOne({ taskId: finalTaskId });
      if (existing) {
        console.error(`❌ Task ${finalTaskId} already exists`);
        process.exit(1);
      }
    }

    // Create task (audioUrl can be placeholder since audio is stored in AudioItems)
    const task = createListeningTask(
      finalTaskId,
      prompt,
      '', // audioUrl - not used when audio is stored in AudioItems
      timeLimitSec,
      active !== false
    );

    await listeningTasksCollection.insertOne(task);
    console.log(`✅ Created listening task: ${finalTaskId}`);
    
    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating listening task:', error.message);
    await closeDatabase().catch(() => {});
    process.exit(1);
  }
}

/**
 * List listening tasks
 */
export async function listListeningTasksCommand(argv: any) {
  try {
    const { activeOnly, format } = argv;
    const db = await getDB();
    const listeningTasksCollection = db.collection('listeningTasks');

    const query = activeOnly ? { isActive: true } : {};
    const tasks = await listeningTasksCollection.find(query).toArray();

    if (format === 'json') {
      console.log(formatJSON(tasks));
    } else {
      formatListeningTaskTable(tasks as any[]);
    }

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error listing listening tasks:', error.message);
    await closeDatabase().catch(() => {});
    process.exit(1);
  }
}

/**
 * Show listening task details
 */
export async function showListeningTaskCommand(argv: any) {
  try {
    const { taskId } = argv;
    const db = await getDB();
    const listeningTasksCollection = db.collection('listeningTasks');

    const task = await listeningTasksCollection.findOne({ taskId });
    if (!task) {
      console.error(`❌ Task ${taskId} not found`);
      process.exit(1);
    }

    printListeningTaskDetails(task as any);
    
    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error showing listening task:', error.message);
    await closeDatabase().catch(() => {});
    process.exit(1);
  }
}

/**
 * Generate complete listening mock exam: create task, generate questions, and generate audio
 */
export async function generateCompleteCommand(argv: any) {
  try {
    const { taskId, prompt, timeLimit, skipAudio } = argv;
    
    console.log('\n🚀 Creating Complete Listening Mock Exam');
    console.log('═'.repeat(60));

    const db = await getDB();
    const listeningTasksCollection = db.collection('listeningTasks');

    // Auto-generate task ID if not provided
    let finalTaskId = taskId;
    if (!finalTaskId) {
      const existingTasks = await listeningTasksCollection.find({}).toArray();
      const taskNumbers = existingTasks
        .map((task: any) => {
          const match = task.taskId?.match(/^listening_(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter((n: number) => n > 0);
      const nextNumber = taskNumbers.length > 0 ? Math.max(...taskNumbers) + 1 : 1;
      finalTaskId = `listening_${nextNumber}`;
      console.log(`\n[1/4] 📝 Auto-generated task ID: ${finalTaskId}`);
    } else {
      if (!validateTaskId(finalTaskId, 'listening')) {
        console.error('❌ Invalid task ID format. Must be: listening_<number>');
        process.exit(1);
      }
      const existing = await listeningTasksCollection.findOne({ taskId: finalTaskId });
      if (existing) {
        console.error(`❌ Task ${finalTaskId} already exists`);
        process.exit(1);
      }
      console.log(`\n[1/4] 📝 Using task ID: ${finalTaskId}`);
    }

    // Use default prompt if not provided
    const finalPrompt = prompt || "Écoutez attentivement les enregistrements audio et répondez aux 40 questions qui suivent. Chaque question sera lue deux fois avec un temps de réflexion entre les lectures. Vous avez 40 minutes pour compléter cette section.";
    const timeLimitSec = parseInt(timeLimit) || 2400;

    // Step 1: Create task
    console.log(`\n[2/4] 📋 Creating listening task...`);
    const task = createListeningTask(
      finalTaskId,
      finalPrompt,
      '', // audioUrl - not used when audio is stored in AudioItems
      timeLimitSec,
      true
    );
    await listeningTasksCollection.insertOne(task);
    console.log(`   ✅ Task created`);

    // Step 2: Generate questions
    console.log(`\n[3/4] 🤖 Generating questions and audio scripts...`);
    const { audioItems, questions } = await generateListeningQuestions(finalTaskId);

    // Validate questions
    const validation = validateGeneratedListeningQuestions(audioItems, questions);
    if (!validation.valid) {
      console.error('❌ Generated questions validation failed:');
      validation.errors.forEach(err => console.error(`   - ${err}`));
      process.exit(1);
    }

    // Save audio items and questions
    const audioItemsCollection = db.collection('audioItems');
    const questionsCollection = db.collection('questions');
    
    await audioItemsCollection.insertMany(audioItems);
    console.log(`   ✅ Saved ${audioItems.length} audio items with scripts`);
    
    await questionsCollection.insertMany(questions);
    console.log(`   ✅ Saved ${questions.length} questions`);

    // Step 3: Generate audio (unless skipped)
    if (!skipAudio) {
      console.log(`\n[4/4] 🎵 Generating audio files from scripts (this may take a while)...`);
      await closeDatabase(); // Close before TTS generation (it will open its own connection)
      const stats = await generateAudioForTask(finalTaskId, false);
      
      if (stats.failed > 0) {
        console.error(`\n⚠️  Warning: ${stats.failed} audio item(s) failed to generate`);
      } else {
        console.log(`\n✅ All audio files generated successfully!`);
      }
    } else {
      console.log(`\n[4/4] ⏭️  Skipping audio generation (use 'listening questions generate-audio' later)`);
      await closeDatabase();
    }

    console.log(`\n🎉 Complete listening mock exam created: ${finalTaskId}`);
    if (skipAudio) {
      console.log(`💡 Run 'listening questions generate-audio --task-id ${finalTaskId}' to generate audio files`);
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error creating complete listening mock exam:', error.message);
    await closeDatabase().catch(() => {});
    process.exit(1);
  }
}

/**
 * Generate questions for a listening task using AI
 */
export async function generateQuestionsCommand(argv: any) {
  try {
    const { taskId } = argv;
    const db = await getDB();

    // Validate task exists
    const listeningTasksCollection = db.collection('listeningTasks');
    const task = await listeningTasksCollection.findOne({ taskId });
    if (!task) {
      console.error(`❌ Task ${taskId} not found. Create it first using 'listening create'`);
      process.exit(1);
    }

    // Generate questions and audio items
    const { audioItems, questions } = await generateListeningQuestions(taskId);

    // Validate questions
    const validation = validateGeneratedListeningQuestions(audioItems, questions);
    if (!validation.valid) {
      console.error('❌ Generated questions validation failed:');
      validation.errors.forEach(err => console.error(`   - ${err}`));
      process.exit(1);
    }

    // Save audio items to database
    const audioItemsCollection = db.collection('audioItems');
    
    // Check if audio items already exist
    const existingAudioCount = await audioItemsCollection.countDocuments({ taskId });
    if (existingAudioCount > 0) {
      console.log(`⚠️  Warning: ${existingAudioCount} audio items already exist for this task.`);
      console.log('   Deleting existing audio items...');
      await audioItemsCollection.deleteMany({ taskId });
    }

    await audioItemsCollection.insertMany(audioItems);
    console.log(`✅ Saved ${audioItems.length} audio items to database`);

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
    console.log(`\n💡 Tip: Run 'listening questions generate-audio --task-id ${taskId}' to generate audio files from scripts`);

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error generating questions:', error.message);
    await closeDatabase().catch(() => {});
    process.exit(1);
  }
}

/**
 * List questions for a listening task
 */
export async function listQuestionsCommand(argv: any) {
  try {
    const { taskId, format } = argv;
    const db = await getDB();
    const questionsCollection = db.collection('questions');

    const questions = await questionsCollection
      .find({ taskId, type: 'listening' })
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
 * Import questions from JSON file (audio_items format)
 */
export async function importQuestionsCommand(argv: any) {
  try {
    const { taskId, file } = argv;
    const db = await getDB();

    // Validate task exists
    const listeningTasksCollection = db.collection('listeningTasks');
    const task = await listeningTasksCollection.findOne({ taskId });
    if (!task) {
      console.error(`❌ Task ${taskId} not found. Create it first using 'listening create'`);
      process.exit(1);
    }

    // Read and parse JSON file
    const filePath = join(process.cwd(), file);
    const fileContent = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Validate structure
    const validation = validateListeningQuestionStructure(data);
    if (!validation.valid) {
      console.error(`❌ Invalid file format: ${validation.error}`);
      process.exit(1);
    }

    // Convert to database format
    const audioItems: any[] = [];
    const questions: any[] = [];
    let globalQuestionNumber = 1;

    for (const audioItem of data.audio_items) {
      // Create AudioItem
      const audioItemDoc = createAudioItem(
        audioItem.audio_id,
        taskId,
        audioItem.section_id,
        audioItem.audio_script,
        audioItem.repeatable || false
      );
      audioItems.push(audioItemDoc);

      // Create Questions for this audio
      if (audioItem.questions && Array.isArray(audioItem.questions)) {
        for (const q of audioItem.questions) {
          // Convert correct_answer from "A"/"B"/"C"/"D" to 0/1/2/3
          const correctAnswerMap: { [key: string]: number } = {
            'A': 0,
            'B': 1,
            'C': 2,
            'D': 3
          };
          const correctAnswer = correctAnswerMap[q.correct_answer];
          if (correctAnswer === undefined) {
            throw new Error(`Invalid correct_answer: ${q.correct_answer}. Must be A, B, C, or D`);
          }

          // Convert options object to array
          const optionsArray = [
            q.options.A,
            q.options.B,
            q.options.C,
            q.options.D
          ];

          // Validate question structure
          const validation = validateQuestionStructure({
            question: q.question,
            options: optionsArray,
            correctAnswer: correctAnswer,
            explanation: `La réponse correcte est ${q.options[q.correct_answer]}.`
          });
          if (!validation.valid) {
            throw new Error(`Question ${globalQuestionNumber}: ${validation.error}`);
          }

          // Create question
          const questionDoc = createQuestion(
            `${taskId}_q${globalQuestionNumber}`,
            taskId,
            'listening',
            globalQuestionNumber,
            q.question,
            optionsArray,
            correctAnswer,
            `La réponse correcte est ${q.options[q.correct_answer]}.`,
            true,
            undefined,
            audioItem.audio_id
          );
          questions.push(questionDoc);
          globalQuestionNumber++;
        }
      }
    }

    // Save to database
    const audioItemsCollection = db.collection('audioItems');
    const questionsCollection = db.collection('questions');
    
    // Delete existing data
    const existingAudioCount = await audioItemsCollection.countDocuments({ taskId });
    const existingQuestionCount = await questionsCollection.countDocuments({ taskId });
    if (existingAudioCount > 0 || existingQuestionCount > 0) {
      console.log(`⚠️  Warning: Existing data found. Deleting...`);
      await audioItemsCollection.deleteMany({ taskId });
      await questionsCollection.deleteMany({ taskId });
    }

    await audioItemsCollection.insertMany(audioItems);
    await questionsCollection.insertMany(questions);
    console.log(`✅ Imported ${audioItems.length} audio items and ${questions.length} questions from ${file}`);

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
    const { taskId, questionNumber, question, options, correctAnswer, explanation, audioId } = argv;
    const db = await getDB();

    // Validate task exists
    const listeningTasksCollection = db.collection('listeningTasks');
    const task = await listeningTasksCollection.findOne({ taskId });
    if (!task) {
      console.error(`❌ Task ${taskId} not found. Create it first using 'listening create'`);
      process.exit(1);
    }

    // Validate audioId exists if provided
    if (audioId) {
      const audioItemsCollection = db.collection('audioItems');
      const audioItem = await audioItemsCollection.findOne({ audioId, taskId });
      if (!audioItem) {
        console.error(`❌ AudioItem ${audioId} not found for task ${taskId}`);
        process.exit(1);
      }
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
      explanation: explanation || 'No explanation provided'
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
      'listening',
      questionNum,
      question,
      optionsArray,
      correctAnswerNum,
      explanation || 'No explanation provided',
      true,
      undefined,
      audioId
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
 * Generate audio files from scripts using TTS
 */
export async function generateAudioCommand(argv: any) {
  try {
    const { taskId, overwrite } = argv;
    const db = await getDB();

    // Validate task exists
    const listeningTasksCollection = db.collection('listeningTasks');
    const task = await listeningTasksCollection.findOne({ taskId });
    if (!task) {
      console.error(`❌ Task ${taskId} not found. Create it first using 'listening create'`);
      process.exit(1);
    }

    // Generate audio
    const stats = await generateAudioForTask(taskId, overwrite || false);

    if (stats.failed > 0) {
      console.error(`\n⚠️  Warning: ${stats.failed} audio item(s) failed to generate`);
      process.exit(1);
    }

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error generating audio:', error.message);
    await closeDatabase().catch(() => {});
    process.exit(1);
  }
}

/**
 * Register listening commands with yargs
 */
export function registerListeningCommands(yargsInstance: ReturnType<typeof yargs>) {
  return yargsInstance
    .command('generate', 'Generate complete listening mock exam: create task, generate questions, and audio (one command)', (yargs) => {
      return yargs
        .option('task-id', { type: 'string', describe: 'Task ID (e.g., listening_2) - auto-generated if not provided' })
        .option('prompt', { type: 'string', describe: 'Task prompt/instructions (uses default if not provided)' })
        .option('time-limit', { type: 'number', default: 2400, describe: 'Time limit in seconds' })
        .option('skip-audio', { type: 'boolean', default: false, describe: 'Skip audio generation (generate later with generate-audio command)' });
    }, generateCompleteCommand)
    .command('create', 'Create a new listening task (auto-generates task ID if not provided)', (yargs) => {
      return yargs
        .option('task-id', { type: 'string', describe: 'Task ID (e.g., listening_2) - auto-generated if not provided' })
        .option('prompt', { type: 'string', demandOption: true, describe: 'Task prompt/instructions' })
        .option('time-limit', { type: 'number', default: 2400, describe: 'Time limit in seconds' })
        .option('active', { type: 'boolean', default: true, describe: 'Whether task is active' });
    }, createListeningTaskCommand)
    .command('list', 'List all listening tasks', (yargs) => {
      return yargs
        .option('active-only', { type: 'boolean', default: false, describe: 'Show only active tasks' })
        .option('format', { type: 'string', choices: ['table', 'json'], default: 'table', describe: 'Output format' });
    }, listListeningTasksCommand)
    .command('show <taskId>', 'Show listening task details', (yargs) => {
      return yargs
        .positional('taskId', { type: 'string', demandOption: true, describe: 'Task ID to show' });
    }, showListeningTaskCommand)
    .command('questions generate', 'Generate questions using AI', (yargs) => {
      return yargs
        .option('task-id', { type: 'string', demandOption: true, describe: 'Task ID' });
    }, generateQuestionsCommand)
    .command('questions list', 'List questions for a task', (yargs) => {
      return yargs
        .option('task-id', { type: 'string', demandOption: true, describe: 'Task ID' })
        .option('format', { type: 'string', choices: ['table', 'json'], default: 'table', describe: 'Output format' });
    }, listQuestionsCommand)
    .command('questions import', 'Import questions from JSON file (audio_items format)', (yargs) => {
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
        .option('audio-id', { type: 'string', describe: 'Optional audio ID reference' });
    }, addQuestionCommand)
    .command('questions generate-audio', 'Generate audio files from scripts using TTS', (yargs) => {
      return yargs
        .option('task-id', { type: 'string', demandOption: true, describe: 'Task ID' })
        .option('overwrite', { type: 'boolean', default: false, describe: 'Overwrite existing audio files' });
    }, generateAudioCommand);
}
