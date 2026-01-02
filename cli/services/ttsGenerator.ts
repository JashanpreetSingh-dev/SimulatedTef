/**
 * TTS Generator Service - Generates natural French audio from scripts using Google Gemini TTS API
 */

import { GoogleGenAI, Modality } from "@google/genai";
import { pcmToWav } from "../../utils/audio";
import { getDB } from "../utils/db";

// Get API key
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is missing!');
  console.error('Please set GEMINI_API_KEY in your environment variables.');
}

const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

/**
 * Parse audio script to identify speakers and their dialogue segments
 * @returns Array of { speaker: string, text: string } if dialogue detected, null if single speaker
 */
function parseDialogueScript(audioScript: string): Array<{ speaker: string; text: string }> | null {
  const lines = audioScript.split('\n').filter(line => line.trim());
  if (lines.length === 0) return null;
  
  const dialogue: Array<{ speaker: string; text: string }> = [];
  const speakers = new Set<string>();
  const speakerPattern = /^([^:]+):\s*(.+)$/;
  
  for (const line of lines) {
    const match = line.match(speakerPattern);
    if (match) {
      const speaker = match[1].trim();
      const text = match[2].trim();
      dialogue.push({ speaker, text });
      speakers.add(speaker);
    } else {
      // Continuation of previous speaker's line
      if (dialogue.length > 0) {
        dialogue[dialogue.length - 1].text += ' ' + line.trim();
      } else {
        // No speaker indicators found - single speaker monologue
        return null;
      }
    }
  }
  
  // Only return dialogue if multiple distinct speakers found
  return speakers.size > 1 ? dialogue : null;
}

/**
 * Concatenate multiple WAV buffers into one
 * Extracts PCM data from each WAV (skipping 44-byte header) and combines them
 */
function concatenateWavBuffers(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) {
    throw new Error('Cannot concatenate empty buffer array');
  }
  if (buffers.length === 1) {
    return buffers[0];
  }
  
  const pcmData: Buffer[] = [];
  
  for (const wavBuffer of buffers) {
    if (wavBuffer.length < 44) {
      throw new Error('Invalid WAV file: too short');
    }
    // Extract PCM data (skip 44-byte WAV header)
    const pcm = wavBuffer.slice(44);
    pcmData.push(pcm);
  }
  
  // Concatenate all PCM data and create new WAV
  const combinedPcm = Buffer.concat(pcmData);
  return pcmToWav(combinedPcm, 24000, 1);
}

/**
 * Generate audio for a single voice/text segment
 */
async function generateSingleVoiceAudio(
  text: string,
  voiceName: string
): Promise<Buffer> {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Veuillez lire ce texte : ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
      },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) {
      throw new Error('No audio data returned from API');
    }

    const pcmBuffer = Buffer.from(audioBase64, 'base64');
    return pcmToWav(pcmBuffer, 24000, 1);
  } catch (error: any) {
    console.error(`❌ Error generating audio:`, error.message);
    throw error;
  }
}

/**
 * Generate audio from a script, automatically handling multi-voice dialogues
 */
async function generateAudioFromScript(
  audioScript: string,
  defaultVoiceName: string = 'Kore',
  sectionId?: number
): Promise<Buffer> {
  const dialogue = parseDialogueScript(audioScript);
  const isDialogue = dialogue !== null && dialogue.length > 0;
  
  // For dialogues in Sections 2, 3, 4, use multiple voices
  if (isDialogue && (sectionId === 2 || sectionId === 3 || sectionId === 4)) {
    // Use distinct voices for different speakers
    // Available Gemini TTS voices: Kore (neutral), Charon (male), Aoede (female)
    const voices = ['Charon', 'Aoede', 'Kore']; // Reordered for better distinction
    const audioSegments: Buffer[] = [];
    const uniqueSpeakers = Array.from(new Set(dialogue!.map(d => d.speaker)));
    
    // Create a speaker-to-voice mapping to ensure consistency
    const speakerToVoiceMap = new Map<string, string>();
    uniqueSpeakers.forEach((speaker, index) => {
      speakerToVoiceMap.set(speaker, voices[index % voices.length]);
    });
    
    console.log(`   🎭 Detected dialogue with ${dialogue!.length} segments (${uniqueSpeakers.length} unique speakers)`);
    console.log(`   🎤 Speaker-to-voice mapping:`);
    uniqueSpeakers.forEach((speaker) => {
      console.log(`      "${speaker}" → ${speakerToVoiceMap.get(speaker)}`);
    });
    
    for (let i = 0; i < dialogue!.length; i++) {
      const segment = dialogue![i];
      const voice = speakerToVoiceMap.get(segment.speaker) || voices[0]; // Fallback to first voice
      
      console.log(`   🎤 Generating segment ${i + 1}/${dialogue!.length} (${segment.speaker}) with voice ${voice}...`);
      
      const segmentAudio = await generateSingleVoiceAudio(segment.text, voice);
      audioSegments.push(segmentAudio);
      
      // Add pause between different speakers (0.3 seconds)
      if (i < dialogue!.length - 1 && dialogue![i + 1].speaker !== segment.speaker) {
        const silenceSamples = Math.floor(24000 * 0.3);
        const silencePcm = Buffer.alloc(silenceSamples * 2, 0);
        const silenceWav = pcmToWav(silencePcm, 24000, 1);
        audioSegments.push(silenceWav);
      }
    }
    
    return concatenateWavBuffers(audioSegments);
  } else {
    // Single speaker (monologue) - use default voice
    return generateSingleVoiceAudio(audioScript, defaultVoiceName);
  }
}

