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
    
    // Clean the text - remove any speaker labels that might still be present
    // The text should already be clean from parsing, but double-check
    let cleanedText = segment.text.trim();
    
    // Remove any speaker labels at the start (e.g., "Speaker: text" -> "text")
    cleanedText = cleanText(cleanedText);
    
    // Remove any embedded speaker labels (e.g., "textClient: more" -> "text more")
    // This handles cases where speaker labels weren't properly removed during parsing
    // Be more aggressive - remove any "Word: " pattern that looks like a speaker label
    cleanedText = cleanedText.replace(/\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]{1,25}?):\s*/g, (match, label) => {
      const trimmedLabel = label.trim();
      // Remove if it looks like a speaker label:
      // - Starts with capital letter
      // - Reasonable length (2-25 chars)
      // - Not a common French word that might have a colon (like "heure", "minute")
      const commonWords = ['heure', 'minute', 'seconde', 'jour', 'mois', 'année', 'fois'];
      if (trimmedLabel.length >= 2 && 
          trimmedLabel.length <= 25 && 
          trimmedLabel[0] === trimmedLabel[0].toUpperCase() &&
          !commonWords.includes(trimmedLabel.toLowerCase())) {
        return ' '; // Replace with space
      }
      return match; // Keep it (might be part of the text)
    }).trim();
    
    // Final cleanup: remove any remaining "Speaker:" patterns
    cleanedText = cleanedText.replace(/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]*?:\s*/, '').trim();

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
 * Cleans speaker labels from script if present
 */
export async function generateMonologueAudio(
  ttsProvider: TTSService,
  audioScript: string,
  defaultVoiceName: string,
  sectionId?: number
): Promise<Buffer> {
  // Clean speaker labels from script (e.g., "Agent:", "Voix feminin:") if present
  // This handles cases where AI includes speaker labels but it's actually a single speaker
  let cleanedScript = audioScript;
  
  // Remove speaker labels (pattern: "Speaker: text" -> "text")
  const speakerPattern = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]*?):\s*/g;
  const hasSpeakerLabels = speakerPattern.test(audioScript);
  
  if (hasSpeakerLabels) {
    // Reset regex
    speakerPattern.lastIndex = 0;
    
    // Extract only the text parts, removing speaker labels
    const parts: string[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = speakerPattern.exec(audioScript)) !== null) {
      // Add text before this speaker label (if any)
      if (match.index > lastIndex) {
        const beforeText = audioScript.substring(lastIndex, match.index).trim();
        if (beforeText) parts.push(beforeText);
      }
      
      // Get text after this speaker label
      const textStart = match.index + match[0].length;
      const nextMatch = speakerPattern.exec(audioScript);
      const textEnd = nextMatch ? nextMatch.index : audioScript.length;
      speakerPattern.lastIndex = nextMatch ? nextMatch.index : audioScript.length;
      
      const text = audioScript.substring(textStart, textEnd).trim();
      if (text) parts.push(text);
      
      lastIndex = textEnd;
      
      // If we found a match, reset to continue from where we left off
      if (!nextMatch) break;
    }
    
    // If we extracted parts, join them; otherwise use original
    if (parts.length > 0) {
      cleanedScript = parts.join(' ').trim();
    } else {
      // Fallback: remove all speaker labels using replace
      cleanedScript = audioScript.replace(speakerPattern, '').trim();
    }
  }
  
  if (sectionId === 4) {
    logMonologueWarning(cleanedScript, defaultVoiceName);
  }
  return generateSingleVoiceAudio(ttsProvider, cleanedScript, defaultVoiceName);
}

/**
 * Generate audio from a script, automatically handling multi-voice dialogues
 * This is used by both mock exams and practice assignments
 */
/**
 * Generate audio from a script, automatically handling multi-voice dialogues
 * This is used by both mock exams and practice assignments
 * 
 * IMPORTANT: This function normalizes the script internally. The caller should
 * also normalize before storing to ensure the stored script matches the audio.
 */
export async function generateAudioFromScript(
  ttsProvider: TTSService,
  audioScript: string,
  defaultVoiceName: string = DEFAULT_VOICE,
  sectionId?: number
): Promise<Buffer> {
  // Normalize script format first to ensure consistency
  // This handles any inconsistencies in the input script
  const { normalizeScriptFormat } = await import('./scriptNormalizer');
  const normalizedScript = normalizeScriptFormat(audioScript, sectionId);
  
  const dialogue = parseDialogueScript(normalizedScript);
  const isDialogue = dialogue !== null && dialogue.length > 0;
  const isDialogueSection = sectionId !== undefined && DIALOGUE_SECTIONS.includes(sectionId as any);
  
  // Check if dialogue has multiple unique speakers (for practice mode)
  const hasMultipleSpeakers = isDialogue && new Set(dialogue!.map(d => d.speaker)).size > 1;

  logScriptInfo(normalizedScript, isDialogue, dialogue, sectionId);

  // Use multiple voices if:
  // 1. Mock exam: dialogue in Sections 2, 3, 4 (standard TEF format)
  // 2. Practice mode: dialogue with multiple speakers (regardless of section_id)
  //    This handles practice assignments where all sections are set to 1
  if (isDialogue && (isDialogueSection || hasMultipleSpeakers)) {
    return generateDialogueAudio(ttsProvider, dialogue!, sectionId);
  }

  // Single speaker (monologue)
  return generateMonologueAudio(ttsProvider, normalizedScript, defaultVoiceName, sectionId);
}

function shouldAddPause(currentIndex: number, dialogue: DialogueSegment[]): boolean {
  const hasNextSegment = currentIndex < dialogue.length - 1;
  if (!hasNextSegment) return false;
  
  const currentSpeaker = dialogue[currentIndex].speaker;
  const nextSpeaker = dialogue[currentIndex + 1].speaker;
  return currentSpeaker !== nextSpeaker;
}
