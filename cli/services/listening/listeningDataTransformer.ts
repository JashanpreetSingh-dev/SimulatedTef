/**
 * Data transformation for listening question generation
 * Converts AI response to database format and handles audio generation
 * Audio files are now uploaded to S3 instead of stored in MongoDB
 */

import { ReadingListeningQuestion } from "../../../types";
import { createQuestion } from "../../../server/models/Question";
import { createAudioItem } from "../../../server/models/AudioItem";
import { generateAudioFromScript } from "../tts/generation";
import { normalizeScriptFormat } from "../tts/scriptNormalizer";
import { getTTSProvider } from "../ttsProviders";
import { s3Service } from "../../../server/services/s3Service";

/**
 * Filter audio items to only those needed for the target question count
 */
export function filterAudioItemsForTarget(
  audioItems: any[],
  targetQuestionCount: number
): any[] {
  let questionsUsed = 0;
  const audioItemsToGenerate: any[] = [];
  
  for (const audioItem of audioItems) {
    const itemQuestionCount = audioItem.questions?.length || 0;
    if (questionsUsed + itemQuestionCount <= targetQuestionCount) {
      audioItemsToGenerate.push(audioItem);
      questionsUsed += itemQuestionCount;
    } else {
      // This audio item would exceed the target count, stop here
      break;
    }
  }

  return audioItemsToGenerate;
}

/**
 * Transform AI response to database format
 * Audio files are uploaded to S3 and s3Key is stored in the document
 */
export async function transformToDatabaseFormat(
  audioItemsToGenerate: any[],
  taskId: string,
  targetQuestionCount: number
): Promise<{
  audioItems: Array<Omit<any, '_id'>>;
  questions: ReadingListeningQuestion[];
}> {
  let audioItems: Array<Omit<any, '_id'>> = [];
  const questions: ReadingListeningQuestion[] = [];
  let globalQuestionNumber = 1;

  console.log(`\n🎤 Will generate audio for ${audioItemsToGenerate.length} audio items (covering ${audioItemsToGenerate.reduce((sum, item) => sum + (item.questions?.length || 0), 0)} questions)`);

  // Initialize TTS provider once for all audio items
  let ttsProvider;
  try {
    ttsProvider = getTTSProvider();
    console.log(`   TTS Provider initialized for audio generation`);
  } catch (error: any) {
    console.warn(`\n⚠️  Failed to initialize TTS provider: ${error.message}`);
    console.warn(`   Audio items will be created without audio data. You can generate audio later.`);
    ttsProvider = null;
  }

  // Check if S3 is configured
  const s3Configured = s3Service.isS3Configured();
  if (!s3Configured) {
    console.warn(`\n⚠️  S3 is not configured. Audio files will not be stored.`);
    console.warn(`   Please set AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables.`);
  }

  for (const audioItem of audioItemsToGenerate) {
    // Normalize script format first (used for both audio generation and storage)
    let normalizedScript = normalizeScriptFormat(audioItem.audio_script, audioItem.section_id);
    
    // Generate audio from script using TTS service
    let s3Key: string | undefined = undefined;
    if (ttsProvider) {
      try {
        console.log(`🎤 Generating audio for ${audioItem.audio_id}...`);
        
        const defaultVoice = 'Kore';
        const audioData = await generateAudioFromScript(
          ttsProvider,
          normalizedScript,
          defaultVoice,
          audioItem.section_id
        );
        
        // Re-normalize to ensure stored script exactly matches what was used for TTS
        normalizedScript = normalizeScriptFormat(normalizedScript, audioItem.section_id);
        
        console.log(`✅ Audio generated for ${audioItem.audio_id} (${audioData.length} bytes)`);

        // Upload to S3 if configured
        if (s3Configured && audioData) {
          try {
            s3Key = s3Service.generateAudioItemKey(taskId, audioItem.audio_id, 'wav');
            await s3Service.uploadAudio(audioData, s3Key, 'audio/wav');
            console.log(`☁️  Uploaded to S3: ${s3Key}`);
          } catch (s3Error: any) {
            console.error(`⚠️  Failed to upload to S3 for ${audioItem.audio_id}:`, s3Error.message);
            s3Key = undefined;
          }
        }
      } catch (error: any) {
        console.error(`⚠️  Failed to generate audio for ${audioItem.audio_id}:`, error.message);
        // Continue without audio data - script is still saved
      }
    }
    
    // Create AudioItem with s3Key (instead of audioData buffer)
    const audioItemDoc = createAudioItem(
      audioItem.audio_id,
      taskId,
      audioItem.section_id,
      normalizedScript,
      audioItem.repeatable || false,
      s3Key // Pass s3Key instead of audioData buffer
    );
    audioItems.push(audioItemDoc);

    // Create Questions for this audio (only up to target count)
    if (audioItem.questions && Array.isArray(audioItem.questions)) {
      for (const q of audioItem.questions) {
        // Stop if we've reached the target question count
        if (globalQuestionNumber > targetQuestionCount) {
          break;
        }
        
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
          undefined, // questionText not used for listening
          audioItem.audio_id // audioId reference
        );
        questions.push(questionDoc);
        globalQuestionNumber++;
        
        // Stop immediately if we've reached the exact target
        if (globalQuestionNumber > targetQuestionCount) {
          break;
        }
      }
    }
    
    // Stop processing audio items if we've reached the target
    if (globalQuestionNumber > targetQuestionCount) {
      break;
    }
  }

  // Final validation: ensure we created exactly the requested number
  if (questions.length !== targetQuestionCount) {
    console.warn(`⚠️  WARNING: Created ${questions.length} questions but requested ${targetQuestionCount}`);
    // Trim to exact count if we somehow created more
    if (questions.length > targetQuestionCount) {
      console.warn(`   Trimming to ${targetQuestionCount} questions`);
      questions.splice(targetQuestionCount);
      // Also filter audio items to only those used by the trimmed questions
      const audioIdsUsed = new Set(questions.map(q => q.audioId).filter(Boolean));
      audioItems = audioItems.filter(item => audioIdsUsed.has(item.audioId));
    }
  }

  return { audioItems, questions };
}
