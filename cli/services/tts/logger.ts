/**
 * Logging Helpers for TTS Generation
 */

import { DialogueSegment, GenerationStats, MissingAudioStats } from './types';

export function logScriptInfo(
  audioScript: string,
  isDialogue: boolean,
  dialogue: DialogueSegment[] | null,
  sectionId?: number
): void {
  if (sectionId === 4) {
    console.log(`   Section 4 audio script preview (first 200 chars): ${audioScript.substring(0, 200)}...`);
    console.log(`   Dialogue detected: ${isDialogue ? 'Yes' : 'No'}`);
    if (isDialogue && dialogue) {
      const uniqueSpeakers = Array.from(new Set(dialogue.map(d => d.speaker)));
      console.log(`   Dialogue segments: ${dialogue.length}, Unique speakers: ${uniqueSpeakers.length}`);
    }
  }
}

export function logDialogueInfo(
  dialogue: DialogueSegment[],
  uniqueSpeakers: string[],
  speakerToVoiceMap: Map<string, string>
): void {
  console.log(`   Detected dialogue with ${dialogue.length} segments (${uniqueSpeakers.length} unique speakers)`);
  console.log(`   Speaker-to-voice mapping:`);
  uniqueSpeakers.forEach((speaker) => {
    console.log(`      "${speaker}" → ${speakerToVoiceMap.get(speaker)}`);
  });
}

export function logSegmentGeneration(
  segmentNumber: number,
  totalSegments: number,
  speaker: string,
  voice: string,
  textPreview: string
): void {
  console.log(`   Generating segment ${segmentNumber}/${totalSegments} (${speaker}) with voice ${voice}...`);
  const preview = textPreview.length > 100 ? textPreview.substring(0, 100) + '...' : textPreview;
  console.log(`   Segment text preview: "${preview}"`);
}

export function logConcatenation(totalSegments: number, dialogueSegments: number): void {
  const pauseCount = totalSegments - dialogueSegments;
  console.log(`   Concatenating ${totalSegments} audio segments (${dialogueSegments} dialogue segments + ${pauseCount} pauses)...`);
}

export function logMonologueWarning(audioScript: string, defaultVoiceName: string): void {
  console.log(`   WARNING: Section 4 audio is NOT detected as dialogue - using single voice mode with voice: ${defaultVoiceName}`);
  console.log(`   Script preview (first 300 chars): ${audioScript.substring(0, 300)}...`);
  
  if (audioScript.includes(':')) {
    console.log(`   WARNING: Script contains ':' but wasn't detected as dialogue - might be formatting issue`);
  }
}

export function logTaskStart(count: number, taskId: string, overwrite: boolean): void {
  console.log(`\nGenerating audio for ${count} audio items...`);
  console.log(`   Task: ${taskId}`);
  console.log(`   Overwrite: ${overwrite ? 'Yes' : 'No (skipping existing audio)'}`);
  console.log('');
}

export function logTaskComplete(stats: GenerationStats, total: number): void {
  console.log(`\nAudio generation complete:`);
  console.log(`   Generated: ${stats.generated}`);
  console.log(`   Skipped: ${stats.skipped}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log(`   Total: ${total}`);
}

export function logMissingAudioStart(count: number, taskId: string | undefined, uniqueTaskIds: string[]): void {
  console.log(`\nGenerating missing audio for ${count} audio items...`);
  if (taskId) {
    console.log(`   Task: ${taskId}`);
  } else {
    console.log(`   Tasks: ${uniqueTaskIds.length} task(s) (${uniqueTaskIds.join(', ')})`);
  }
  console.log('');
}

export function logMissingAudioComplete(stats: MissingAudioStats, total: number): void {
  console.log(`\nMissing audio generation complete:`);
  console.log(`   Generated: ${stats.generated}`);
  console.log(`   Skipped: ${stats.skipped}`);
  console.log(`   Failed: ${stats.failed}`);
  console.log(`   Total: ${total}`);
  if (stats.tasksProcessed.length > 0) {
    console.log(`   Tasks processed: ${stats.tasksProcessed.length} (${stats.tasksProcessed.join(', ')})`);
  }
}
