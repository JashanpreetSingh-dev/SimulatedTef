import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { SavedResult, UpgradedSentence, TEFTask } from '../types';
import { authenticatedFetch } from '../services/authenticatedFetch';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface Props {
  result: SavedResult;
  onBack: () => void;
}

// Helper functions moved outside component to prevent recreation on every render
const getCECRColor = (level?: string) => {
  if (!level) return 'bg-indigo-100/700';
  const cecr = level.toUpperCase();
  if (cecr.includes('C2')) return 'bg-purple-400';
  if (cecr.includes('C1')) return 'bg-indigo-400';
  if (cecr.includes('B2')) return 'bg-blue-400';
  if (cecr.includes('B1')) return 'bg-emerald-400';
  if (cecr.includes('A2')) return 'bg-amber-600';
  return 'bg-rose-600';
};

const getImagePath = (imagePath: string): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('/')) return imagePath;
  return '/' + imagePath;
};

const getSectionBadgeColor = (mode: string) => {
  if (mode === 'partA') return 'bg-blue-100 dark:bg-blue-900/50 text-blue-400 dark:text-blue-300 border-blue-200 dark:border-blue-700';
  if (mode === 'partB') return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-400 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';
  return 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700';
};

const getSectionLabel = (mode: string) => {
  if (mode === 'partA') return 'A';
  if (mode === 'partB') return 'B';
  return 'Complet';
};

