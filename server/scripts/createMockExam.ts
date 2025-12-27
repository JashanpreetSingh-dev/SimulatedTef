/**
 * Script to create a custom mock exam
 *
 * Set environment variables to configure the mock exam:
 * CREATE_MOCK_ORAL_A=1        # Oral Expression A task ID (1-3)
 * CREATE_MOCK_ORAL_B=2        # Oral Expression B task ID (1-3)
 * CREATE_MOCK_READING=1       # Reading task ID (1)
 * CREATE_MOCK_LISTENING=1     # Listening task ID (1)
 * CREATE_MOCK_NAME="Custom Mock Exam"        # Optional: Mock exam name
 * CREATE_MOCK_DESCRIPTION="Custom description"  # Optional: Mock exam description
 *
 * Usage: npm run create-mock
 */

import 'dotenv/config';
import { connectDB } from '../db/connection';
import { createMockExam } from '../models/MockExam';

function getConfig(): {
  oralA: number;
  oralB: number;
  reading: number;
  listening: number;
  name?: string;
  description?: string;
} {
  // Use environment variables or defaults for testing
  const oralA = parseInt(process.env.CREATE_MOCK_ORAL_A || '1');
  const oralB = parseInt(process.env.CREATE_MOCK_ORAL_B || '2');
  const reading = parseInt(process.env.CREATE_MOCK_READING || '1');
  const listening = parseInt(process.env.CREATE_MOCK_LISTENING || '1');
  const name = process.env.CREATE_MOCK_NAME;
  const description = process.env.CREATE_MOCK_DESCRIPTION;

  console.log('📋 Using configuration:');
  console.log(`   Oral A: ${oralA} ${process.env.CREATE_MOCK_ORAL_A ? '(from env)' : '(default)'}`);
  console.log(`   Oral B: ${oralB} ${process.env.CREATE_MOCK_ORAL_B ? '(from env)' : '(default)'}`);
  console.log(`   Reading: ${reading} ${process.env.CREATE_MOCK_READING ? '(from env)' : '(default)'}`);
  console.log(`   Listening: ${listening} ${process.env.CREATE_MOCK_LISTENING ? '(from env)' : '(default)'}`);
  console.log(`   Name: ${name || 'Auto-generated'}`);
  console.log(`   Description: ${description || 'Auto-generated'}`);

  // Validate ranges
  if (oralA < 1 || oralA > 3) {
    console.error('❌ Oral A task ID must be between 1 and 3');
    process.exit(1);
  }
  if (oralB < 1 || oralB > 3) {
    console.error('❌ Oral B task ID must be between 1 and 3');
    process.exit(1);
  }
  if (reading !== 1) {
    console.error('❌ Reading task ID must be 1 (only one reading task available)');
    process.exit(1);
  }
  if (listening !== 1) {
    console.error('❌ Listening task ID must be 1 (only one listening task available)');
    process.exit(1);
  }

  return { oralA, oralB, reading, listening, name, description };
}

async function createCustomMockExam(): Promise<void> {
  try {
    console.log('🚀 Creating custom mock exam...\n');

    const config = getConfig();
    console.log('📋 Configuration:');
    console.log(`   Oral A: ${config.oralA}`);
    console.log(`   Oral B: ${config.oralB}`);
    console.log(`   Reading: ${config.reading}`);
    console.log(`   Listening: ${config.listening}`);
    console.log(`   Name: ${config.name || 'Auto-generated'}`);
    console.log(`   Description: ${config.description || 'Auto-generated'}\n`);

    const db = await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const mockExamsCollection = db.collection('mockExams');

    // Generate unique mock exam ID
    const mockExamId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Use default name if not provided
    const name = config.name || `Custom Mock Exam (${config.oralA}-${config.oralB}-${config.reading}-${config.listening})`;

    // Create the mock exam
    const mockExam = createMockExam(
      mockExamId,
      name,
      `oralA_${config.oralA}`,
      `oralB_${config.oralB}`,
      `reading_${config.reading}`,
      `listening_${config.listening}`,
      {
        description: config.description || `Custom mock exam with Oral A: ${config.oralA}, Oral B: ${config.oralB}, Reading: ${config.reading}, Listening: ${config.listening}`,
        isActive: true,
      }
    );

    // Insert into database
    const result = await mockExamsCollection.insertOne(mockExam);

    console.log('✅ Custom mock exam created successfully!');
    console.log(`📋 Mock Exam ID: ${mockExamId}`);
    console.log(`📝 Name: ${name}`);
    console.log(`🔢 Oral Expression A: Task ${config.oralA}`);
    console.log(`🔢 Oral Expression B: Task ${config.oralB}`);
    console.log(`📖 Reading: Task ${config.reading}`);
    console.log(`🎧 Listening: Task ${config.listening}`);
    console.log(`🆔 Database ID: ${result.insertedId}`);

    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Failed to create mock exam:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
createCustomMockExam();

export { createCustomMockExam };