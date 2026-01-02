/**
 * Migration script to import Reading/Listening JSON files to MongoDB
 * 
 * This script:
 * 1. Reads reading_tasks.json and listening_tasks.json
 * 2. Validates data structure (40 questions per task, required fields)
 * 3. Separates tasks and questions into different collections
 * 4. Verifies audio files exist (for Listening tasks)
 * 5. Creates indexes after successful import
 * 6. Is idempotent (safe to run multiple times)
 * 
 * Usage: tsx server/scripts/migrateReadingListeningToDB.ts
 */

import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { connectDB } from '../db/connection';
import { createIndexes } from '../db/indexes';
import { createReadingTask } from '../models/ReadingTask';
import { createListeningTask } from '../models/ListeningTask';
import { createQuestion } from '../models/Question';

interface QuestionInput {
  id: string;
  question: string;
  questionText?: string; // Optional: Question-specific text/passage
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface ReadingTaskInput {
  taskId: string;
  type: 'reading';
  prompt: string;
  content?: string; // Optional: main content (questions now have individual content)
  questions: QuestionInput[];
  timeLimitSec: number;
}

interface ListeningTaskInput {
  taskId: string;
  type: 'listening';
  prompt: string;
  audioUrl: string;
  questions: QuestionInput[];
  timeLimitSec: number;
}

/**
 * Validate question structure
 */
function validateQuestion(question: QuestionInput, questionIndex: number): void {
  if (!question.id) {
    throw new Error(`Question ${questionIndex + 1}: Missing 'id' field`);
  }
  
  if (!question.question || typeof question.question !== 'string') {
    throw new Error(`Question ${questionIndex + 1}: Missing or invalid 'question' field`);
  }
  
  if (!Array.isArray(question.options) || question.options.length !== 4) {
    throw new Error(`Question ${questionIndex + 1}: 'options' must be an array of exactly 4 strings`);
  }
  
  if (typeof question.correctAnswer !== 'number' || question.correctAnswer < 0 || question.correctAnswer > 3) {
    throw new Error(`Question ${questionIndex + 1}: 'correctAnswer' must be a number between 0 and 3`);
  }
  
  if (!question.explanation || typeof question.explanation !== 'string' || question.explanation.trim() === '') {
    throw new Error(`Question ${questionIndex + 1}: Missing or empty 'explanation' field`);
  }
}

/**
 * Validate Reading task structure
 */
function validateReadingTask(task: ReadingTaskInput, taskIndex: number): void {
  if (!task.taskId) {
    throw new Error(`Reading Task ${taskIndex + 1}: Missing 'taskId' field`);
  }
  
  if (!task.prompt || typeof task.prompt !== 'string') {
    throw new Error(`Reading Task ${taskIndex + 1}: Missing or invalid 'prompt' field`);
  }
  
  // Content is now optional for reading tasks (each question has its own content via questionText)
  if (task.content !== undefined && typeof task.content !== 'string') {
    throw new Error(`Reading Task ${taskIndex + 1}: Invalid 'content' field (should be string or omitted)`);
  }
  
  if (!Array.isArray(task.questions) || task.questions.length !== 40) {
    throw new Error(`Reading Task ${taskIndex + 1}: Must have exactly 40 questions, got ${task.questions?.length || 0}`);
  }
  
  task.questions.forEach((q, idx) => validateQuestion(q, idx));
}

/**
 * Validate Listening task structure
 */
function validateListeningTask(task: ListeningTaskInput, taskIndex: number, audioBasePath: string): void {
  if (!task.taskId) {
    throw new Error(`Listening Task ${taskIndex + 1}: Missing 'taskId' field`);
  }
  
  if (!task.prompt || typeof task.prompt !== 'string') {
    throw new Error(`Listening Task ${taskIndex + 1}: Missing or invalid 'prompt' field`);
  }
  
  if (!task.audioUrl || typeof task.audioUrl !== 'string') {
    throw new Error(`Listening Task ${taskIndex + 1}: Missing or invalid 'audioUrl' field`);
  }
  
  // Check if audioUrl is a cloud URL (http:// or https://)
  const isCloudUrl = task.audioUrl.startsWith('http://') || task.audioUrl.startsWith('https://');
  
  // Only verify local file exists if it's not a cloud URL
  if (!isCloudUrl) {
    const audioPath = join(process.cwd(), 'public', task.audioUrl);
    if (!existsSync(audioPath)) {
      console.warn(`  Warning: Listening Task ${taskIndex + 1}: Audio file not found at ${audioPath} (using as placeholder)`);
      // Don't throw error - allow placeholder for now
    }
  }
  
  if (!Array.isArray(task.questions) || task.questions.length !== 40) {
    throw new Error(`Listening Task ${taskIndex + 1}: Must have exactly 40 questions, got ${task.questions?.length || 0}`);
  }
  
  task.questions.forEach((q, idx) => validateQuestion(q, idx));
}

/**
 * Migrate Reading tasks
 */
async function migrateReadingTasks(db: any, tasks: ReadingTaskInput[]): Promise<void> {
  const readingTasksCollection = db.collection('readingTasks');
  const questionsCollection = db.collection('questions');
  
  console.log(`\nMigrating ${tasks.length} Reading tasks...`);
  
  for (let i = 0; i < tasks.length; i++) {
    const taskInput = tasks[i];
    
    try {
      validateReadingTask(taskInput, i);
      
      // Check if task already exists
      const existingTask = await readingTasksCollection.findOne({ taskId: taskInput.taskId });
      
      if (existingTask) {
        console.log(`  Skipping Reading task ${taskInput.taskId} (already exists)`);
        continue;
      }
      
      // Create task document (without questions)
      const task = createReadingTask(
        taskInput.taskId,
        taskInput.prompt,
        taskInput.content,
        taskInput.timeLimitSec || 3600,
        true
      );
      
      // Insert task
      await readingTasksCollection.insertOne(task);
      console.log(`  Imported Reading task: ${taskInput.taskId}`);
      
      // Insert questions separately
      const questionDocs = taskInput.questions.map((q, idx) => 
        createQuestion(
          `${taskInput.taskId}_q${idx + 1}`, // questionId format: "reading_1_q1"
          taskInput.taskId,
          'reading',
          idx + 1, // questionNumber: 1-40
          q.question,
          q.options,
          q.correctAnswer,
          q.explanation,
          true,
          q.questionText // Optional question-specific text
        )
      );
      
      // Check if questions already exist
      const existingQuestions = await questionsCollection.countDocuments({ taskId: taskInput.taskId });
      if (existingQuestions === 0) {
        await questionsCollection.insertMany(questionDocs);
        console.log(`    Imported 40 questions for ${taskInput.taskId}`);
      } else {
        console.log(`    Skipping questions for ${taskInput.taskId} (already exist)`);
      }
      
    } catch (error: any) {
      console.error(`  Error importing Reading task ${taskInput.taskId}:`, error.message);
      throw error;
    }
  }
}

/**
 * Migrate Listening tasks
 */
async function migrateListeningTasks(db: any, tasks: ListeningTaskInput[]): Promise<void> {
  const listeningTasksCollection = db.collection('listeningTasks');
  const questionsCollection = db.collection('questions');
  
  console.log(`\nMigrating ${tasks.length} Listening tasks...`);
  
  for (let i = 0; i < tasks.length; i++) {
    const taskInput = tasks[i];
    
    try {
      validateListeningTask(taskInput, i, 'public');
      
      // Check if task already exists
      const existingTask = await listeningTasksCollection.findOne({ taskId: taskInput.taskId });
      
      if (existingTask) {
        console.log(`  Skipping Listening task ${taskInput.taskId} (already exists)`);
        continue;
      }
      
      // Create task document (without questions)
      const task = createListeningTask(
        taskInput.taskId,
        taskInput.prompt,
        taskInput.audioUrl,
        taskInput.timeLimitSec || 2400,
        true
      );
      
      // Insert task
      await listeningTasksCollection.insertOne(task);
      console.log(`  Imported Listening task: ${taskInput.taskId}`);
      
      // Insert questions separately
      const questionDocs = taskInput.questions.map((q, idx) => 
        createQuestion(
          `${taskInput.taskId}_q${idx + 1}`, // questionId format: "listening_1_q1"
          taskInput.taskId,
          'listening',
          idx + 1, // questionNumber: 1-40
          q.question,
          q.options,
          q.correctAnswer,
          q.explanation,
          true
        )
      );
      
      // Check if questions already exist
      const existingQuestions = await questionsCollection.countDocuments({ taskId: taskInput.taskId });
      if (existingQuestions === 0) {
        await questionsCollection.insertMany(questionDocs);
        console.log(`    Imported 40 questions for ${taskInput.taskId}`);
      } else {
        console.log(`    Skipping questions for ${taskInput.taskId} (already exist)`);
      }
      
    } catch (error: any) {
      console.error(`  Error importing Listening task ${taskInput.taskId}:`, error.message);
      throw error;
    }
  }
}

/**
 * Main migration function
 */
async function migrate(): Promise<void> {
  try {
    console.log('Starting Reading/Listening data migration...\n');
    
    // Connect to database
    const db = await connectDB();
    console.log('Connected to MongoDB\n');
    
    // Read JSON files
    const readingTasksPath = join(process.cwd(), 'data', 'reading_tasks.json');
    const listeningTasksPath = join(process.cwd(), 'data', 'listening_tasks.json');
    
    if (!existsSync(readingTasksPath)) {
      console.warn(`Warning: ${readingTasksPath} not found. Skipping Reading tasks migration.`);
    } else {
      const readingTasksData = readFileSync(readingTasksPath, 'utf-8');
      const readingTasks: ReadingTaskInput[] = JSON.parse(readingTasksData);
      
      if (!Array.isArray(readingTasks)) {
        throw new Error('reading_tasks.json must be an array');
      }
      
      await migrateReadingTasks(db, readingTasks);
    }
    
    if (!existsSync(listeningTasksPath)) {
      console.warn(`Warning: ${listeningTasksPath} not found. Skipping Listening tasks migration.`);
    } else {
      const listeningTasksData = readFileSync(listeningTasksPath, 'utf-8');
      const listeningTasks: ListeningTaskInput[] = JSON.parse(listeningTasksData);
      
      if (!Array.isArray(listeningTasks)) {
        throw new Error('listening_tasks.json must be an array');
      }
      
      await migrateListeningTasks(db, listeningTasks);
    }
    
    // Create indexes
    console.log('\nCreating indexes...');
    await createIndexes();
    
    console.log('\nMigration completed successfully!');
    process.exit(0);
    
  } catch (error: any) {
    console.error('\nMigration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration if executed directly
// Check if this file is being run directly (not imported)
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('migrateReadingListeningToDB.ts') ||
                     process.argv[1]?.includes('migrate-reading-listening');

if (isMainModule || import.meta.url.endsWith('migrateReadingListeningToDB.ts')) {
  migrate();
}

export { migrate };
