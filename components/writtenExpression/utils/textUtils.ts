/**
 * Calculate word count from text
 */
export function getWordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

/**
 * Insert a character at the current cursor position in a textarea
 * Returns the new text and cursor position
 */
export function insertCharacterAtCursor(
  currentText: string,
  char: string,
  selectionStart: number,
  selectionEnd: number
): { newText: string; newCursorPosition: number } {
  const newText = currentText.substring(0, selectionStart) + char + currentText.substring(selectionEnd);
  const newCursorPosition = selectionStart + char.length;
  return { newText, newCursorPosition };
}
