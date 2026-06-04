/**
 * TTS Generator Service - Main Entry Point
 * Generates natural French audio from scripts
 * Supports Google Cloud TTS (recommended) and Gemini TTS (fallback)
 */

import { getTTSProvider, TTSService } from "./ttsProviders";
import { 
  generateAudioForItem as generateAudioForItemDB, 
  generateAudioForTask as generateAudioForTaskDB, 
  generateMissingAudio as generateMissingAudioDB 
} from './tts/database';

// ============================================================================
// TTS Provider Initialization
// ============================================================================

let ttsProvider: TTSService | undefined;

function getProviderName(): string {
  const provider = (process.env.TTS_PROVIDER || '').toLowerCase().trim();
  const hasServiceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS !== undefined;

  if (provider === 'gcp' || provider === 'google-cloud' || (hasServiceAccount && provider !== 'gemini')) {
    return 'Google Cloud TTS';
  }
  return 'Gemini TTS';
}

function getProvider(): TTSService {
  if (!ttsProvider) {
    try {
      ttsProvider = getTTSProvider();
      console.log(`TTS Provider initialized: ${getProviderName()}`);
    } catch (error: any) {
      console.error(`Failed to initialize TTS provider: ${error.message}`);
      throw error;
    }
  }
  return ttsProvider;
}

// ============================================================================
// Public API - Re-export with provider injected
// ============================================================================

/**
 * Generate audio for a single AudioItem and update it in the database
 */
export async function generateAudioForItem(
  audioItemId: string,
  taskId: string,
  overwrite: boolean = false
) {
  return generateAudioForItemDB(getProvider(), audioItemId, taskId, overwrite);
}

/**
 * Generate audio for all AudioItems in a task
 */
export async function generateAudioForTask(
  taskId: string,
  overwrite: boolean = false
) {
  return generateAudioForTaskDB(getProvider(), taskId, overwrite);
}

/**
 * Generate audio for all audio items with missing S3 audio
 */
export async function generateMissingAudio(
  taskId?: string
) {
  return generateMissingAudioDB(getProvider(), taskId);
}
