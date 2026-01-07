/**
 * Assignment Service - manages practice assignments created by examiners
 */

import { connectDB } from '../db/connection';
import { Assignment, AssignmentSettings, AssignmentType, ReadingListeningQuestion } from '../../types';
import { createAssignment } from '../models/Assignment';
import { createReadingTask } from '../models/ReadingTask';
import { createListeningTask } from '../models/ListeningTask';
import { readingTaskService } from './readingTaskService';
import { listeningTaskService } from './listeningTaskService';
import { questionService } from './questionService';
import { generateQuestions as generateReadingQuestions } from '../../cli/services/questionGenerator';
import { generateListeningQuestions } from '../../cli/services/listeningQuestionGenerator';
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey: apiKey.trim() }) : null;

/**
 * Generate assignment title from prompt using AI (if title not provided)
 */
async function generateTitleFromPrompt(prompt: string): Promise<string> {
  if (!ai) {
    // Fallback if AI not available
    return prompt.substring(0, 50) + (prompt.length > 50 ? '...' : '');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        parts: [{
          text: `Generate a concise, professional title (maximum 60 characters) for a French language practice assignment based on this prompt:\n\n${prompt}\n\nReturn only the title, no quotes, no explanation.`
        }]
      }]
    });

    const title = (response.text || '').trim();
    return title || prompt.substring(0, 50) + (prompt.length > 50 ? '...' : '');
  } catch (error) {
    console.error('Error generating title:', error);
    return prompt.substring(0, 50) + (prompt.length > 50 ? '...' : '');
  }
}

