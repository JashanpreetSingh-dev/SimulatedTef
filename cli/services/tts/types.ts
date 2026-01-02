/**
 * TTS Types and Constants
 */

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_VOICE = 'Kore';
export const DIALOGUE_SECTIONS = [2, 3, 4] as const;
export const DIALOGUE_VOICES = ['Charon', 'Aoede'] as const;
export const PAUSE_DURATION_SECONDS = 0.3;
export const SAMPLE_RATE = 24000;
export const CHANNELS = 1;
export const WAV_HEADER_SIZE = 44;

// ============================================================================
// Types
// ============================================================================

export interface DialogueSegment {
  speaker: string;
  text: string;
}

export interface GenerationStats {
  total: number;
  generated: number;
  skipped: number;
  failed: number;
}

export interface MissingAudioStats extends GenerationStats {
  tasksProcessed: string[];
}
