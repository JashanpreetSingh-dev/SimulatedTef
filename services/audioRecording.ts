/**
 * Audio Recording Utilities
 * Functions to process and convert audio chunks to WAV format for storage
 */

/**
 * Combines multiple audio chunks into a single Float32Array
 */
export function combineAudioChunks(chunks: Float32Array[], sampleRate: number): Float32Array {
  if (chunks.length === 0) {
    return new Float32Array(0);
  }
  
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const combined = new Float32Array(totalLength);
  
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  
  return combined;
}

/**
 * Resamples audio from one sample rate to another using linear interpolation
 */
function resampleAudio(audioData: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) {
    return audioData;
  }
  
  const ratio = fromRate / toRate;
  const newLength = Math.round(audioData.length / ratio);
  const resampled = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, audioData.length - 1);
    const fraction = srcIndex - srcIndexFloor;
    
    resampled[i] = audioData[srcIndexFloor] * (1 - fraction) + audioData[srcIndexCeil] * fraction;
  }
  
  return resampled;
}

/**
 * Pads audio array with zeros to match target length
 */
function padAudio(audioData: Float32Array, targetLength: number): Float32Array {
  if (audioData.length >= targetLength) {
    return audioData.slice(0, targetLength);
  }
  const padded = new Float32Array(targetLength);
  padded.set(audioData, 0);
  return padded;
}

/**
 * Converts Float32Array audio data to WAV format Blob (mono)
 */
export function convertToWAV(audioData: Float32Array, sampleRate: number): Blob {
  const length = audioData.length;
  const buffer = new ArrayBuffer(44 + length * 2); // WAV header (44 bytes) + PCM data
  const view = new DataView(buffer);
  
  // Convert Float32Array to Int16Array (16-bit PCM)
  const int16Array = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, audioData[i])); // Clamp to [-1, 1]
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true); // File size - 8
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, 1, true); // NumChannels (mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, length * 2, true); // Subchunk2Size
  
  // Write PCM data
  const pcmData = new Int16Array(buffer, 44);
  pcmData.set(int16Array);
  
  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Converts two Float32Arrays (left and right channels) to stereo WAV format Blob
 */
export function convertToStereoWAV(
  leftChannel: Float32Array,
  rightChannel: Float32Array,
  sampleRate: number
): Blob {
  // Pad shorter channel with zeros to match length
  const length = Math.max(leftChannel.length, rightChannel.length);
  const paddedLeft = padAudio(leftChannel, length);
  const paddedRight = padAudio(rightChannel, length);
  
  // Convert to Int16Array (16-bit PCM)
  const leftInt16 = new Int16Array(length);
  const rightInt16 = new Int16Array(length);
  
  for (let i = 0; i < length; i++) {
    const leftS = Math.max(-1, Math.min(1, paddedLeft[i]));
    const rightS = Math.max(-1, Math.min(1, paddedRight[i]));
    leftInt16[i] = leftS < 0 ? leftS * 0x8000 : leftS * 0x7FFF;
    rightInt16[i] = rightS < 0 ? rightS * 0x8000 : rightS * 0x7FFF;
  }
  
  // Create stereo interleaved PCM data: [L, R, L, R, ...]
  const interleaved = new Int16Array(length * 2);
  for (let i = 0; i < length; i++) {
    interleaved[i * 2] = leftInt16[i];     // Left channel
    interleaved[i * 2 + 1] = rightInt16[i]; // Right channel
  }
  
  // WAV header for stereo
  const buffer = new ArrayBuffer(44 + interleaved.length * 2);
  const view = new DataView(buffer);
  
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + interleaved.length * 2, true); // File size - 8
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, 2, true); // NumChannels (stereo)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 4, true); // ByteRate (sampleRate * numChannels * bytesPerSample)
  view.setUint16(32, 4, true); // BlockAlign (numChannels * bytesPerSample)
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, interleaved.length * 2, true); // Subchunk2Size
  
  // Write interleaved PCM data
  const pcmData = new Int16Array(buffer, 44);
  pcmData.set(interleaved);
  
  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Merges user and model audio tracks into a single sequential mono WAV file
 * User audio first, then examiner audio
 * This creates a sequential recording: candidate speaks, then examiner responds
 * Note: Without timestamps, we cannot preserve exact conversation order,
 * but this ensures both voices are included in the recording
 */
export function mergeAudioTracks(
  userAudio: Float32Array,
  modelAudio: Float32Array,
  userSampleRate: number,
  modelSampleRate: number
): Blob {
  // Resample model audio to match user audio sample rate
  const resampledModelAudio = resampleAudio(modelAudio, modelSampleRate, userSampleRate);
  
  // Concatenate sequentially: user audio first, then examiner audio
  // This ensures both voices are included, played one after the other
  const totalLength = userAudio.length + resampledModelAudio.length;
  const merged = new Float32Array(totalLength);
  
  merged.set(userAudio, 0);
  merged.set(resampledModelAudio, userAudio.length);
  
  // Convert merged audio to mono WAV
  return convertToWAV(merged, userSampleRate);
}