export const assignmentService = {
  /**
   * Check if prompt already exists in existing tasks (to avoid duplicates with mock exams)
   */
  async checkPromptExists(prompt: string, type: AssignmentType): Promise<boolean> {
    const db = await connectDB();
    const collectionName = type === 'reading' ? 'readingTasks' : 'listeningTasks';
    
    const existing = await db.collection(collectionName).findOne({
      prompt: prompt.trim()
    });
    
    return existing !== null;
  },

  /**
   * Create a new assignment (draft)
   */
  async createAssignment(
    type: AssignmentType,
    title: string | undefined,
    prompt: string,
    settings: AssignmentSettings,
    createdBy: string,
    creatorName?: string,
    orgId?: string
  ): Promise<Assignment> {
    const db = await connectDB();
    
    // Check if prompt already exists
    const promptExists = await this.checkPromptExists(prompt, type);
    if (promptExists) {
      throw new Error('An assignment or mock exam with this prompt already exists. Please use a different prompt.');
    }
    
    // Generate title if not provided
    let finalTitle = title;
    if (!finalTitle || finalTitle.trim() === '') {
      finalTitle = await generateTitleFromPrompt(prompt);
    }

    // Generate assignment ID
    const assignmentsCollection = db.collection('assignments');
    const existingAssignments = await assignmentsCollection.find({}).toArray();
    const assignmentNumbers = existingAssignments
      .map((a: any) => {
        const match = a.assignmentId?.match(/^assignment_(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((n: number) => n > 0);
    const nextNumber = assignmentNumbers.length > 0 ? Math.max(...assignmentNumbers) + 1 : 1;
    const assignmentId = `assignment_${nextNumber}`;

    // Create assignment
    const assignment = createAssignment(
      assignmentId,
      type,
      finalTitle,
      prompt,
      settings,
      createdBy,
      'draft',
      undefined, // taskId
      undefined, // questionIds
      creatorName,
      orgId
    );

    // Save to database
    await assignmentsCollection.insertOne(assignment);
    
    return assignment;
  },

  /**
   * Generate questions for an assignment using AI
   */
  async generateQuestions(assignmentId: string): Promise<{ taskId: string; questionIds: string[] }> {
    const db = await connectDB();
    const assignmentsCollection = db.collection('assignments');
    
    // Get assignment
    const assignment = await assignmentsCollection.findOne({ assignmentId });
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found`);
    }

    const assignmentData = assignment as unknown as Assignment;

    // Generate task ID based on assignment type
    let taskId: string;
    if (assignmentData.type === 'reading') {
      // Get next reading task number
      const readingTasks = await db.collection('readingTasks').find({}).toArray();
      const taskNumbers = readingTasks
        .map((t: any) => {
          const match = t.taskId?.match(/^reading_(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter((n: number) => n > 0);
      const nextNumber = taskNumbers.length > 0 ? Math.max(...taskNumbers) + 1 : 1;
      taskId = `reading_${nextNumber}`;

      // Create reading task
      const readingTask = createReadingTask(
        taskId,
        assignmentData.prompt,
        '', // Content will be generated by AI in questions
        assignmentData.settings.timeLimitSec || 3600,
        true
      );
      await db.collection('readingTasks').insertOne(readingTask);

      // Generate questions - pass numberOfQuestions for practice mode
      const questions = await generateReadingQuestions(taskId, {
        theme: assignmentData.settings.theme || assignmentData.prompt,
        numberOfQuestions: assignmentData.settings.numberOfQuestions
      });
      
      // Renumber questions sequentially (in case AI didn't number correctly)
      const renumberedQuestions = questions.map((q, index) => ({
        ...q,
        questionNumber: index + 1,
        questionId: `${taskId}_q${index + 1}`
      }));

      // Save questions
      const questionsCollection = db.collection('questions');
      await questionsCollection.insertMany(renumberedQuestions);

      // Update assignment with taskId and questionIds
      const questionIds = renumberedQuestions.map(q => q.questionId);
      await assignmentsCollection.updateOne(
        { assignmentId },
        {
          $set: {
            taskId,
            questionIds,
            updatedAt: new Date().toISOString()
          }
        }
      );

      return { taskId, questionIds };
    } else {
      // Listening assignment
      const listeningTasks = await db.collection('listeningTasks').find({}).toArray();
      const taskNumbers = listeningTasks
        .map((t: any) => {
          const match = t.taskId?.match(/^listening_(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter((n: number) => n > 0);
      const nextNumber = taskNumbers.length > 0 ? Math.max(...taskNumbers) + 1 : 1;
      taskId = `listening_${nextNumber}`;

      // Create listening task
      const listeningTask = createListeningTask(
        taskId,
        assignmentData.prompt,
        '', // audioUrl - audio stored in AudioItems
        assignmentData.settings.timeLimitSec || 2400,
        true
      );
      await db.collection('listeningTasks').insertOne(listeningTask);

      // Generate questions and audio items (only generate what's needed)
      // Pass the assignment prompt so AI can generate content aligned with the teacher's theme
      const { audioItems, questions: allQuestions } = await generateListeningQuestions(
        taskId,
        assignmentData.settings.numberOfQuestions,
        assignmentData.prompt // Include assignment prompt for practice assignments
      );

      // Questions should already be exactly the requested number from generateListeningQuestions
      // But ensure we don't exceed just in case
      const questions = allQuestions.slice(0, assignmentData.settings.numberOfQuestions);
      
      if (questions.length !== assignmentData.settings.numberOfQuestions) {
        console.warn(`⚠️  WARNING: Expected ${assignmentData.settings.numberOfQuestions} questions, got ${questions.length}`);
      }
      
      // Renumber questions sequentially
      const renumberedQuestions = questions.map((q, index) => ({
        ...q,
        questionNumber: index + 1,
        questionId: `${taskId}_q${index + 1}`
      }));

      // CRITICAL: Filter audio items to only include those referenced by the selected questions
      // This ensures we don't save audio items that aren't used, and prevents mismatches
      const audioIdsUsed = new Set(renumberedQuestions.map(q => q.audioId).filter(Boolean));
      const filteredAudioItems = audioItems.filter(item => audioIdsUsed.has(item.audioId));
      
      // Validate that all questions have matching audio items
      const audioItemMap = new Map(filteredAudioItems.map(item => [item.audioId, item]));
      const missingAudioItems: string[] = [];
      for (const question of renumberedQuestions) {
        if (question.audioId && !audioItemMap.has(question.audioId)) {
          missingAudioItems.push(`Question ${question.questionNumber} (audioId: ${question.audioId})`);
        }
      }
      
      if (missingAudioItems.length > 0) {
        console.error(`❌ ERROR: Questions reference audio items that don't exist:`);
        missingAudioItems.forEach(msg => console.error(`   - ${msg}`));
        throw new Error(`Questions reference ${missingAudioItems.length} audio items that were not generated. This indicates a mismatch between questions and audio items.`);
      }
      
      console.log(`📦 Saving ${filteredAudioItems.length} audio items (out of ${audioItems.length} generated) for ${renumberedQuestions.length} questions`);
      console.log(`   Audio IDs used: ${Array.from(audioIdsUsed).join(', ')}`);
      console.log(`   ✅ All questions have matching audio items`);

      // Save only the audio items needed for the selected questions
      if (filteredAudioItems.length > 0) {
        await db.collection('audioItems').insertMany(filteredAudioItems);
      }
      await db.collection('questions').insertMany(renumberedQuestions);

      // Update assignment with taskId and questionIds
      const questionIds = renumberedQuestions.map(q => q.questionId);
      await assignmentsCollection.updateOne(
        { assignmentId },
        {
          $set: {
            taskId,
            questionIds,
            updatedAt: new Date().toISOString()
          }
        }
      );

      return { taskId, questionIds };
    }
  },

  /**
   * Get assignment by ID with questions populated
   */
  async getAssignmentById(assignmentId: string): Promise<Assignment & { questions?: any[]; task?: any } | null> {
    const db = await connectDB();
    const assignmentsCollection = db.collection('assignments');
    
    const assignment = await assignmentsCollection.findOne({ assignmentId });
    if (!assignment) {
      return null;
    }

    const assignmentData = assignment as unknown as Assignment;

    // Fetch questions if taskId exists
    let questions = null;
    let task = null;
    
    if (assignmentData.taskId) {
      // Use questionIds from assignment to fetch only the questions that belong to this assignment
      // This prevents fetching questions from other assignments that might share the same taskId pattern
      if (assignmentData.questionIds && assignmentData.questionIds.length > 0) {
        const db = await connectDB();
        questions = await db.collection('questions')
          .find({ 
            questionId: { $in: assignmentData.questionIds },
            isActive: true 
          })
          .sort({ questionNumber: 1 })
          .toArray() as unknown as ReadingListeningQuestion[];
      } else {
        // Fallback to taskId if questionIds not available (for backwards compatibility)
        questions = await questionService.getQuestionsByTaskId(assignmentData.taskId);
      }
      
      if (assignmentData.type === 'reading') {
        task = await readingTaskService.getTaskById(assignmentData.taskId);
      } else {
        task = await listeningTaskService.getTaskById(assignmentData.taskId);
      }
    }

    return {
      ...assignmentData,
      questions: questions || undefined,
      task: task || undefined
    };
  },

  /**
   * Update assignment
   */
  async updateAssignment(
    assignmentId: string,
    updates: Partial<Pick<Assignment, 'title' | 'prompt' | 'settings' | 'status'>>
  ): Promise<Assignment> {
    const db = await connectDB();
    const assignmentsCollection = db.collection('assignments');
    
    const assignment = await assignmentsCollection.findOne({ assignmentId });
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found`);
    }

    const updateData: any = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await assignmentsCollection.updateOne(
      { assignmentId },
      { $set: updateData }
    );

    const updated = await assignmentsCollection.findOne({ assignmentId });
    return updated as unknown as Assignment;
  },

  /**
   * Update a specific question in an assignment
   */
  async updateQuestion(
    assignmentId: string,
    questionId: string,
    updates: Partial<{
      question: string;
      questionText?: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>
  ): Promise<void> {
    const db = await connectDB();
    const questionsCollection = db.collection('questions');
    
    // Verify assignment exists and question belongs to it
    const assignment = await this.getAssignmentById(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found`);
    }

    if (!assignment.questionIds || !assignment.questionIds.includes(questionId)) {
      throw new Error(`Question ${questionId} does not belong to assignment ${assignmentId}`);
    }

    const updateData: any = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await questionsCollection.updateOne(
      { questionId },
      { $set: updateData }
    );
  },

  /**
   * Publish assignment (set status to 'published')
   */
  async publishAssignment(assignmentId: string): Promise<Assignment> {
    return this.updateAssignment(assignmentId, { status: 'published' });
  },

  /**
   * Unpublish assignment (set status to 'draft')
   */
  async unpublishAssignment(assignmentId: string): Promise<Assignment> {
    return this.updateAssignment(assignmentId, { status: 'draft' });
  },

  /**
   * Get all assignments created by a user
   */
  async getAssignmentsByCreator(userId: string): Promise<Assignment[]> {
    const db = await connectDB();
    const assignmentsCollection = db.collection('assignments');
    
    const assignments = await assignmentsCollection
      .find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return assignments as unknown as Assignment[];
  },

  /**
   * Get all assignments for an organization (org-wide visibility)
   */
  async getAssignmentsByOrg(orgId: string, currentUserId: string): Promise<(Assignment & { isOwner: boolean })[]> {
    const db = await connectDB();
    const assignmentsCollection = db.collection('assignments');
    
    const assignments = await assignmentsCollection
      .find({ orgId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return (assignments as unknown as Assignment[]).map(assignment => ({
      ...assignment,
      isOwner: assignment.createdBy === currentUserId
    }));
  },

  /**
   * Get all published assignments (for practice section)
   */
  async getPublishedAssignments(type?: AssignmentType, orgId?: string): Promise<Assignment[]> {
    const db = await connectDB();
    const assignmentsCollection = db.collection('assignments');
    
    const query: any = { status: 'published' };
    if (type) {
      query.type = type;
    }
    // Only show assignments from the user's organization
    if (orgId) {
      query.orgId = orgId;
    }
    
    const assignments = await assignmentsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    return assignments as unknown as Assignment[];
  },

  /**
   * Delete assignment
   */
  async deleteAssignment(assignmentId: string): Promise<void> {
    const db = await connectDB();
    const assignmentsCollection = db.collection('assignments');
    
    const assignment = await assignmentsCollection.findOne({ assignmentId });
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found`);
    }

    const assignmentData = assignment as unknown as Assignment;

    // Delete associated questions
    if (assignmentData.questionIds && assignmentData.questionIds.length > 0) {
      await db.collection('questions').deleteMany({
        questionId: { $in: assignmentData.questionIds }
      });
      console.log(`🗑️ Deleted ${assignmentData.questionIds.length} questions for assignment ${assignmentId}`);
    }

    // Delete associated task and audio items
    if (assignmentData.taskId) {
      const taskCollection = assignmentData.type === 'reading' ? 'readingTasks' : 'listeningTasks';
      
      // For listening tasks, also delete audio items and S3 files
      if (assignmentData.type === 'listening') {
        // Get audio items to delete S3 files
        const audioItems = await db.collection('audioItems')
          .find({ taskId: assignmentData.taskId })
          .toArray();
        
        // Delete S3 audio files
        if (audioItems.length > 0) {
          const { s3Service } = await import('./s3Service');
          for (const audioItem of audioItems) {
            if (audioItem.s3Key) {
              try {
                await s3Service.deleteAudio(audioItem.s3Key);
                console.log(`🗑️ Deleted S3 audio: ${audioItem.s3Key}`);
              } catch (err) {
                console.error(`Failed to delete S3 audio ${audioItem.s3Key}:`, err);
              }
            }
          }
        }
        
        // Delete audio items from database
        const audioDeleteResult = await db.collection('audioItems').deleteMany({ taskId: assignmentData.taskId });
        console.log(`🗑️ Deleted ${audioDeleteResult.deletedCount} audio items for task ${assignmentData.taskId}`);
      }
      
      // Delete the task
      await db.collection(taskCollection).deleteOne({ taskId: assignmentData.taskId });
      console.log(`🗑️ Deleted ${assignmentData.type} task: ${assignmentData.taskId}`);
    }

    // Delete the assignment
    await assignmentsCollection.deleteOne({ assignmentId });
    console.log(`🗑️ Deleted assignment: ${assignmentId}`);
  }
};