/**
 * Generate audio for a single AudioItem and update it in the database
 * @param audioItemId - The audioId of the AudioItem to generate audio for
 * @param overwrite - Whether to overwrite existing audio (default: false)
 * @returns Buffer containing the generated audio data, or null if skipped
 */
export async function generateAudioForItem(
  audioItemId: string,
  taskId: string,
  overwrite: boolean = false
): Promise<Buffer | null> {
  const db = await getDB();
  const audioItemsCollection = db.collection('audioItems');

  // Find the audio item
  const audioItem = await audioItemsCollection.findOne({ audioId: audioItemId, taskId });
  
  if (!audioItem) {
    throw new Error(`AudioItem ${audioItemId} not found for task ${taskId}`);
  }

  // Check if audio already exists
  if (audioItem.audioData && !overwrite) {
    console.log(`   ⏭️  Skipping ${audioItemId} (audio already exists, use --overwrite to regenerate)`);
    return null;
  }

  if (!audioItem.audioScript) {
    throw new Error(`AudioItem ${audioItemId} has no audioScript to generate from`);
  }

  console.log(`   🎤 Generating audio for ${audioItemId}...`);
  
  // Pass sectionId to enable multi-voice for dialogues
  const audioBuffer = await generateAudioFromScript(
    audioItem.audioScript, 
    'Kore', 
    audioItem.sectionId  // Enable multi-voice for Sections 2, 3, 4
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

  console.log(`   ✅ Generated audio for ${audioItemId} (${(audioBuffer.length / 1024).toFixed(2)} KB)`);
  
  return audioBuffer;
}

/**
 * Generate audio for all AudioItems in a task
 * @param taskId - The taskId to generate audio for
 * @param overwrite - Whether to overwrite existing audio (default: false)
 * @returns Statistics about the generation process
 */
export async function generateAudioForTask(
  taskId: string,
  overwrite: boolean = false
): Promise<{
  total: number;
  generated: number;
  skipped: number;
  failed: number;
}> {
  const db = await getDB();
  const audioItemsCollection = db.collection('audioItems');

  // Find all audio items for this task
  const audioItems = await audioItemsCollection
    .find({ taskId })
    .sort({ sectionId: 1, audioId: 1 })
    .toArray();

  if (audioItems.length === 0) {
    throw new Error(`No AudioItems found for task ${taskId}`);
  }

  console.log(`\n🎵 Generating audio for ${audioItems.length} audio items...`);
  console.log(`   Task: ${taskId}`);
  console.log(`   Overwrite: ${overwrite ? 'Yes' : 'No (skipping existing audio)'}`);
  console.log('');

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  // Process each audio item sequentially
  for (let i = 0; i < audioItems.length; i++) {
    const item = audioItems[i];
    const progress = `[${i + 1}/${audioItems.length}]`;
    
    try {
      const result = await generateAudioForItem(item.audioId, taskId, overwrite);
      if (result) {
        generated++;
      } else {
        skipped++;
      }
    } catch (error: any) {
      console.error(`   ❌ Failed to generate audio for ${item.audioId}:`, error.message);
      failed++;
    }
  }

  console.log(`\n✅ Audio generation complete:`);
  console.log(`   Generated: ${generated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${audioItems.length}`);

  return {
    total: audioItems.length,
    generated,
    skipped,
    failed
  };
}
