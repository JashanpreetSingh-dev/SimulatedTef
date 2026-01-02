/**
 * Database Operations for TTS Generation
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

/**
 * Generate audio for a single AudioItem and update it in the database
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

  // Check if audio already exists
  if (audioItem.audioData && !overwrite) {
    console.log(`   Skipping ${audioItemId} (audio already exists, use --overwrite to regenerate)`);
    return null;
  }

  if (!audioItem.audioScript) {
    throw new Error(`AudioItem ${audioItemId} has no audioScript to generate from`);
  }

  console.log(`   Generating audio for ${audioItemId}...`);
  
  // Generate audio from script
  const audioBuffer = await generateAudioFromScript(
    ttsProvider,
    audioItem.audioScript, 
    DEFAULT_VOICE, 
    audioItem.sectionId
  );
  
  // Update the audio item with generated audio
  await audioItemsCollection.updateOne(
    { audioId: audioItemId, taskId },
    {
      $set: {
        audioData: audioBuffer,
        mimeType: 'audio/wav',
        updatedAt: new Date().toISOString()
      }
    }
  );

  const sizeKB = (audioBuffer.length / 1024).toFixed(2);
  console.log(`   Generated audio for ${audioItemId} (${sizeKB} KB)`);
  
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
 * Generate audio for all audio items with missing/null audioData
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
  const query: any = {
    $or: [
      { audioData: null },
      { audioData: { $exists: false } }
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
