/**
 * Contract for accepting a Live-built oral transcript without sending audio to the worker.
 * When satisfied, the client omits audioBlob from the evaluation job (smaller queue payload;
 * worker skips the transcribe Gemini call).
 */

export const ORAL_EVAL_MIN_CHARS_PART = 50;
export const ORAL_EVAL_MIN_CHARS_FULL = 100;
/** At least this many "User:" turns for full exam transcript (EO1 + EO2 engagement). */
export const ORAL_EVAL_MIN_USER_TURNS_FULL = 2;

/**
 * Append one diarized line to a ref-backed transcript string.
 */
export function appendDiarizedTurn(
  ref: { current: string },
  role: 'User' | 'Examiner',
  text: string
): void {
  const t = text.trim().replace(/\s+/g, ' ');
  if (!t) return;
  if (!ref.current) {
    ref.current = `${role}: ${t}`;
  } else {
    ref.current += `\n${role}: ${t}`;
  }
}

/**
 * Count substantive "User:" lines (candidate speech).
 */
export function countUserTurns(transcript: string): number {
  const lines = transcript.split('\n');
  let n = 0;
  for (const line of lines) {
    if (/^\s*User:\s*\S/.test(line)) n += 1;
  }
  return n;
}

/**
 * Strip Examiner lines for heuristics that should reflect the candidate only (e.g. question count).
 */
export function transcriptUserLinesOnly(transcript: string): string {
  return transcript
    .split('\n')
    .filter((l) => /^\s*User:/i.test(l))
    .join('\n');
}

/**
 * True if the Live-assembled transcript is good enough to evaluate without worker audio transcription.
 */
export function oralTranscriptPassesContract(
  transcript: string,
  mode: 'partA' | 'partB' | 'full'
): boolean {
  const t = transcript.trim();
  if (!t) return false;

  const hasDiarizedUser = /^\s*User:\s*\S/m.test(t);
  const userTurns = countUserTurns(t);

  if (mode === 'full') {
    if (t.length < ORAL_EVAL_MIN_CHARS_FULL) return false;
    if (hasDiarizedUser) {
      return userTurns >= ORAL_EVAL_MIN_USER_TURNS_FULL;
    }
    return t.length >= ORAL_EVAL_MIN_CHARS_FULL * 2;
  }

  if (t.length < ORAL_EVAL_MIN_CHARS_PART) return false;
  if (hasDiarizedUser) return true;
  return t.length >= ORAL_EVAL_MIN_CHARS_PART * 2;
}
