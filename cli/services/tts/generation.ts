/**
 * Core Audio Generation Logic
 */

import { TTSService } from "../ttsProviders";
import { 
  DialogueSegment, 
  DEFAULT_VOICE, 
  DIALOGUE_SECTIONS, 
  DIALOGUE_VOICES,
  PAUSE_DURATION_SECONDS 
} from './types';
import { parseDialogueScript, createSpeakerToVoiceMap, cleanText } from './dialogue';
import { concatenateWavBuffers, createSilenceBuffer } from './audio';
import {
  logScriptInfo,
  logDialogueInfo,
  logSegmentGeneration,
  logConcatenation,
  logMonologueWarning
} from './logger';

/**
 * Generate audio for a single voice/text segment
 */
export async function generateSingleVoiceAudio(
  ttsProvider: TTSService,
  text: string,
  voiceName: string
): Promise<Buffer> {
  try {
    return await ttsProvider.generateAudio(text, voiceName);
  } catch (error: any) {
    console.error(`Error generating audio:`, error.message);
    throw error;
  }
}

/**
 * Generate audio for a dialogue with multiple speakers
 */
export async function generateDialogueAudio(
  ttsProvider: TTSService,
  dialogue: DialogueSegment[],
  sectionId?: number
): Promise<Buffer> {
  const uniqueSpeakers = Array.from(new Set(dialogue.map(d => d.speaker)));
  const speakerToVoiceMap = createSpeakerToVoiceMap(uniqueSpeakers);
  const audioSegments: Buffer[] = [];

  logDialogueInfo(dialogue, uniqueSpeakers, speakerToVoiceMap);

  for (let i = 0; i < dialogue.length; i++) {
    const segment = dialogue[i];
    const voice = speakerToVoiceMap.get(segment.speaker) || DIALOGUE_VOICES[0];
    const cleanedText = cleanText(segment.text);

    logSegmentGeneration(i + 1, dialogue.length, segment.speaker, voice, cleanedText);

    // Generate audio for this segment
    const segmentAudio = await generateSingleVoiceAudio(ttsProvider, cleanedText, voice);
    audioSegments.push(segmentAudio);

    // Add pause between different speakers
    if (shouldAddPause(i, dialogue)) {
      const silenceWav = createSilenceBuffer(PAUSE_DURATION_SECONDS);
      audioSegments.push(silenceWav);
      console.log(`   Added ${PAUSE_DURATION_SECONDS}s pause between speakers`);
    }
  }

  logConcatenation(audioSegments.length, dialogue.length);
  return concatenateWavBuffers(audioSegments);
}

/**
 * Generate audio for a monologue (single speaker)
 */
export async function generateMonologueAudio(
  ttsProvider: TTSService,
  audioScript: string,
  defaultVoiceName: string,
  sectionId?: number
): Promise<Buffer> {
  if (sectionId === 4) {
    logMonologueWarning(audioScript, defaultVoiceName);
  }
  return generateSingleVoiceAudio(ttsProvider, audioScript, defaultVoiceName);
}

/**
 * Generate audio from a script, automatically handling multi-voice dialogues
 */
export async function generateAudioFromScript(
  ttsProvider: TTSService,
  audioScript: string,
  defaultVoiceName: string = DEFAULT_VOICE,
  sectionId?: number
): Promise<Buffer> {
  const dialogue = parseDialogueScript(audioScript);
  const isDialogue = dialogue !== null && dialogue.length > 0;
  const isDialogueSection = sectionId !== undefined && DIALOGUE_SECTIONS.includes(sectionId as any);

  logScriptInfo(audioScript, isDialogue, dialogue, sectionId);

  // For dialogues in Sections 2, 3, 4, use multiple voices
  if (isDialogue && isDialogueSection) {
    return generateDialogueAudio(ttsProvider, dialogue!, sectionId);
  }

  // Single speaker (monologue)
  return generateMonologueAudio(ttsProvider, audioScript, defaultVoiceName, sectionId);
}

function shouldAddPause(currentIndex: number, dialogue: DialogueSegment[]): boolean {
  const hasNextSegment = currentIndex < dialogue.length - 1;
  if (!hasNextSegment) return false;
  
  const currentSpeaker = dialogue[currentIndex].speaker;
  const nextSpeaker = dialogue[currentIndex + 1].speaker;
  return currentSpeaker !== nextSpeaker;
}
