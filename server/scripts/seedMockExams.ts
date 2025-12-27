/**
 * Script to seed predefined mock exams
 * 
 * Usage: tsx server/scripts/seedMockExams.ts
 */

import 'dotenv/config';
import { connectDB } from '../db/connection';
import { createMockExam } from '../models/MockExam';

async function seedMockExams(): Promise<void> {
  try {
    console.log('🚀 Starting mock exam seeding...\n');

    const db = await connectDB();
    console.log('✅ Connected to MongoDB\n');

    const mockExamsCollection = db.collection('mockExams');

    // Check current state
    const existingCount = await mockExamsCollection.countDocuments();
    console.log(`📊 Currently ${existingCount} mock exams in database`);

    // Mock Exam 1: Complete mock exam with all sections
    const mockExam1 = createMockExam(
      'mock_1',
      'Mock Exam 1 - Complete Practice',
      'oralA_1',
      'oralB_1',
      'reading_1',
      'listening_1',
      {
        description: 'Premier examen blanc complet avec toutes les sections (Expression orale, compréhension écrite et compréhension orale)',
        isActive: true,
      }
    );

    // Mock Exam 2: Different combination of tasks
    const mockExam2 = createMockExam(
      'mock_2',
      'Mock Exam 2 - Business & Travel',
      'oralA_2',
      'oralB_3',
      'reading_1',
      'listening_1',
      {
        description: 'Examen blanc axé sur les thèmes professionnels et voyages',
        isActive: true,
      }
    );

    // Mock Exam 3: Another variation
    const mockExam3 = createMockExam(
      'mock_3',
      'Mock Exam 3 - Education & Culture',
      'oralA_3',
      'oralB_2',
      'reading_1',
      'listening_1',
      {
        description: 'Examen blanc centré sur l\'éducation et la culture',
        isActive: true,
      }
    );

    const mockExams = [mockExam1, mockExam2, mockExam3];

    console.log(`\n🔧 Processing ${mockExams.length} mock exams to seed...`);

    for (const mockExam of mockExams) {
      console.log(`📝 Processing: ${mockExam.mockExamId} - ${mockExam.name}`);

      // Check if already exists
      const existing = await mockExamsCollection.findOne({ mockExamId: mockExam.mockExamId });
      if (!existing) {
        const result = await mockExamsCollection.insertOne(mockExam);
        console.log(`   ✅ Created mock exam: ${mockExam.mockExamId}`);
      } else {
        console.log(`   ⏭️  Mock exam ${mockExam.mockExamId} already exists, skipping`);
      }
    }

    console.log('\n✅ Mock exam seeding completed!');
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run seeding if executed directly
seedMockExams();

export { seedMockExams };
