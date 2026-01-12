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

let ttsProvider: TTSService;
let providerName: string;

function initializeTTSProvider(): void {
  try {
    ttsProvider = getTTSProvider();
    providerName = getProviderName();
    console.log(`TTS Provider initialized: ${providerName}`);
  } catch (error: any) {
    console.error(`Failed to initialize TTS provider: ${error.message}`);
    throw error;
  }
}

function getProviderName(): string {
  const provider = (process.env.TTS_PROVIDER || '').toLowerCase().trim();
  const hasServiceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS !== undefined;
  
  if (provider === 'gcp' || provider === 'google-cloud' || (hasServiceAccount && provider !== 'gemini')) {
    return 'Google Cloud TTS';
  }
  return 'Gemini TTS';
}

// Initialize on module load
initializeTTSProvider();

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
  return generateAudioForItemDB(ttsProvider, audioItemId, taskId, overwrite);
}

/**
 * Generate audio for all AudioItems in a task
 */
export async function generateAudioForTask(
  taskId: string,
  overwrite: boolean = false
) {
  return generateAudioForTaskDB(ttsProvider, taskId, overwrite);
}

/**
 * Generate audio for all audio items with missing S3 audio
 */
export async function generateMissingAudio(
  taskId?: string
) {
  return generateMissingAudioDB(ttsProvider, taskId);
}
