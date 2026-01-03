import React, { useState, useEffect } from 'react';
import { Assignment, ReadingListeningQuestion } from '../../types';
import { useAssignments } from '../../hooks/useAssignments';
import { useAuth } from '@clerk/clerk-react';
import { AudioPlayer } from '../AudioPlayer';
import { AudioItemMetadata } from '../../services/tasks';
import { authenticatedFetchJSON } from '../../services/authenticatedFetch';
import { useLanguage } from '../../contexts/LanguageContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface QuestionReviewEditorProps {
  assignment: Assignment & { questions?: ReadingListeningQuestion[]; task?: any };
  onSave: (updates: Partial<Assignment>) => void;
  onPublish: () => void;
  loading?: boolean;
}

export function QuestionReviewEditor({
  assignment,
  onSave,
  onPublish,
  loading,
}: QuestionReviewEditorProps) {
  const { t } = useLanguage();
  const { updateQuestion } = useAssignments();
  const { getToken } = useAuth();
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editedQuestions, setEditedQuestions] = useState<Map<string, Partial<ReadingListeningQuestion>>>(
    new Map()
  );
  const [audioItems, setAudioItems] = useState<AudioItemMetadata[] | null>(null);
  const [audioBlobUrls, setAudioBlobUrls] = useState<Map<string, string>>(new Map());
  const [loadingAudio, setLoadingAudio] = useState<Map<string, boolean>>(new Map());

  const questions = assignment.questions || [];

  // Fetch audio items for listening assignments
  useEffect(() => {
    if (assignment.type === 'listening' && assignment.taskId) {
      // Clear audio cache when assignment changes to prevent serving stale audio
      setAudioBlobUrls(new Map());
      setLoadingAudio(new Map());
      fetchAudioItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment.type, assignment.taskId]);

  const fetchAudioItems = async () => {
    try {
      const items = await authenticatedFetchJSON<AudioItemMetadata[]>(
        `${BACKEND_URL}/api/audio/items/${assignment.taskId}`,
        {
          method: 'GET',
          getToken,
        }
      );
      setAudioItems(items || null);
    } catch (err) {
      console.error('Failed to load audio items:', err);
    }
  };

  // Fetch audio blob URL for a specific audio item
  const fetchAudioBlob = async (audioId: string) => {
    if (audioBlobUrls.has(audioId)) {
      return audioBlobUrls.get(audioId);
    }

    setLoadingAudio(prev => new Map(prev).set(audioId, true));
    try {
      // Add cache-busting query parameter to ensure fresh audio is fetched
      // This prevents browser from serving cached audio when assignments are regenerated
      const cacheBuster = `?t=${Date.now()}&taskId=${assignment.taskId || ''}`;
      const response = await fetch(`${BACKEND_URL}/api/audio/${audioId}${cacheBuster}`, {
        headers: {
          'Authorization': `Bearer ${await getToken()}`,
        },
        cache: 'no-store', // Explicitly disable fetch cache
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      setAudioBlobUrls(prev => new Map(prev).set(audioId, blobUrl));
      setLoadingAudio(prev => {
        const newMap = new Map(prev);
        newMap.delete(audioId);
        return newMap;
      });
      
      return blobUrl;
    } catch (err) {
      console.error(`Failed to fetch audio ${audioId}:`, err);
      setLoadingAudio(prev => {
        const newMap = new Map(prev);
        newMap.delete(audioId);
        return newMap;
      });
      return null;
    }
  };

  const handleQuestionEdit = (questionId: string, updates: Partial<ReadingListeningQuestion>) => {
    const current = editedQuestions.get(questionId) || {};
    editedQuestions.set(questionId, { ...current, ...updates });
    setEditedQuestions(new Map(editedQuestions));
  };

  const handleSaveQuestion = async (questionId: string) => {
    const updates = editedQuestions.get(questionId);
    if (!updates) return;

    try {
      await updateQuestion(assignment.assignmentId, questionId, {
        question: updates.question,
        questionText: updates.questionText,
        options: updates.options,
        correctAnswer: updates.correctAnswer,
        explanation: updates.explanation,
      } as any);

      editedQuestions.delete(questionId);
      setEditedQuestions(new Map(editedQuestions));
      setEditingQuestionId(null);
    } catch (err) {
      console.error('Failed to save question:', err);
      alert(t('assignments.saveQuestionFailed'));
    }
  };

  const getQuestionDisplay = (question: ReadingListeningQuestion) => {
    const edited = editedQuestions.get(question.questionId);
    return edited ? { ...question, ...edited } : question;
  };

  /**
   * Format dialogue script with proper line breaks and speaker highlighting
   * Handles scripts with or without line breaks
   */
  const formatDialogueScript = (script: string): React.ReactNode => {
    if (!script) return null;
    
    // Pattern to match speaker: text (handles various formats)
    // Matches speaker names followed by colon (e.g., "Employé:", "Client:", "Personne A:")
    // Uses word boundary to avoid matching mid-word
    const speakerPattern = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]*?):\s*/g;
    
    // First, try to split by line breaks if they exist
    const lines = script.split('\n').filter(line => line.trim());
    
    // Check if this is a dialogue (has speaker indicators)
    const hasDialogue = /[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]*?:\s*/.test(script);
    
    if (!hasDialogue) {
      // Single speaker - return as plain text with preserved formatting
      return <p className="whitespace-pre-wrap">{script}</p>;
    }
    
    // Parse the script into segments
    const segments: Array<{ speaker: string; text: string }> = [];
    
    // If script has line breaks, parse line by line
    if (lines.length > 1) {
      let currentSpeaker: string | null = null;
      let currentText: string[] = [];
      
      for (const line of lines) {
        const match = line.match(/^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]*?):\s*(.*)$/);
        if (match) {
          // Save previous speaker's text
          if (currentSpeaker && currentText.length > 0) {
            segments.push({
              speaker: currentSpeaker,
              text: currentText.join(' ').trim()
            });
          }
          // Start new speaker
          currentSpeaker = match[1].trim();
          currentText = [match[2].trim()];
        } else if (currentSpeaker) {
          // Continuation of current speaker's text
          currentText.push(line.trim());
        }
      }
      
      // Add last speaker
      if (currentSpeaker && currentText.length > 0) {
        segments.push({
          speaker: currentSpeaker,
          text: currentText.join(' ').trim()
        });
      }
    } else {
      // No line breaks - parse the entire string
      const speakerMatches: Array<{ index: number; speaker: string; fullMatch: string }> = [];
      let match;
      
      // Reset regex
      speakerPattern.lastIndex = 0;
      
      // Find all speaker indicators
      while ((match = speakerPattern.exec(script)) !== null) {
        speakerMatches.push({
          index: match.index,
          speaker: match[1].trim(),
          fullMatch: match[0]
        });
      }
      
      // Extract text segments between speakers
      for (let i = 0; i < speakerMatches.length; i++) {
        const currentMatch = speakerMatches[i];
        const nextMatch = speakerMatches[i + 1];
        
        // Get text after the speaker name (after the colon and any whitespace)
        const textStart = currentMatch.index + currentMatch.fullMatch.length;
        const textEnd = nextMatch ? nextMatch.index : script.length;
        const text = script.substring(textStart, textEnd).trim();
        
        if (text) {
          segments.push({
            speaker: currentMatch.speaker,
            text: text
          });
        }
      }
    }
    
    // If we couldn't parse properly, return as plain text with line breaks
    if (segments.length === 0) {
      return <p className="whitespace-pre-wrap">{script}</p>;
    }
    
    // Render dialogue with proper formatting
    return (
      <div className="space-y-2">
        {segments.map((segment, index) => (
          <div key={index} className="flex gap-3 items-start">
            <span className="font-semibold text-blue-600 dark:text-blue-400 flex-shrink-0 min-w-[100px]">
              {segment.speaker}:
            </span>
            <span className="flex-1 text-slate-700 dark:text-slate-300 leading-relaxed">
              {segment.text}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Assignment Info */}
      <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          {assignment.title}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          {assignment.type === 'reading' ? t('assignments.readingComprehension') : t('assignments.listeningComprehension')} • {questions.length} {t('assignments.questions')}
        </p>
        <p className="text-slate-500 dark:text-slate-500 text-sm mt-2">
          {assignment.prompt}
        </p>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
            {t('assignments.questionsTitle')} ({questions.length})
          </h3>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => onSave({})}
              className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-lg transition-colors whitespace-nowrap"
            >
              {t('assignments.saveChanges')}
            </button>
            <button
              onClick={onPublish}
              disabled={loading || questions.length === 0}
              className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {assignment.status === 'published' ? t('assignments.updatePublished') : t('assignments.publishAssignment')}
            </button>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <p>{t('assignments.noQuestionsYet')}</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {questions.map((question) => {
              const displayQuestion = getQuestionDisplay(question);
              const isEditing = editingQuestionId === question.questionId;
              const hasChanges = editedQuestions.has(question.questionId);

              return (
                <div
                  key={question.questionId}
                  className={`border rounded-xl p-3 sm:p-4 ${
                    isEditing
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  } ${hasChanges ? 'ring-2 ring-amber-400' : ''}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300">
                        {t('assignments.questionNumber').replace('{number}', question.questionNumber.toString())}
                      </span>
                      {hasChanges && (
                        <span className="text-xs px-2 py-1 sm:px-3 sm:py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded whitespace-nowrap">
                          {t('assignments.unsaved')}
                        </span>
                      )}
                    </div>
                    {!isEditing ? (
                      <button
                        onClick={() => setEditingQuestionId(question.questionId)}
                        className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold self-start sm:self-auto"
                      >
                        {t('assignments.edit')}
                      </button>
                    ) : (
                      <div className="flex gap-2 self-start sm:self-auto">
                        <button
                          onClick={() => handleSaveQuestion(question.questionId)}
                          className="text-xs sm:text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold"
                        >
                          {t('assignments.save')}
                        </button>
                        <button
                          onClick={() => {
                            editedQuestions.delete(question.questionId);
                            setEditedQuestions(new Map(editedQuestions));
                            setEditingQuestionId(null);
                          }}
                          className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
                        >
                          {t('assignments.cancelEdit')}
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      {/* Audio player and script for listening questions (in edit mode) */}
                      {assignment.type === 'listening' && displayQuestion.audioId && audioItems && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                          {(() => {
                            const audioItem = audioItems.find(item => item.audioId === displayQuestion.audioId);
                            const audioBlobUrl = audioBlobUrls.get(displayQuestion.audioId);
                            const isLoading = loadingAudio.get(displayQuestion.audioId);
                            
                            // Auto-fetch audio if not already loaded
                            if (!audioBlobUrl && !isLoading && audioItem?.hasAudio) {
                              fetchAudioBlob(displayQuestion.audioId);
                            }
                            
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{t('assignments.audio')}</span>
                                  {isLoading ? (
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{t('assignments.loadingAudio')}</span>
                                  ) : audioBlobUrl ? (
                                    <div className="flex-1">
                                      <AudioPlayer
                                        src={audioBlobUrl}
                                        className="w-full"
                                      />
                                    </div>
                                  ) : audioItem?.hasAudio ? (
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Loading...</span>
                                  ) : (
                                    <span className="text-xs text-amber-600 dark:text-amber-400">{t('assignments.audioNotAvailable')}</span>
                                  )}
                                </div>
                                {audioItem?.audioScript && (
                                  <div className="mt-2">
                                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">{t('assignments.script')}</p>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-800 rounded p-2 border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                                      {formatDialogueScript(audioItem.audioScript)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      {/* Question Text */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('assignments.questionLabel')}
                        </label>
                        <textarea
                          value={displayQuestion.question}
                          onChange={(e) =>
                            handleQuestionEdit(question.questionId, { question: e.target.value })
                          }
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm"
                        />
                      </div>

                      {/* Question Text (for reading) */}
                      {assignment.type === 'reading' && displayQuestion.questionText && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {t('assignments.referenceText')}
                          </label>
                          <textarea
                            value={displayQuestion.questionText}
                            onChange={(e) =>
                              handleQuestionEdit(question.questionId, { questionText: e.target.value })
                            }
                            rows={4}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm"
                          />
                        </div>
                      )}

                      {/* Options */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('assignments.options')}
                        </label>
                        {displayQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center gap-2 mb-2">
                            <input
                              type="radio"
                              name={`correct-${question.questionId}`}
                              checked={displayQuestion.correctAnswer === index}
                              onChange={() =>
                                handleQuestionEdit(question.questionId, { correctAnswer: index })
                              }
                              className="w-4 h-4 text-indigo-600"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...displayQuestion.options];
                                newOptions[index] = e.target.value;
                                handleQuestionEdit(question.questionId, { options: newOptions });
                              }}
                              className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Explanation */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          {t('assignments.explanation')}
                        </label>
                        <textarea
                          value={displayQuestion.explanation}
                          onChange={(e) =>
                            handleQuestionEdit(question.questionId, { explanation: e.target.value })
                          }
                          rows={2}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Audio player and script for listening questions */}
                      {assignment.type === 'listening' && displayQuestion.audioId && audioItems && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                          {(() => {
                            const audioItem = audioItems.find(item => item.audioId === displayQuestion.audioId);
                            const audioBlobUrl = audioBlobUrls.get(displayQuestion.audioId);
                            const isLoading = loadingAudio.get(displayQuestion.audioId);
                            
                            // Auto-fetch audio if not already loaded
                            if (!audioBlobUrl && !isLoading && audioItem?.hasAudio) {
                              fetchAudioBlob(displayQuestion.audioId);
                            }
                            
                            return (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{t('assignments.audio')}</span>
                                  {isLoading ? (
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{t('assignments.loadingAudio')}</span>
                                  ) : audioBlobUrl ? (
                                    <div className="flex-1">
                                      <AudioPlayer
                                        src={audioBlobUrl}
                                        className="w-full"
                                      />
                                    </div>
                                  ) : audioItem?.hasAudio ? (
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Loading...</span>
                                  ) : (
                                    <span className="text-xs text-amber-600 dark:text-amber-400">{t('assignments.audioNotAvailable')}</span>
                                  )}
                                </div>
                                {audioItem?.audioScript && (
                                  <div className="mt-2">
                                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">{t('assignments.script')}</p>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-800 rounded p-2 border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                                      {formatDialogueScript(audioItem.audioScript)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      <p className="text-slate-800 dark:text-slate-200 font-semibold">
                        {displayQuestion.question}
                      </p>
                      {assignment.type === 'reading' && displayQuestion.questionText && (
                        <div className="bg-slate-50 dark:bg-slate-900 rounded p-3 text-sm text-slate-600 dark:text-slate-400">
                          {displayQuestion.questionText.substring(0, 200)}
                          {displayQuestion.questionText.length > 200 ? '...' : ''}
                        </div>
                      )}
                      <div className="space-y-1">
                        {displayQuestion.options.map((option, index) => (
                          <div
                            key={index}
                            className={`p-2 rounded text-sm ${
                              index === displayQuestion.correctAnswer
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-semibold'
                                : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {String.fromCharCode(65 + index)}. {option}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        <strong>{t('assignments.explanation')}:</strong> {displayQuestion.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
