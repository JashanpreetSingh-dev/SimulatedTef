/**
 * Dialogue Parsing and Voice Assignment
 */

import { DialogueSegment, DIALOGUE_VOICES } from './types';

/**
 * Parse audio script to identify speakers and their dialogue segments
 * Handles scripts with or without line breaks
 * @returns Array of dialogue segments if dialogue detected, null if single speaker
 */
export function parseDialogueScript(audioScript: string): DialogueSegment[] | null {
  if (!audioScript || !audioScript.trim()) return null;

  const dialogue: DialogueSegment[] = [];
  const speakers = new Set<string>();
  
  // Pattern to match speaker: text (handles various formats)
  // Matches speaker names followed by colon (e.g., "Employé:", "Client:", "Agent:")
  const speakerPattern = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]*?):\s*/g;
  
  // First, try to split by line breaks if they exist
  const lines = audioScript.split('\n').filter(line => line.trim());
  
  // Check if script has line breaks
  if (lines.length > 1) {
    // Parse line by line, but also check for speaker labels within lines
    const lineSpeakerPattern = /^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]*?):\s*(.*)$/;
    const embeddedSpeakerPattern = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]*?):\s*/g;
    
    for (const line of lines) {
      const match = line.match(lineSpeakerPattern);
      if (match) {
        // Line starts with speaker label
        const speaker = match[1].trim();
        let text = match[2].trim();
        
        // Check if this line contains additional speaker labels (e.g., "textClient: more text")
        const embeddedMatches: Array<{ index: number; speaker: string; fullMatch: string }> = [];
        let embeddedMatch;
        embeddedSpeakerPattern.lastIndex = 0; // Reset regex
        while ((embeddedMatch = embeddedSpeakerPattern.exec(text)) !== null) {
          // Only consider it a speaker if it's capitalized and reasonable length
          const label = embeddedMatch[1].trim();
          if (label.length >= 2 && label.length <= 20 && (label[0] === label[0].toUpperCase())) {
            embeddedMatches.push({
              index: embeddedMatch.index,
              speaker: label,
              fullMatch: embeddedMatch[0]
            });
          }
        }
        
        if (embeddedMatches.length > 0) {
          // Split the text at embedded speaker labels
          let currentText = text.substring(0, embeddedMatches[0].index).trim();
          if (currentText) {
            dialogue.push({ speaker, text: currentText });
            speakers.add(speaker);
          }
          
          // Process embedded speakers
          for (let i = 0; i < embeddedMatches.length; i++) {
            const embeddedMatch = embeddedMatches[i];
            const nextMatch = embeddedMatches[i + 1];
            const textStart = embeddedMatch.index + embeddedMatch.fullMatch.length;
            const textEnd = nextMatch ? nextMatch.index : text.length;
            const embeddedText = text.substring(textStart, textEnd).trim();
            
            if (embeddedText) {
              dialogue.push({
                speaker: embeddedMatch.speaker,
                text: embeddedText
              });
              speakers.add(embeddedMatch.speaker);
            }
          }
        } else {
          // No embedded speakers, just clean and add
          text = cleanText(text);
          // Final cleanup: remove any remaining speaker labels
          text = text.replace(/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]*?:\s*/, '').trim();
          if (text) {
            dialogue.push({ speaker, text });
            speakers.add(speaker);
          }
        }
      } else {
        // Line doesn't start with speaker label - check for embedded speakers
        const embeddedMatches: Array<{ index: number; speaker: string; fullMatch: string }> = [];
        let embeddedMatch;
        embeddedSpeakerPattern.lastIndex = 0;
        while ((embeddedMatch = embeddedSpeakerPattern.exec(line)) !== null) {
          const label = embeddedMatch[1].trim();
          if (label.length >= 2 && label.length <= 20 && (label[0] === label[0].toUpperCase())) {
            embeddedMatches.push({
              index: embeddedMatch.index,
              speaker: label,
              fullMatch: embeddedMatch[0]
            });
          }
        }
        
        if (embeddedMatches.length > 0) {
          // Split at embedded speaker labels
          let lastIndex = 0;
          for (const embeddedMatch of embeddedMatches) {
            // Text before this speaker
            if (embeddedMatch.index > lastIndex) {
              const beforeText = line.substring(lastIndex, embeddedMatch.index).trim();
              if (beforeText && dialogue.length > 0) {
                dialogue[dialogue.length - 1].text += ' ' + beforeText;
              }
            }
            
            // Text after this speaker
            const textStart = embeddedMatch.index + embeddedMatch.fullMatch.length;
            const nextMatch = embeddedMatches.find(m => m.index > embeddedMatch.index);
            const textEnd = nextMatch ? nextMatch.index : line.length;
            const afterText = line.substring(textStart, textEnd).trim();
            
            if (afterText) {
              dialogue.push({
                speaker: embeddedMatch.speaker,
                text: afterText
              });
              speakers.add(embeddedMatch.speaker);
            }
            
            lastIndex = textEnd;
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
    }
  } else {
    // No line breaks - parse the entire string
    const speakerMatches: Array<{ index: number; speaker: string; fullMatch: string }> = [];
    let match;
    
    // Find all speaker indicators
    while ((match = speakerPattern.exec(audioScript)) !== null) {
      speakerMatches.push({
        index: match.index,
        speaker: match[1].trim(),
        fullMatch: match[0]
      });
    }
    
    // If no speaker matches found, return null (single speaker)
    if (speakerMatches.length === 0) {
      return null;
    }
    
    // Extract text segments between speakers
    for (let i = 0; i < speakerMatches.length; i++) {
      const currentMatch = speakerMatches[i];
      const nextMatch = speakerMatches[i + 1];
      
      // Get text after the speaker name (after the colon and any whitespace)
      const textStart = currentMatch.index + currentMatch.fullMatch.length;
      const textEnd = nextMatch ? nextMatch.index : audioScript.length;
      let text = audioScript.substring(textStart, textEnd).trim();
      
      // Remove any speaker labels that might be embedded in the text
      // This handles cases like "textClient: more text" where "Client:" is part of the text
      // We need to be careful - only remove speaker labels that appear to be actual speaker indicators
      // Pattern: word(s) followed by colon, but not if it's part of a sentence (like "heure:")
      // More aggressive: remove any "Word: " pattern that looks like a speaker label
      text = text.replace(/\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]{1,30}?):\s*/g, (match, label) => {
        // Only remove if it looks like a speaker label (not a common word followed by colon in French)
        // Common words that might have colons: "heure", "minute", etc. - but these are usually lowercase
        // Speaker labels are usually capitalized or proper nouns
        if (label.length < 2 || label.length > 20) return match; // Too short or too long to be a speaker
        // If it's all caps or starts with capital, likely a speaker label
        if (label === label.toUpperCase() || (label[0] === label[0].toUpperCase() && label.length > 2)) {
          return ' '; // Replace with space
        }
        return match; // Keep it (might be part of the text)
      }).trim();
      
      // Clean any remaining speaker indicators at the start
      text = cleanText(text);
      
      if (text) {
        dialogue.push({
          speaker: currentMatch.speaker,
          text: text
        });
        speakers.add(currentMatch.speaker);
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
