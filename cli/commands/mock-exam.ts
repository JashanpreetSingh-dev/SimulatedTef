/**
 * Mock exam CLI commands
 */

import yargs from 'yargs';
import { getDB, closeDatabase } from '../utils/db';
import { validateTaskId, validateMockExamReferences } from '../utils/validators';
import { formatMockExamTable, printMockExamDetails, formatJSON } from '../utils/formatters';
import { createMockExam } from '../../server/models/MockExam';
import { createReadingTask } from '../../server/models/ReadingTask';
import { generateQuestions, validateGeneratedQuestions } from '../services/questionGenerator';

/**
 * Create a new mock exam
 * Automatically creates reading task with AI, uses listening from JSON, and adds orals
 * All parameters are optional - everything is auto-generated
 */
export async function createMockExamCommand(argv: any) {
  const startTime = Date.now();
  
  try {
    const { 
      mockExamId, 
      name, 
      description, 
      oralA, 
      oralB, 
      reading, 
      listening, 
      readingTheme,
      active 
    } = argv;

    console.log('\n🚀 Creating Mock Exam');
    console.log('═'.repeat(60));

    // Connect to database first to get next available IDs
    console.log('\n[1/6] Connecting to database...');
    const db = await getDB();
    const mockExamsCollection = db.collection('mockExams');
    const readingTasksCollection = db.collection('readingTasks');
    const listeningTasksCollection = db.collection('listeningTasks');
    const questionsCollection = db.collection('questions');
    console.log('   ✅ Database connected');

    // Auto-generate mock exam ID if not provided
    let finalMockExamId = mockExamId;
    if (!finalMockExamId) {
      console.log('\n[2/6] Generating mock exam ID...');
      const existingExams = await mockExamsCollection.find({}).toArray();
      const examNumbers = existingExams
        .map((exam: any) => {
          const match = exam.mockExamId?.match(/^mock_(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter((n: number) => n > 0);
      const nextNumber = examNumbers.length > 0 ? Math.max(...examNumbers) + 1 : 1;
      finalMockExamId = `mock_${nextNumber}`;
      console.log(`   ✅ Generated: ${finalMockExamId}`);
    } else {
      console.log('\n[2/6] Using provided mock exam ID...');
      const existing = await mockExamsCollection.findOne({ mockExamId: finalMockExamId });
      if (existing) {
        console.error(`   ❌ Mock exam ${finalMockExamId} already exists`);
        await closeDatabase();
        process.exit(1);
      }
      console.log(`   ✅ Mock exam ID available: ${finalMockExamId}`);
    }

    // Auto-generate name if not provided
    const finalName = name || `Mock Exam ${finalMockExamId.replace('mock_', '')}`;

    // Use defaults for oral tasks
    const finalOralA = oralA || 'oralA_1';
    const finalOralB = oralB || 'oralB_1';

    // Use default listening task
    const finalListening = listening || 'listening_1';

    // Auto-generate reading task ID if not provided
    let finalReading = reading;
    if (!finalReading) {
      console.log('\n[3/6] Generating reading task ID...');
      const existingReadingTasks = await readingTasksCollection.find({}).toArray();
      const readingNumbers = existingReadingTasks
        .map((task: any) => {
          const match = task.taskId?.match(/^reading_(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter((n: number) => n > 0);
      const nextReadingNumber = readingNumbers.length > 0 ? Math.max(...readingNumbers) + 1 : 1;
      finalReading = `reading_${nextReadingNumber}`;
      console.log(`   ✅ Generated: ${finalReading}`);
    } else {
      console.log('\n[3/6] Using provided reading task ID...');
      console.log(`   📖 Reading task ID: ${finalReading}`);
    }

    console.log('\n📋 Configuration:');
    console.log('═'.repeat(60));
    console.log(`📝 Mock Exam ID: ${finalMockExamId}`);
    console.log(`📋 Name: ${finalName}`);
    if (description) {
      console.log(`📄 Description: ${description}`);
    }
    console.log(`📞 Oral A: ${finalOralA}`);
    console.log(`📞 Oral B: ${finalOralB}`);
    console.log(`📖 Reading: ${finalReading} (will be created with AI)`);
    console.log(`🎧 Listening: ${finalListening} (from JSON)`);
    if (readingTheme) {
      console.log(`🎨 Theme: ${readingTheme}`);
    }
    console.log('═'.repeat(60));

    // Validate listening task exists (from JSON import)
    console.log(`\n[4/6] Validating task references...`);
    console.log(`   📞 Checking Oral A task: ${finalOralA}`);
    if (!validateTaskId(finalOralA, 'oral')) {
      console.error(`      ❌ Invalid format`);
      await closeDatabase();
      process.exit(1);
    }
    console.log(`      ✅ Format valid`);

    console.log(`   📞 Checking Oral B task: ${finalOralB}`);
    if (!validateTaskId(finalOralB, 'oral')) {
      console.error(`      ❌ Invalid format`);
      await closeDatabase();
      process.exit(1);
    }
    console.log(`      ✅ Format valid`);

    console.log(`   🎧 Checking Listening task: ${finalListening}`);
    const listeningTask = await listeningTasksCollection.findOne({ taskId: finalListening });
    if (!listeningTask) {
      console.error(`      ❌ Listening task ${finalListening} not found`);
      console.error(`      💡 Please import listening tasks first using: npm run migrate-reading-listening`);
      await closeDatabase();
      process.exit(1);
    }
    
    // Check listening questions
    const listeningQuestions = await questionsCollection.countDocuments({ 
      taskId: finalListening,
      type: 'listening'
    });
    if (listeningQuestions === 0) {
      console.warn(`      ⚠️  Warning: Listening task has no questions`);
    } else {
      console.log(`      ✅ Found ${listeningQuestions} questions`);
    }

    // Create reading task with AI-generated questions
    console.log(`\n[5/6] Creating reading task with AI-generated questions...`);
    console.log(`   📖 Reading task ID: ${finalReading}`);
    if (readingTheme) {
      console.log(`   🎨 Theme: ${readingTheme}`);
    } else {
      console.log(`   🎨 Theme: (none - using default variety)`);
    }
    
    // Check if reading task already exists
    const existingReadingTask = await readingTasksCollection.findOne({ taskId: finalReading });
    if (existingReadingTask) {
      console.warn(`   ⚠️  Reading task ${finalReading} already exists`);
      console.warn(`   💡 Deleting existing task to create new one with AI-generated questions...`);
      await readingTasksCollection.deleteOne({ taskId: finalReading });
      await questionsCollection.deleteMany({ taskId: finalReading, type: 'reading' });
    }

    // Create reading task
    console.log(`   📝 Creating reading task document...`);
    const defaultPrompt = "Lisez attentivement les textes et répondez aux questions. Vous avez 60 minutes pour compléter cette section.";
    const defaultContent = readingTheme 
      ? `Reading comprehension task ${finalReading} - Questions generated using AI with theme: ${readingTheme}.`
      : `Reading comprehension task ${finalReading} - Questions generated using AI.`;
    
    const newReadingTask = createReadingTask(
      finalReading,
      defaultPrompt,
      defaultContent,
      3600, // 60 minutes
      true
    );

    await readingTasksCollection.insertOne(newReadingTask);
    console.log(`      ✅ Reading task created`);

    // Generate questions using AI
    console.log(`   🤖 Generating 40 questions using AI (this may take a moment)...`);
    if (readingTheme) {
      console.log(`      Theme: ${readingTheme}`);
    }
    console.log(`      Format: TEF Canada (7 sections: A-G)`);
    
    const questions = await generateQuestions(finalReading, {
      theme: readingTheme || undefined
    });

    // Validate questions
    console.log(`   ✔️  Validating generated questions...`);
    const questionValidation = validateGeneratedQuestions(questions);
    if (!questionValidation.valid) {
      console.error('      ❌ Question validation failed:');
      questionValidation.errors.forEach(err => console.error(`         - ${err}`));
      // Clean up the task we just created
      await readingTasksCollection.deleteOne({ taskId: finalReading });
      await closeDatabase();
      process.exit(1);
    }
    console.log(`      ✅ All ${questions.length} questions are valid`);

    // Save questions to database
    console.log(`   💾 Saving questions to database...`);
    await questionsCollection.insertMany(questions);
    console.log(`      ✅ Saved ${questions.length} questions`);

    // Create mock exam
    console.log(`\n[6/6] Creating mock exam...`);
    const mockExam = createMockExam(
      finalMockExamId,
      finalName,
      finalOralA,
      finalOralB,
      finalReading,
      finalListening,
      {
        description,
        isActive: active !== false
      }
    );

    await mockExamsCollection.insertOne(mockExam);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ Mock Exam Created Successfully!');
    console.log('═'.repeat(60));
    console.log(`📝 Mock Exam ID: ${finalMockExamId}`);
    console.log(`📋 Name: ${finalName}`);
    if (description) {
      console.log(`📄 Description: ${description}`);
    }
    console.log(`\n📚 Components:`);
    console.log(`   📞 Oral Expression A: ${finalOralA}`);
    console.log(`   📞 Oral Expression B: ${finalOralB}`);
    console.log(`   📖 Reading Comprehension: ${finalReading} (AI-generated, ${questions.length} questions)`);
    console.log(`   🎧 Listening Comprehension: ${finalListening} (from JSON, ${listeningQuestions} questions)`);
    console.log(`\n⏱️  Total time: ${duration}s`);
    console.log('═'.repeat(60));

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error creating mock exam:');
    console.error(`   ${error.message}`);
    if (error.stack && process.env.VERBOSE) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    await closeDatabase().catch(() => {});
    process.exit(1);
  }
}

/**
 * List mock exams
 */
export async function listMockExamsCommand(argv: any) {
  try {
    const { activeOnly, format } = argv;
    const db = await getDB();
    const mockExamsCollection = db.collection('mockExams');

    const query = activeOnly ? { isActive: true } : {};
    const exams = await mockExamsCollection.find(query).sort({ createdAt: 1 }).toArray();

    if (format === 'json') {
      console.log(formatJSON(exams));
    } else {
      formatMockExamTable(exams as any[]);
    }

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error listing mock exams:', error.message);
    await closeDatabase().catch(() => {});
    process.exit(1);
  }
}

/**
 * Show mock exam details
 */
export async function showMockExamCommand(argv: any) {
  try {
    const { mockExamId } = argv;
    const db = await getDB();
    const mockExamsCollection = db.collection('mockExams');

    const exam = await mockExamsCollection.findOne({ mockExamId });
    if (!exam) {
      console.error(`❌ Mock exam ${mockExamId} not found`);
      process.exit(1);
    }

    printMockExamDetails(exam as any);

    // Show referenced tasks
    const readingTasksCollection = db.collection('readingTasks');
    const listeningTasksCollection = db.collection('listeningTasks');
    const questionsCollection = db.collection('questions');

    const readingTask = await readingTasksCollection.findOne({ taskId: exam.readingTaskId });
    const listeningTask = await listeningTasksCollection.findOne({ taskId: exam.listeningTaskId });
    const readingQuestions = await questionsCollection.countDocuments({ 
      taskId: exam.readingTaskId,
      type: 'reading'
    });
    const listeningQuestions = await questionsCollection.countDocuments({ 
      taskId: exam.listeningTaskId,
      type: 'listening'
    });

    console.log('\n📚 Referenced Tasks:');
    console.log('═'.repeat(50));
    console.log(`Reading Task:  ${exam.readingTaskId} ${readingTask ? '✅' : '❌ Not found'}`);
    if (readingTask) {
      console.log(`   Questions:  ${readingQuestions}`);
    }
    console.log(`Listening Task: ${exam.listeningTaskId} ${listeningTask ? '✅' : '❌ Not found'}`);
    if (listeningTask) {
      console.log(`   Questions:  ${listeningQuestions}`);
    }
    console.log(`Oral A Task:   ${exam.oralATaskId}`);
    console.log(`Oral B Task:   ${exam.oralBTaskId}`);
    console.log('═'.repeat(50));

    await closeDatabase();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error showing mock exam:', error.message);
    await closeDatabase().catch(() => {});
    process.exit(1);
  }
}

/**
 * Validate mock exam references
 */
export async function validateMockExamCommand(argv: any) {
  try {
    const { mockExamId } = argv;
    const db = await getDB();
    const mockExamsCollection = db.collection('mockExams');
    const readingTasksCollection = db.collection('readingTasks');
    const listeningTasksCollection = db.collection('listeningTasks');
    const questionsCollection = db.collection('questions');

    const exam = await mockExamsCollection.findOne({ mockExamId });
    if (!exam) {
      console.error(`❌ Mock exam ${mockExamId} not found`);
      process.exit(1);
    }

    console.log(`\n🔍 Validating mock exam: ${mockExamId}`);
    console.log('═'.repeat(50));

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check reading task
    const readingTask = await readingTasksCollection.findOne({ taskId: exam.readingTaskId });
    if (!readingTask) {
      errors.push(`Reading task ${exam.readingTaskId} not found`);
    } else {
      const readingQuestions = await questionsCollection.countDocuments({ 
        taskId: exam.readingTaskId,
        type: 'reading'
      });
      if (readingQuestions === 0) {
        warnings.push(`Reading task ${exam.readingTaskId} has no questions`);
      } else if (readingQuestions !== 40) {
        warnings.push(`Reading task ${exam.readingTaskId} has ${readingQuestions} questions (expected 40)`);
      }
    }

    // Check listening task
    const listeningTask = await listeningTasksCollection.findOne({ taskId: exam.listeningTaskId });
    if (!listeningTask) {
      errors.push(`Listening task ${exam.listeningTaskId} not found`);
    } else {
      const listeningQuestions = await questionsCollection.countDocuments({ 
        taskId: exam.listeningTaskId,
        type: 'listening'
      });
      if (listeningQuestions === 0) {
        warnings.push(`Listening task ${exam.listeningTaskId} has no questions`);
      } else if (listeningQuestions !== 40) {
        warnings.push(`Listening task ${exam.listeningTaskId} has ${listeningQuestions} questions (expected 40)`);
      }
    }

    // Check oral expression tasks (format only, as they're in knowledge base)
    if (!validateTaskId(exam.oralATaskId, 'oral')) {
      errors.push(`Invalid oralA task ID format: ${exam.oralATaskId}`);
    }
    if (!validateTaskId(exam.oralBTaskId, 'oral')) {
      errors.push(`Invalid oralB task ID format: ${exam.oralBTaskId}`);
    }

    // Print results
    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ All references are valid');
    } else {
      if (errors.length > 0) {
        console.log('\n❌ Errors:');
        errors.forEach(err => console.log(`   - ${err}`));
      }
      if (warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        warnings.forEach(warn => console.log(`   - ${warn}`));
      }
    }

    console.log('═'.repeat(50));

    await closeDatabase();
    process.exit(errors.length > 0 ? 1 : 0);
  } catch (error: any) {
    console.error('❌ Error validating mock exam:', error.message);
    await closeDatabase().catch(() => {});
    process.exit(1);
  }
}

/**
 * Register mock exam commands with yargs
 */
export function registerMockExamCommands(yargsInstance: ReturnType<typeof yargs>) {
  return yargsInstance
    .command('create', 'Create a new mock exam (all parameters optional - auto-generates everything)', (yargs) => {
      return yargs
        .option('mock-exam-id', { type: 'string', describe: 'Mock exam ID (auto-generated if not provided, e.g., mock_4)' })
        .option('name', { type: 'string', describe: 'Mock exam name (auto-generated if not provided)' })
        .option('description', { type: 'string', describe: 'Optional description' })
        .option('oral-a', { type: 'string', describe: 'Oral A task ID (default: oralA_1)' })
        .option('oral-b', { type: 'string', describe: 'Oral B task ID (default: oralB_1)' })
        .option('reading', { type: 'string', describe: 'Reading task ID to create (auto-generated if not provided, e.g., reading_2)' })
        .option('listening', { type: 'string', describe: 'Listening task ID from JSON import (default: listening_1)' })
        .option('reading-theme', { type: 'string', describe: 'Optional theme for AI question generation (e.g., "Télétravail", "Immigration")' })
        .option('active', { type: 'boolean', default: true, describe: 'Whether exam is active' });
    }, createMockExamCommand)
    .command('list', 'List all mock exams', (yargs) => {
      return yargs
        .option('active-only', { type: 'boolean', default: false, describe: 'Show only active exams' })
        .option('format', { type: 'string', choices: ['table', 'json'], default: 'table', describe: 'Output format' });
    }, listMockExamsCommand)
    .command('show <mockExamId>', 'Show mock exam details', (yargs) => {
      return yargs
        .positional('mockExamId', { type: 'string', demandOption: true, describe: 'Mock exam ID to show' });
    }, showMockExamCommand)
    .command('validate <mockExamId>', 'Validate mock exam task references', (yargs) => {
      return yargs
        .positional('mockExamId', { type: 'string', demandOption: true, describe: 'Mock exam ID to validate' });
    }, validateMockExamCommand);
}
