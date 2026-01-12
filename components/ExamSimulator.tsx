
import React, { useState } from 'react';
import { OralExpressionLive } from './OralExpressionLive';
import { LoadingResult } from './LoadingResult';
import { getRandomTasks } from '../services/tasks';
import { useUser } from '@clerk/clerk-react';
import { useExamResult } from '../hooks/useExamResult';
import { useUsage } from '../hooks/useUsage';

type SimulationMode = 'partA' | 'partB' | 'full';

export const ExamSimulator: React.FC = () => {
  const { user } = useUser();
  const [simulationMode, setSimulationMode] = useState<SimulationMode | null>(null);
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState<any>(null);
  
  const { startExam, loading: usageLoading } = useUsage();
  
  // Use the custom hook for result management
  const { result: evaluation, isLoading, handleResult, clearResult } = useExamResult({
    onSuccess: (savedResult) => {
      console.log('Exam completed successfully:', savedResult._id);
    },
    onError: (error) => {
      console.error('Exam error:', error);
      const errorMessage = error instanceof Error ? error.message : error;
      alert(`Une erreur est survenue: ${errorMessage}`);
    },
    autoNavigate: false, // Don't auto-navigate in ExamSimulator, show result inline
  });

  const startSimulation = async (mode: SimulationMode) => {
    setLoading(true);
    
    // Track usage (B2B mode - no limits)
    const examType = mode === 'full' ? 'full' : mode === 'partA' ? 'partA' : 'partB';
    await startExam(examType);
    
    setSimulationMode(mode);
    clearResult();
    
    const { partA, partB } = getRandomTasks();
    
    setScenario({
      officialTasks: { partA, partB },
      mode: mode,
      title: mode === 'full' ? "Examen Complet Oral" : (mode === 'partA' ? "Section A Orale" : "Section B Orale")
    });
    setLoading(false);
  };

  if (evaluation) {
    // Show loading state if evaluation is still in progress
    if (isLoading) {
      return <LoadingResult />;
    }
    return (
      <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 animate-in fade-in zoom-in duration-300 transition-colors">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tight">Analyse de Performance</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Session terminée avec succès</p>
          </div>
          <div className="text-center bg-indigo-400 dark:bg-indigo-500 text-white dark:text-white rounded-2xl p-6 min-w-[160px] shadow-lg shadow-indigo-400/20 dark:shadow-indigo-500/20">
            <div className="text-4xl font-black mb-1">{evaluation.clbLevel}</div>
            <div className="text-xs font-black opacity-80 uppercase tracking-[0.2em]">Score : {evaluation.score}/699</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800 transition-colors">
            <h3 className="font-black text-xs uppercase text-emerald-400 dark:text-emerald-300 mb-6 tracking-widest flex items-center gap-2">
              <span className="text-base">✅</span> Points forts
            </h3>
            <ul className="space-y-4">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="text-slate-600 dark:text-slate-300 text-sm font-medium flex gap-3 leading-relaxed">
                  <span className="text-emerald-500 dark:text-emerald-400">•</span> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-6 border border-rose-100 dark:border-rose-800 transition-colors">
            <h3 className="font-black text-xs uppercase text-rose-600 dark:text-rose-400 mb-6 tracking-widest flex items-center gap-2">
              <span className="text-base">⚠️</span> Axes de progression
            </h3>
            <ul className="space-y-4">
              {evaluation.weaknesses.map((w, i) => (
                <li key={i} className="text-slate-600 dark:text-slate-300 text-sm font-medium flex gap-3 leading-relaxed">
                  <span className="text-rose-300 dark:text-rose-400">•</span> {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-100/70 dark:bg-slate-700/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-600 transition-colors">
            <h4 className="font-black text-xs uppercase text-slate-500 dark:text-slate-400 mb-4 tracking-[0.2em]">Feedback Global</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">"{evaluation.feedback}"</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-slate-200 dark:border-slate-600 rounded-2xl bg-indigo-100/70 dark:bg-slate-700/50 transition-colors">
              <h4 className="font-black text-xs uppercase text-slate-500 dark:text-slate-400 mb-3 tracking-[0.2em]">Grammaire & Syntaxe</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{evaluation.grammarNotes}</p>
            </div>
            <div className="p-6 border border-slate-200 dark:border-slate-600 rounded-2xl bg-indigo-100/70 dark:bg-slate-700/50 transition-colors">
              <h4 className="font-black text-xs uppercase text-slate-500 dark:text-slate-400 mb-3 tracking-[0.2em]">Richesse Lexicale</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{evaluation.vocabularyNotes}</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => { clearResult(); setSimulationMode(null); }} 
          className="mt-12 w-full bg-slate-900 dark:bg-slate-700 text-white dark:text-slate-100 py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10 dark:shadow-slate-700/20"
        >
          Nouvel Entraînement
        </button>
      </div>
    );
  }

  if (simulationMode && scenario) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
        <button onClick={() => setSimulationMode(null)} className="text-indigo-400 dark:text-indigo-300 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity mb-4">
          <span>←</span> Menu principal
        </button>
        <OralExpressionLive scenario={scenario} onFinish={handleResult} />
      </div>
    );
  }

  return (
      <div className="space-y-16 py-8">
      <div className="max-w-3xl">
        <h2 className="text-5xl font-black text-slate-800 dark:text-slate-100 mb-6 tracking-tight">Simulateur d'Examen</h2>
        <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          Pratiquez l'expression orale pour le TEF Canada. Nos modèles IA évaluent votre production en temps réel selon les critères officiels de la CCI.
        </p>
      </div>

      <div className="space-y-12">
        <div>
          <h3 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.3em] mb-8">Expression Orale</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <button 
              onClick={() => startSimulation('partA')} 
              disabled={loading || usageLoading}
              className="group bg-indigo-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-8 rounded-3xl text-left hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col h-full shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-3xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">📞</div>
              <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-3">Section A</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed flex-1">Solliciter des informations. Appelez pour poser des questions précises sur une annonce.</p>
              <div className="mt-8 text-xs font-black text-blue-400 dark:text-blue-300 uppercase tracking-widest">4 minutes • Live Mic</div>
            </button>
            <button 
              onClick={() => startSimulation('partB')} 
              disabled={loading || usageLoading}
              className="group bg-indigo-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-8 rounded-3xl text-left hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col h-full shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-3xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform">🤝</div>
              <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-3">Section B</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed flex-1">Argumenter et convaincre. Présentez un projet et répondez aux objections d'un ami.</p>
              <div className="mt-8 text-xs font-black text-emerald-400 dark:text-emerald-300 uppercase tracking-widest">8 minutes • Live Mic</div>
            </button>
            <button 
              onClick={() => startSimulation('full')} 
              disabled={loading || usageLoading}
              className="group bg-indigo-400 dark:bg-indigo-500 p-8 rounded-3xl text-left hover:shadow-2xl hover:shadow-indigo-400/30 dark:hover:shadow-indigo-500/30 transition-all flex flex-col h-full text-white dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-16 h-16 bg-indigo-100/70/10 dark:bg-white/10 rounded-3xl flex items-center justify-center text-3xl mb-8 group-hover:rotate-12 transition-transform">🏆</div>
              <h4 className="text-xl font-black mb-3">Examen Complet</h4>
              <p className="text-sm text-indigo-100 dark:text-indigo-200 font-medium leading-relaxed flex-1">Enchaînez les deux sections pour une simulation complète avec bulletin final.</p>
              <div className="mt-8 text-xs font-black text-white/50 dark:text-white/70 uppercase tracking-widest">12 minutes • Session réelle</div>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
