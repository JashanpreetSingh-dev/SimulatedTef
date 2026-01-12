/**
 * AI-powered question generation service for TEF Canada listening comprehension
 * Uses Gemini API to generate questions following the official TEF format
 * 
 * This is the main orchestrator that coordinates prompt management, AI interaction,
 * validation, and data transformation.
 */

import { ReadingListeningQuestion } from "../../types";
import { getMasterPrompt, enhancePrompt } from "./listening/listeningPrompts";
import { createAIClient, generateAIContent } from "./listening/listeningAIClient";
import { validateQuestionCount } from "./listening/listeningValidator";
import { filterAudioItemsForTarget, transformToDatabaseFormat } from "./listening/listeningDataTransformer";

/**
 * Generate questions for a listening task using AI
 * @param taskId - The task ID
 * @param numberOfQuestions - Optional: Number of questions to generate (default: 40 for full mock exam)
 * @param taskPrompt - Optional: Specific prompt/theme for the assignment (for practice assignments)
 */
export async function generateListeningQuestions(
  taskId: string,
  numberOfQuestions?: number,
  taskPrompt?: string
): Promise<{
  audioItems: Array<Omit<any, '_id'>>;
  questions: ReadingListeningQuestion[];
}> {
  const targetQuestionCount = numberOfQuestions || 40;
  console.log(`\n🤖 Generating listening questions for task ${taskId}...`);
  console.log(`📊 Target: ${targetQuestionCount} questions`);

  // Initialize AI client
  const ai = createAIClient();

  // Get and enhance prompt
  const basePrompt = getMasterPrompt();
  const enhancedPrompt = enhancePrompt(basePrompt, targetQuestionCount, taskPrompt);

  // Retry mechanism - try up to 3 times if we don't get the right number of questions
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`\n🔄 Retry attempt ${attempt}/3 (previous attempt did not generate ${targetQuestionCount} questions)...`);
      }

      // Generate content from AI
      const parsed = await generateAIContent(ai, enhancedPrompt);

      // Validate question count
      console.log(`\n📊 Validation: Found ${parsed.audio_items.reduce((sum: number, item: any) => sum + (item.questions?.length || 0), 0)} questions in AI response`);
      const validation = validateQuestionCount(parsed, targetQuestionCount);
      
      if (!validation.valid) {
        if (attempt < 3) {
          console.warn(`\n⚠️  ${validation.error}. Retrying...`);
          lastError = new Error(validation.error || 'Validation failed');
          continue; // Try again
        } else {
          console.error(`\n❌ ERROR: ${validation.error} after ${attempt} attempts.`);
          console.error(`   This is a critical error. The AI must generate exactly ${targetQuestionCount} questions.`);
          console.error(`   Please try running the command again.`);
          throw new Error(`${validation.error}. Please regenerate.`);
        }
      }

      // Filter audio items to only those needed for target count
      const audioItemsToGenerate = filterAudioItemsForTarget(parsed.audio_items, targetQuestionCount);

      // Transform to database format
      const { audioItems, questions } = await transformToDatabaseFormat(
        audioItemsToGenerate,
        taskId,
        targetQuestionCount
      );
      
      console.log(`✅ Generated ${audioItems.length} audio items and ${questions.length} questions (target: ${targetQuestionCount})`);
      
      return { audioItems, questions };
    } catch (error: any) {
      // If it's a validation error and we have retries left, continue
      if (error.message.includes('Expected') && error.message.includes('questions') && attempt < 3) {
        lastError = error;
        continue;
      }
      // Otherwise, throw immediately
      console.error('❌ Error generating listening questions:', error.message);
      throw error;
    }
  }
  
  // If we get here, all retries failed
  if (lastError) {
    throw lastError;
  }
  
  throw new Error('Failed to generate questions after all retry attempts');
}

/**
 * Validate generated listening questions structure
 * Re-exported from validator module for backward compatibility
 */
export { validateGeneratedListeningQuestions } from "./listening/listeningValidator";
