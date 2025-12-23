/**
 * Audio utility functions for converting and processing audio formats
 */

/**
 * Convert raw PCM audio data to WAV format
 * @param pcmData - Raw PCM audio buffer
 * @param sampleRate - Sample rate in Hz (default: 24000)
 * @param channels - Number of audio channels (default: 1 for mono)
 * @returns WAV format buffer
 */
export function pcmToWav(pcmData: Buffer, sampleRate: number = 24000, channels: number = 1): Buffer {
  const dataLength = pcmData.length;
  const buffer = Buffer.alloc(44 + dataLength);
  
  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4); // File size - 8
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // Audio format (1 = PCM)
  buffer.writeUInt16LE(channels, 22); // Number of channels
  buffer.writeUInt32LE(sampleRate, 24); // Sample rate
  buffer.writeUInt32LE(sampleRate * channels * 2, 28); // Byte rate
  buffer.writeUInt16LE(channels * 2, 32); // Block align
  buffer.writeUInt16LE(16, 34); // Bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40); // Data size
  pcmData.copy(buffer, 44); // Copy PCM data
  
  return buffer;
}

