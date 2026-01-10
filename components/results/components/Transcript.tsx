import React, { useMemo } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface TranscriptProps {
  transcript: string;
}

interface TranscriptSegment {
  speaker: 'user' | 'examiner' | 'unknown';
  text: string;
}

export const Transcript: React.FC<TranscriptProps> = ({ transcript }) => {
  const { t } = useLanguage();

  // Parse diarized transcript into segments
  const segments = useMemo(() => {
    if (!transcript) return [];

    // Check if transcript contains diarized format (User: or Examiner:)
    const hasDiarization = /(?:^|\s)(User|Examiner):/i.test(transcript);

    if (!hasDiarization) {
      // Not diarized - return as single user segment
      return [{ speaker: 'unknown' as const, text: transcript }];
    }

    // Parse diarized transcript - handle both formats:
    // 1. Line-separated: "User: text\n\nExaminer: text"
    // 2. Inline: "textExaminer: textUser: text" (no line breaks, labels inline)
    
    // Use a regex to find all speaker labels and their positions
    // Match pattern: "User:" or "Examiner:" as word boundaries (case-insensitive)
    const labelRegex = /\b(User|Examiner):/gi;
    const matches: Array<{ index: number; label: string; type: 'user' | 'examiner' }> = [];
    
    let match;
    while ((match = labelRegex.exec(transcript)) !== null) {
      matches.push({
        index: match.index,
        label: match[0],
        type: match[1].toLowerCase() as 'user' | 'examiner'
      });
    }
    
    if (matches.length === 0) {
      // No labels found, return as unknown
      return [{ speaker: 'unknown' as const, text: transcript }];
    }
    
    const parsed: TranscriptSegment[] = [];
    
    // Handle text before first label (if transcript doesn't start with a label)
    const firstMatch = matches[0];
    if (firstMatch.index > 0) {
      const beforeFirstLabel = transcript.substring(0, firstMatch.index).trim();
      if (beforeFirstLabel) {
        // Text before first label is assumed to be from the user (candidate)
        parsed.push({ speaker: 'user', text: beforeFirstLabel });
      }
    }
    
    // Process each label and extract the text that follows it
    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      const textStart = currentMatch.index + currentMatch.label.length;
      const textEnd = i < matches.length - 1 ? matches[i + 1].index : transcript.length;
      
      let text = transcript.substring(textStart, textEnd).trim();
      
      // Clean up: remove any accidental label text at the end (shouldn't happen but be safe)
      text = text.replace(/\s*\b(User|Examiner):\s*$/, '').trim();
      
      if (text) {
        parsed.push({ speaker: currentMatch.type, text });
      }
    }

    // Clean up: merge consecutive segments from same speaker, remove empty segments, trim text
    const cleaned: TranscriptSegment[] = [];
    for (const seg of parsed) {
      const trimmedText = seg.text.trim();
      if (trimmedText.length === 0) continue;
      
      // Merge with previous segment if same speaker
      if (cleaned.length > 0 && cleaned[cleaned.length - 1].speaker === seg.speaker) {
        cleaned[cleaned.length - 1].text += ' ' + trimmedText;
      } else {
        cleaned.push({ ...seg, text: trimmedText });
      }
    }

    return cleaned.length > 0 ? cleaned : [{ speaker: 'unknown' as const, text: transcript }];
  }, [transcript]);

  const isDiarized = segments.some(s => s.speaker !== 'unknown');

  return (
    <div>
      <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-indigo-400 dark:text-indigo-300 mb-4 sm:mb-6 tracking-widest flex items-center gap-2">
        <span>📝</span> {t('results.transcriptTitle')}
      </h4>
      <div className="bg-indigo-100/70 dark:bg-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-inner max-h-[400px] sm:max-h-[450px] md:max-h-[500px] overflow-y-auto">
        {isDiarized ? (
          <div className="space-y-3 sm:space-y-4">
            {segments.map((segment, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 sm:gap-4 ${
                  segment.speaker === 'examiner' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold shadow-sm ${
                    segment.speaker === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                      : segment.speaker === 'examiner'
                      ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white'
                      : 'bg-gradient-to-br from-slate-400 to-slate-500 text-white'
                  }`}
                >
                  {segment.speaker === 'user'
                    ? '👤'
                    : segment.speaker === 'examiner'
                    ? '🎤'
                    : '💬'}
                </div>
                
                {/* Message bubble */}
                <div className={`flex-1 min-w-0 ${
                  segment.speaker === 'examiner' ? 'flex flex-col items-end' : ''
                }`}>
                  <div
                    className={`inline-block rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm ${
                      segment.speaker === 'user'
                        ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700/50 rounded-tl-none'
                        : segment.speaker === 'examiner'
                        ? 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20 border border-indigo-200 dark:border-indigo-700/50 rounded-tr-none max-w-[85%] sm:max-w-[80%]'
                        : 'bg-slate-100 dark:bg-slate-600/50 border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    <div
                      className={`text-[10px] sm:text-xs font-semibold mb-1.5 ${
                        segment.speaker === 'user'
                          ? 'text-blue-700 dark:text-blue-300'
                          : segment.speaker === 'examiner'
                          ? 'text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {segment.speaker === 'user'
                        ? t('results.transcriptUser') || 'You'
                        : segment.speaker === 'examiner'
                        ? t('results.transcriptExaminer') || 'Examiner'
                        : 'Transcript'}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                      {segment.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {transcript}
          </p>
        )}
      </div>
      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-3 sm:mt-4 text-center italic">
        {t('results.transcriptSubtitle')}
      </p>
    </div>
  );
};
