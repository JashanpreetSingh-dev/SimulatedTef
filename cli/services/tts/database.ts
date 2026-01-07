/**
 * Database Operations for TTS Generation
 * Audio files are uploaded to S3, with s3Key stored in MongoDB
 */

import { getDB } from "../../utils/db";
import { DEFAULT_VOICE, GenerationStats, MissingAudioStats } from './types';
import { generateAudioFromScript } from './generation';
import { TTSService } from '../ttsProviders';
import {
  logTaskStart,
  logTaskComplete,
  logMissingAudioStart,
  logMissingAudioComplete
} from './logger';
import { s3Service } from '../../../server/services/s3Service';

/**
 * Generate audio for a single AudioItem and upload to S3
 */
export async function generateAudioForItem(
  ttsProvider: TTSService,
  audioItemId: string,
  taskId: string,
  overwrite: boolean = false
): Promise<Buffer | null> {
  const db = await getDB();
  const audioItemsCollection = db.collection('audioItems');

  const audioItem = await audioItemsCollection.findOne({ audioId: audioItemId, taskId });
  
  if (!audioItem) {
    throw new Error(`AudioItem ${audioItemId} not found for task ${taskId}`);
  }

  // Check if audio already exists (S3 or legacy MongoDB)
  if ((audioItem.s3Key || audioItem.audioData) && !overwrite) {
    console.log(`   Skipping ${audioItemId} (audio already exists, use --overwrite to regenerate)`);
    return null;
  }

  if (!audioItem.audioScript) {
    throw new Error(`AudioItem ${audioItemId} has no audioScript to generate from`);
  }

  // Check if S3 is configured
  if (!s3Service.isS3Configured()) {
    throw new Error('S3 is not configured. Please set AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables.');
  }

  console.log(`   Generating audio for ${audioItemId}...`);
  
  // Generate audio from script
  const audioBuffer = await generateAudioFromScript(
    ttsProvider,
    audioItem.audioScript, 
    DEFAULT_VOICE, 
    audioItem.sectionId
  );
  
  // Normalize the script to match what was used for TTS
  const { normalizeScriptFormat } = await import('./scriptNormalizer');
  const normalizedScript = normalizeScriptFormat(audioItem.audioScript, audioItem.sectionId);
  
  // Upload to S3
  const s3Key = s3Service.generateAudioItemKey(taskId, audioItemId, 'wav');
  await s3Service.uploadAudio(audioBuffer, s3Key, 'audio/wav');
  
  // Update the audio item with S3 key (not binary data)
  await audioItemsCollection.updateOne(
    { audioId: audioItemId, taskId },
    {
      $set: {
        s3Key: s3Key,
        audioScript: normalizedScript,
        mimeType: 'audio/wav',
        updatedAt: new Date().toISOString()
      },
      // Remove legacy audioData if it exists
      $unset: {
        audioData: ""
      }
    }
  );

  const sizeKB = (audioBuffer.length / 1024).toFixed(2);
  console.log(`   ☁️  Uploaded to S3: ${s3Key} (${sizeKB} KB)`);
  
  return audioBuffer;
}

/**
 * Generate audio for all AudioItems in a task
 */
export async function generateAudioForTask(
  ttsProvider: TTSService,
  taskId: string,
  overwrite: boolean = false
): Promise<GenerationStats> {
  const db = await getDB();
  const audioItemsCollection = db.collection('audioItems');

  const audioItems = await audioItemsCollection
    .find({ taskId })
    .sort({ sectionId: 1, audioId: 1 })
    .toArray();

  if (audioItems.length === 0) {
    throw new Error(`No AudioItems found for task ${taskId}`);
  }

  logTaskStart(audioItems.length, taskId, overwrite);

  const stats = await processAudioItems(ttsProvider, audioItems, taskId, overwrite);
  
  logTaskComplete(stats, audioItems.length);
  
  return stats;
}

/**
 * Generate audio for all audio items with missing/null s3Key (and no legacy audioData)
 */
export async function generateMissingAudio(
  ttsProvider: TTSService,
  taskId?: string
): Promise<MissingAudioStats> {
  const db = await getDB();
  const audioItemsCollection = db.collection('audioItems');

  const query = buildMissingAudioQuery(taskId);
  const audioItems = await audioItemsCollection
    .find(query)
    .sort({ taskId: 1, sectionId: 1, audioId: 1 })
    .toArray();

  if (audioItems.length === 0) {
    const taskFilter = taskId ? ` for task ${taskId}` : '';
    console.log(`\nNo audio items with missing audio found${taskFilter}`);
    return createEmptyStats();
  }

  const uniqueTaskIds = Array.from(new Set(audioItems.map((item: any) => item.taskId)));
  logMissingAudioStart(audioItems.length, taskId, uniqueTaskIds);

  const stats = await processMissingAudioItems(ttsProvider, audioItems);
  
  logMissingAudioComplete(stats, audioItems.length);
  
  return stats;
}

// ============================================================================
// Processing Helpers
// ============================================================================

function buildMissingAudioQuery(taskId?: string): any {
  // Find items that have neither s3Key nor audioData
  const query: any = {
    $and: [
      { $or: [{ s3Key: null }, { s3Key: { $exists: false } }] },
      { $or: [{ audioData: null }, { audioData: { $exists: false } }] }
    ]
  };

  if (taskId) {
    query.taskId = taskId;
  }

  return query;
}

async function processAudioItems(
  ttsProvider: TTSService,
  audioItems: any[],
  taskId: string,
  overwrite: boolean
): Promise<GenerationStats> {
  const stats: GenerationStats = {
    total: audioItems.length,
    generated: 0,
    skipped: 0,
    failed: 0
  };

  for (const item of audioItems) {
    try {
      const result = await generateAudioForItem(ttsProvider, item.audioId, taskId, overwrite);
      if (result) {
        stats.generated++;
      } else {
        stats.skipped++;
      }
    } catch (error: any) {
      console.error(`   Failed to generate audio for ${item.audioId}:`, error.message);
      stats.failed++;
    }
  }

  return stats;
}

async function processMissingAudioItems(
  ttsProvider: TTSService,
  audioItems: any[]
): Promise<MissingAudioStats> {
  const stats: MissingAudioStats = {
    total: audioItems.length,
    generated: 0,
    skipped: 0,
    failed: 0,
    tasksProcessed: []
  };

  for (const item of audioItems) {
    // Track which tasks we've processed
    if (!stats.tasksProcessed.includes(item.taskId)) {
      stats.tasksProcessed.push(item.taskId);
    }
    
    try {
      if (!item.audioScript) {
        console.warn(`   Skipping ${item.audioId} (no audioScript)`);
        stats.skipped++;
        continue;
      }

      const result = await generateAudioForItem(ttsProvider, item.audioId, item.taskId, false);
      if (result) {
        stats.generated++;
      } else {
        stats.skipped++;
      }
    } catch (error: any) {
      console.error(`   Failed to generate audio for ${item.audioId} (task: ${item.taskId}):`, error.message);
      stats.failed++;
    }
  }

  return stats;
}

function createEmptyStats(): MissingAudioStats {
  return {
    total: 0,
    generated: 0,
    skipped: 0,
    failed: 0,
    tasksProcessed: []
  };
}
