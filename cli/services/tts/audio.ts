/**
 * Audio Processing Utilities
 */

import { pcmToWav } from "../../../utils/audio";
import { SAMPLE_RATE, CHANNELS, WAV_HEADER_SIZE } from './types';

/**
 * Concatenate multiple WAV buffers into one
 * Extracts PCM data from each WAV (skipping header) and combines them
 */
export function concatenateWavBuffers(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) {
    throw new Error('Cannot concatenate empty buffer array');
  }
  if (buffers.length === 1) {
    return buffers[0];
  }

  const pcmData: Buffer[] = [];

  for (const wavBuffer of buffers) {
    if (wavBuffer.length < WAV_HEADER_SIZE) {
      throw new Error('Invalid WAV file: too short');
    }
    // Extract PCM data (skip WAV header)
    const pcm = wavBuffer.slice(WAV_HEADER_SIZE);
    pcmData.push(pcm);
  }

  // Concatenate all PCM data and create new WAV
  const combinedPcm = Buffer.concat(pcmData);
  return pcmToWav(combinedPcm, SAMPLE_RATE, CHANNELS);
}

/**
 * Create silence buffer for pauses between speakers
 */
export function createSilenceBuffer(durationSeconds: number): Buffer {
  const silenceSamples = Math.floor(SAMPLE_RATE * durationSeconds);
  const silencePcm = Buffer.alloc(silenceSamples * 2, 0);
  return pcmToWav(silencePcm, SAMPLE_RATE, CHANNELS);
}
