// Sample audio sources for testing
// Using publicly available sample audio files

export const sampleAudioSources = {
  // Short beep sound
  shortBeep: 'https://www.soundjay.com/buttons/beep-01a.wav',
  
  // Placeholder for local audio
  localSample: '/instructions_eo.wav',
  
  // Sample French audio (TTS generated placeholder URL)
  frenchSample: '/audio/sample-french.mp3',
};

export const listeningExamAudio = {
  instructions: '/instructions_eo.wav',
  section1: '/audio/listening-section-1.mp3',
  section2: '/audio/listening-section-2.mp3',
};

// Mock audio blob for testing
export function createMockAudioBlob(): Blob {
  // Create a minimal valid WAV file header
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  
  // RIFF header
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36, true); // File size - 8
  view.setUint32(8, 0x57415645, false); // "WAVE"
  
  // fmt subchunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, 1, true); // NumChannels
  view.setUint32(24, 44100, true); // SampleRate
  view.setUint32(28, 88200, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  
  // data subchunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, 0, true); // Subchunk2Size
  
  return new Blob([header], { type: 'audio/wav' });
}
