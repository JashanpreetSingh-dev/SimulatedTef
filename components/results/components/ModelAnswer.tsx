import React, { useMemo } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ModelAnswerProps {
  modelAnswer: string;
}

interface ModelAnswerSegment {
  speaker: 'user' | 'examiner' | 'unknown';
  text: string;
}

export const ModelAnswer: React.FC<ModelAnswerProps> = ({ modelAnswer }) => {
  const { t } = useLanguage();

  // Parse diarized model answer into segments (same logic as Transcript)
  const segments = useMemo(() => {
    if (!modelAnswer) return [];

    // Check if model answer contains diarized format (User: or Examiner:)
    const hasDiarization = /\b(User|Examiner):/i.test(modelAnswer);

    if (!hasDiarization) {
      // Not diarized - return as single examiner segment
      return [{ speaker: 'examiner' as const, text: modelAnswer }];
    }

    // Parse diarized model answer
    const labelRegex = /\b(User|Examiner):/gi;
    const matches: Array<{ index: number; label: string; type: 'user' | 'examiner' }> = [];
    
    let match;
    while ((match = labelRegex.exec(modelAnswer)) !== null) {
      matches.push({
        index: match.index,
        label: match[0],
        type: match[1].toLowerCase() as 'user' | 'examiner'
      });
    }
    
    if (matches.length === 0) {
      return [{ speaker: 'examiner' as const, text: modelAnswer }];
    }
    
    const parsed: ModelAnswerSegment[] = [];
    
    // Handle text before first label
    const firstMatch = matches[0];
    if (firstMatch.index > 0) {
      const beforeFirstLabel = modelAnswer.substring(0, firstMatch.index).trim();
      if (beforeFirstLabel) {
        parsed.push({ speaker: 'user', text: beforeFirstLabel });
      }
    }
    
    // Process each label
    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      const textStart = currentMatch.index + currentMatch.label.length;
      const textEnd = i < matches.length - 1 ? matches[i + 1].index : modelAnswer.length;
      
      let text = modelAnswer.substring(textStart, textEnd).trim();
      text = text.replace(/\s*\b(User|Examiner):\s*$/, '').trim();
      
      if (text) {
        parsed.push({ speaker: currentMatch.type, text });
      }
    }

    // Clean up: merge consecutive segments from same speaker
    const cleaned: ModelAnswerSegment[] = [];
    for (const seg of parsed) {
      const trimmedText = seg.text.trim();
      if (trimmedText.length === 0) continue;
      
      if (cleaned.length > 0 && cleaned[cleaned.length - 1].speaker === seg.speaker) {
        cleaned[cleaned.length - 1].text += ' ' + trimmedText;
      } else {
        cleaned.push({ ...seg, text: trimmedText });
      }
    }

    return cleaned.length > 0 ? cleaned : [{ speaker: 'examiner' as const, text: modelAnswer }];
  }, [modelAnswer]);

  const isDiarized = segments.some(s => s.speaker !== 'unknown');

  return (
    <div className="mb-6 sm:mb-12 p-4 sm:p-8 bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-xl sm:rounded-[2rem] border border-slate-200 dark:border-slate-700 transition-colors">
      <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-indigo-400 dark:text-indigo-300 mb-4 sm:mb-6 tracking-widest flex items-center gap-2">
        <span>✨</span> {t('results.modelAnswerLevel')}
      </h4>
      <div className="bg-indigo-100/70 dark:bg-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-inner max-h-[450px] sm:max-h-[550px] md:max-h-[600px] overflow-y-auto">
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
                    ? '✨'
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
                        : 'Model Answer'}
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
          <div className="flex items-start gap-3 sm:gap-4 flex-row-reverse">
            <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold shadow-sm bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
              ✨
            </div>
            <div className="flex-1 min-w-0 flex flex-col items-end">
              <div className="inline-block rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20 border border-indigo-200 dark:border-indigo-700/50 rounded-tr-none max-w-[85%] sm:max-w-[80%]">
                <div className="text-[10px] sm:text-xs font-semibold mb-1.5 text-indigo-700 dark:text-indigo-300">
                  {t('results.modelAnswerReference') || 'Reference - Model Answer'}
                </div>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                  {modelAnswer}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-3 sm:mt-4 text-center italic">
        {t('results.modelAnswerDescription') || 'Example of a high-quality answer for reference'}
      </p>
    </div>
  );
};