const DetailedResultViewComponent: React.FC<Props> = ({ result, onBack }) => {
  const { getToken } = useAuth();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioObjectUrlRef = useRef<string | null>(null);

  // Fetch audio with authentication and create object URL
  useEffect(() => {
    if (!result.recordingId) {
      return;
    }

    const loadAudio = async () => {
      try {
        setAudioLoading(true);
        setAudioError(null);
        
        // Clean up previous object URL if it exists
        if (audioObjectUrlRef.current) {
          URL.revokeObjectURL(audioObjectUrlRef.current);
          audioObjectUrlRef.current = null;
        }
        
        const response = await authenticatedFetch(`${BACKEND_URL}/api/recordings/${result.recordingId}`, {
          getToken: getToken,
        });

        if (!response.ok) {
          throw new Error(`Failed to load audio: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        audioObjectUrlRef.current = objectUrl;
        setAudioUrl(objectUrl);
        setAudioLoading(false);
        
      } catch (error: any) {
        console.error('Error loading audio:', error);
        setAudioError(error.message || 'Failed to load audio recording');
        setAudioLoading(false);
      }
    };

    loadAudio();

    // Cleanup: revoke object URL when component unmounts or recordingId changes
    return () => {
      if (audioObjectUrlRef.current) {
        URL.revokeObjectURL(audioObjectUrlRef.current);
        audioObjectUrlRef.current = null;
      }
    };
  }, [result.recordingId, getToken]);

  // Memoize expensive calculations to prevent recalculation on every render
  const criteria = useMemo(() => result.criteria || {}, [result.criteria]);
  const upgradedSentences = useMemo(() => result.upgraded_sentences || [], [result.upgraded_sentences]);
  const topImprovements = useMemo(() => result.top_improvements || [], [result.top_improvements]);
  
  // Memoize tasks to display
  const tasksToDisplay = useMemo(() => {
    const tasks: Array<{ task: TEFTask; label: string }> = [];
    if (result.mode === 'partA' && result.taskPartA) {
      tasks.push({ task: result.taskPartA, label: 'Section A' });
    } else if (result.mode === 'partB' && result.taskPartB) {
      tasks.push({ task: result.taskPartB, label: 'Section B' });
    } else if (result.mode === 'full') {
      if (result.taskPartA) tasks.push({ task: result.taskPartA, label: 'Section A' });
      if (result.taskPartB) tasks.push({ task: result.taskPartB, label: 'Section B' });
    }
    return tasks;
  }, [result.mode, result.taskPartA, result.taskPartB]);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      {/* Header with Back Button */}
      <button 
        onClick={onBack}
        className="text-indigo-400 dark:text-indigo-300 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity"
      >
        <span>←</span> Retour à la liste
      </button>

      {/* Compact Top Section: Section Badge, CLB, CECR, Recording */}
      <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 md:p-6 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
          {/* Pills Section */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
            {/* Section Badge */}
            <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border font-black text-xs sm:text-sm uppercase tracking-wider ${getSectionBadgeColor(result.mode)}`}>
              Section {getSectionLabel(result.mode)}
            </div>

            {/* CLB Pill */}
            <div className="bg-indigo-400 dark:bg-indigo-500 text-white dark:text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg flex items-center gap-1.5 sm:gap-2">
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider opacity-80">CLB</span>
              <span className="text-base sm:text-lg font-black">{result.clbLevel}</span>
              <span className="text-[8px] sm:text-[9px] font-bold opacity-70 hidden sm:inline">({result.score}/699)</span>
            </div>

            {/* CECR Pill */}
            {result.cecrLevel && (
              <div className={`${getCECRColor(result.cecrLevel)} text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg flex items-center gap-1.5 sm:gap-2`}>
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider opacity-80">CECR</span>
                <span className="text-base sm:text-lg font-black">{result.cecrLevel}</span>
              </div>
            )}
          </div>

          {/* Recording - Full width on mobile, flex-1 on desktop */}
          {result.recordingId && (
            <div className="flex items-center gap-2 sm:gap-3 w-full md:flex-1 md:min-w-[200px]">
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex-shrink-0">🎙️</span>
              {audioLoading ? (
                <div className="flex-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="w-4 h-4 border-2 border-indigo-400 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Chargement de l'audio...</span>
                </div>
              ) : audioError ? (
                <div className="flex-1 text-xs text-rose-600 dark:text-rose-400">
                  Erreur: {audioError}
                </div>
              ) : audioUrl ? (
                <audio 
                  controls 
                  className="flex-1 h-7 sm:h-8"
                  src={audioUrl}
                  preload="auto"
                  onLoadedMetadata={(e) => {
                    const target = e.target as HTMLAudioElement;
                    const duration = target.duration;
                    // Some formats (like WebM) may show Infinity until full file is loaded
                    if (duration && !isNaN(duration) && isFinite(duration) && duration > 0) {
                      console.log('✅ Audio duration:', duration.toFixed(2), 'seconds');
                    } else if (duration === Infinity) {
                      console.log('ℹ️ Duration not in header (WebM/OGG), will be available after playback starts');
                    }
                  }}
                  onDurationChange={(e) => {
                    const target = e.target as HTMLAudioElement;
                    // Duration may become available after some data is loaded
                    if (target.duration && isFinite(target.duration) && target.duration > 0) {
                      console.log('✅ Duration updated:', target.duration.toFixed(2), 'seconds');
                    }
                  }}
                  onError={(e) => {
                    console.error('Audio playback error:', e);
                    const target = e.target as HTMLAudioElement;
                    if (target.error) {
                      console.error('Audio error details:', {
                        code: target.error.code,
                        message: target.error.message,
                        networkState: target.networkState,
                      });
                      setAudioError(`Playback error: ${target.error.message}`);
                    }
                  }}
                  onLoadStart={() => {
                    console.log('🎵 Audio loading started');
                  }}
                  onCanPlay={() => {
                    console.log('✅ Audio ready to play');
                  }}
                  // Prevent audio events from bubbling and causing re-renders
                  onPlay={(e) => e.stopPropagation()}
                  onPause={(e) => e.stopPropagation()}
                  onTimeUpdate={(e) => e.stopPropagation()}
                >
                  Votre navigateur ne supporte pas la lecture audio.
                </audio>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Task Images Section */}
      {tasksToDisplay.length > 0 && (
        <div className="mb-6 sm:mb-12 space-y-4 sm:space-y-8">
          {tasksToDisplay.map(({ task, label }, index) => (
            <div key={index} className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl sm:rounded-[3rem] border border-slate-200 dark:border-slate-700 p-4 sm:p-8 md:p-12 shadow-sm transition-colors">
              <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-4 sm:mb-6 tracking-widest flex items-center gap-2">
                <span>📄</span> Document Officiel #{task.id}
              </h4>
              <div className="mb-4 sm:mb-6">
                <img
                  src={getImagePath(task.image)}
                  alt={`${label} Task Document`}
                  className="w-full rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Prevent infinite retry loops - only try once
                    if (target.dataset.retried === 'true') {
                      target.style.display = 'none';
                      return;
                    }
                    target.dataset.retried = 'true';
                    
                    // Try alternative path only once
                    const currentSrc = target.src;
                    if (task.image.startsWith('/')) {
                      // Try without leading slash
                      const altPath = task.image.substring(1);
                      if (!currentSrc.includes(altPath)) {
                        target.src = altPath;
                      }
                    } else {
                      // Try with leading slash
                      const altPath = '/' + task.image;
                      if (!currentSrc.includes(altPath)) {
                        target.src = altPath;
                      }
                    }
                  }}
                />
              </div>
              <div className="bg-indigo-100/70 dark:bg-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-600">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                  <strong className="text-slate-800 dark:text-slate-100 not-italic block mb-1 sm:mb-2">Consigne :</strong> {task.prompt}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Result Card */}
      <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl sm:rounded-[3rem] border border-slate-200 dark:border-slate-700 p-4 sm:p-8 md:p-12 shadow-sm transition-colors">
        {/* Title Section */}
        <div className="mb-6 sm:mb-12 pb-4 sm:pb-8 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{result.title}</h3>
        </div>

        {/* Transcript */}
        {result.transcript && (
          <div className="mb-6 sm:mb-12 p-4 sm:p-8 bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-xl sm:rounded-[2rem] border border-slate-200 dark:border-slate-700 transition-colors">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-indigo-400 dark:text-indigo-300 mb-4 sm:mb-6 tracking-widest flex items-center gap-2">
              <span>📝</span> Transcription de votre discours
            </h4>
            <div className="bg-indigo-100/70 dark:bg-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-inner max-h-[300px] sm:max-h-[400px] overflow-y-auto">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {result.transcript}
              </p>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-3 sm:mt-4 text-center italic">
              Transcription automatique de votre performance
            </p>
          </div>
        )}

        {/* Overall Comment */}
        {result.overall_comment && (
          <div className="mb-6 sm:mb-12 p-4 sm:p-8 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl sm:rounded-[2rem] border border-indigo-200 dark:border-indigo-800 transition-colors">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-indigo-400 dark:text-indigo-300 mb-3 sm:mb-4 tracking-widest">Évaluation Globale</h4>
            <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {result.overall_comment}
            </p>
          </div>
        )}

        {/* Criteria Breakdown */}
        {Object.keys(criteria).length > 0 && (
          <div className="mb-6 sm:mb-12">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-4 sm:mb-6 tracking-widest">Détail des Critères</h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Object.entries(criteria).map(([key, value]) => {
                // Handle both old format (string) and new format (object with score and comment)
                const criterionValue = value as any;
                const score = typeof criterionValue === 'object' && criterionValue !== null && 'score' in criterionValue 
                  ? criterionValue.score 
                  : (typeof criterionValue === 'number' ? criterionValue : null);
                const comment = typeof criterionValue === 'object' && criterionValue !== null && 'comment' in criterionValue
                  ? criterionValue.comment
                  : (typeof criterionValue === 'string' ? criterionValue : null);
                
                return (
                  <div key={key} className="bg-indigo-100/70 dark:bg-slate-700/50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-600 transition-colors">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="text-[10px] sm:text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      {score !== null && (
                        <div className="text-xl sm:text-2xl font-black text-indigo-400 dark:text-indigo-300">
                          {score}/10
                        </div>
                      )}
                    </div>
                    {comment && (
                      <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {comment}
                      </div>
                    )}
                    {!comment && score === null && (
                      <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
                        {typeof criterionValue === 'string' ? criterionValue : JSON.stringify(criterionValue)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Strengths and Weaknesses */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-12">
          {/* Strengths */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 sm:p-8 rounded-xl sm:rounded-[2rem] border border-emerald-100 dark:border-emerald-800 transition-colors">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-400 dark:text-emerald-300 mb-4 sm:mb-6 tracking-widest flex items-center gap-2">
              <span>✓</span> Points Forts
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              {result.strengths && result.strengths.length > 0 ? (
                result.strengths.map((strength, i) => (
                  <li key={i} className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2">
                    <span className="text-emerald-500 dark:text-emerald-400 mt-1">•</span>
                    <span>{strength}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">Aucun point fort identifié</li>
              )}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-rose-50 dark:bg-rose-900/20 p-4 sm:p-8 rounded-xl sm:rounded-[2rem] border border-rose-100 dark:border-rose-800 transition-colors">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 mb-4 sm:mb-6 tracking-widest flex items-center gap-2">
              <span>!</span> Points à Améliorer
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              {result.weaknesses && result.weaknesses.length > 0 ? (
                result.weaknesses.map((weakness, i) => (
                  <li key={i} className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2">
                    <span className="text-rose-300 dark:text-rose-400 mt-1">•</span>
                    <span>{weakness}</span>
                  </li>
                ))
              ) : (
                <li className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">Aucun point à améliorer identifié</li>
              )}
            </ul>
          </div>
        </div>

        {/* Top Improvements */}
        {topImprovements.length > 0 && (
          <div className="mb-6 sm:mb-12 p-4 sm:p-8 bg-amber-50 dark:bg-amber-900/20 rounded-xl sm:rounded-[2rem] border border-amber-100 dark:border-amber-800 transition-colors">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 mb-4 sm:mb-6 tracking-widest flex items-center gap-2">
              <span>🎯</span> Priorités d'Amélioration
            </h4>
            <ol className="space-y-3 sm:space-y-4">
              {topImprovements.map((improvement, i) => (
                <li key={i} className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2 sm:gap-3">
                  <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-amber-300 dark:bg-amber-600 text-white dark:text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black">
                    {i + 1}
                  </span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Upgraded Sentences */}
        {upgradedSentences.length > 0 && (
          <div className="mb-6 sm:mb-12">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-4 sm:mb-6 tracking-widest flex items-center gap-2">
              <span>✨</span> Exemples d'Amélioration
            </h4>
            <div className="space-y-4 sm:space-y-6">
              {upgradedSentences.map((sentence: UpgradedSentence, i: number) => (
                <div key={i} className="bg-indigo-100/70 dark:bg-slate-700/50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-600 transition-colors">
                  <div className="grid md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 md:gap-6">
                    <div className="md:pr-3 md:border-r md:border-slate-200 md:dark:border-slate-600">
                      <div className="text-[9px] sm:text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 mb-1.5 sm:mb-2 tracking-wider">Version Originale</div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">"{sentence.weak}"</p>
                    </div>
                    <div className="md:pl-3">
                      <div className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-400 dark:text-emerald-300 mb-1.5 sm:mb-2 tracking-wider">Version Améliorée</div>
                      <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-medium leading-relaxed">"{sentence.better}"</p>
                    </div>
                  </div>
                  <div className="pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-600">
                    <div className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1 tracking-wider">Explication</div>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{sentence.why}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Model Answer */}
        {result.model_answer && (
          <div className="mb-6 sm:mb-12 p-4 sm:p-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl sm:rounded-[2rem] border border-blue-100 dark:border-blue-500/20">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-blue-400 dark:text-blue-400 mb-4 sm:mb-6 tracking-widest flex items-center gap-2">
              <span>📝</span> Réponse Modèle (Niveau B2-C1)
            </h4>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {result.model_answer}
              </p>
            </div>
          </div>
        )}

        {/* Grammar and Vocabulary Notes */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-12">
          <div className="bg-indigo-100/70 dark:bg-slate-700/50 p-4 sm:p-8 rounded-xl sm:rounded-[2rem] border border-slate-200 dark:border-slate-600 transition-colors">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-3 sm:mb-4 tracking-widest">Notes de Grammaire</h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic">
              {result.grammarNotes || "Aucune note spécifique"}
            </p>
          </div>
          <div className="bg-indigo-100/70 dark:bg-slate-700/50 p-4 sm:p-8 rounded-xl sm:rounded-[2rem] border border-slate-200 dark:border-slate-600 transition-colors">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-3 sm:mb-4 tracking-widest">Notes de Vocabulaire</h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic">
              {result.vocabularyNotes || "Aucune note spécifique"}
            </p>
          </div>
        </div>

        {/* General Feedback */}
        {result.feedback && (
          <div className="p-4 sm:p-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl sm:rounded-[2rem] border border-indigo-200 dark:border-indigo-800 transition-colors">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-indigo-400 dark:text-indigo-300 mb-3 sm:mb-4 tracking-widest">Commentaire Général</h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {result.feedback}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

// Memoize the component to prevent re-renders when props haven't changed
export const DetailedResultView = React.memo(DetailedResultViewComponent);

