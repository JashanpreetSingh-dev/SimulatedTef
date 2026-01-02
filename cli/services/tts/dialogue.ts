/**
 * Dialogue Parsing and Voice Assignment
 */

import { DialogueSegment, DIALOGUE_VOICES } from './types';

/**
 * Parse audio script to identify speakers and their dialogue segments
 * @returns Array of dialogue segments if dialogue detected, null if single speaker
 */
export function parseDialogueScript(audioScript: string): DialogueSegment[] | null {
  const lines = audioScript.split('\n').filter(line => line.trim());
  if (lines.length === 0) return null;

  const dialogue: DialogueSegment[] = [];
  const speakers = new Set<string>();
  const speakerPattern = /^([^:]+):\s*(.+)$/;

  for (const line of lines) {
    const match = line.match(speakerPattern);
    if (match) {
      const speaker = match[1].trim();
      let text = match[2].trim();
      // Remove any remaining speaker indicators
      text = cleanText(text);
      
      if (text) {
        dialogue.push({ speaker, text });
        speakers.add(speaker);
      }
    } else {
      // Continuation of previous speaker's line
      if (dialogue.length > 0) {
        const continuation = cleanText(line.trim());
        if (continuation) {
          dialogue[dialogue.length - 1].text += ' ' + continuation;
        }
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
 * Clean text by removing speaker indicators
 */
export function cleanText(text: string): string {
  return text.replace(/^[^:]+:\s*/, '').trim();
}

/**
 * Create a mapping of speakers to voices for dialogue
 */
export function createSpeakerToVoiceMap(speakers: string[]): Map<string, string> {
  const voiceMap = new Map<string, string>();
  
  speakers.forEach((speaker, index) => {
    // Alternate between voices for multiple speakers
    const voice = DIALOGUE_VOICES[index % DIALOGUE_VOICES.length];
    voiceMap.set(speaker, voice);
  });
  
  return voiceMap;
}
