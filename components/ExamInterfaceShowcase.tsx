import React, { useState, useEffect } from 'react';
import { useScrollAnimation } from '../utils/animations';

export const ExamInterfaceShowcase: React.FC = () => {
  const [ref, isVisible] = useScrollAnimation();
  const [timeLeft, setTimeLeft] = useState(240);
  const [status, setStatus] = useState<'idle' | 'active'>('idle');
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [currentPart, setCurrentPart] = useState<'A' | 'B'>('A');

  // Animated timer countdown
  useEffect(() => {
    if (!isVisible || status !== 'active' || timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus('idle');
          return 240;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, status, timeLeft]);

  // Simulate speaking animations
  useEffect(() => {
    if (status !== 'active') return;
    
    const interval = setInterval(() => {
      setIsModelSpeaking((prev) => {
        if (prev) {
          setIsUserSpeaking(true);
          return false;
        } else {
          setIsUserSpeaking((prev) => {
            if (prev) {
              return false;
            }
            return true;
          });
          return true;
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartDemo = () => {
    setStatus('active');
    setTimeLeft(240);
    setIsModelSpeaking(true);
  };

  const handleStopDemo = () => {
    setStatus('idle');
    setTimeLeft(240);
    setIsUserSpeaking(false);
    setIsModelSpeaking(false);
  };

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-12 xl:px-16 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 dark:text-slate-100 mb-4 sm:mb-6 leading-[1.1] tracking-[-0.02em]">
            Real-time conversation <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">adhering to TEF Canada standards</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-[1.6] mb-3">
            Practice with official exam scenarios and get instant AI evaluation based on the CCI Paris framework.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/20 rounded-xl px-4 py-2.5 inline-flex items-center gap-2 max-w-2xl mx-auto">
            <span className="text-amber-600 dark:text-amber-400 text-sm">ℹ️</span>
            <p className="text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-medium">
              This is a demo preview. Sign up to access the full exam simulator with real AI evaluation.
            </p>
          </div>
        </div>

        {/* Mock Exam Interface - Matching OralExpressionLive structure */}
        <div className="space-y-3 md:space-y-6">
          {/* Demo Notice */}
          <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 flex items-center justify-center gap-2">
            <span className="text-amber-600 dark:text-amber-400 text-sm">ℹ️</span>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium">
              This is an interactive demo preview. The controls below are for demonstration only. Sign up to access the full exam simulator.
            </p>
          </div>
          
          {/* Top Bar with Part badges and Timer */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-2">
              <div className={`px-3 md:px-5 py-1.5 md:py-2.5 rounded-xl md:rounded-[1.25rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border ${
                currentPart === 'A' ? 'bg-indigo-400 dark:bg-indigo-500 border-indigo-400 dark:border-indigo-500 text-white shadow-lg' : 'bg-indigo-100/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}>
                Partie A
              </div>
              <div className={`px-3 md:px-5 py-1.5 md:py-2.5 rounded-xl md:rounded-[1.25rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border ${
                currentPart === 'B' ? 'bg-indigo-400 dark:bg-indigo-500 border-indigo-400 dark:border-indigo-500 text-white shadow-lg' : 'bg-indigo-100/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}>
                Partie B
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              {status === 'active' && timeLeft > 0 && (
                <div className={`px-4 md:px-6 py-1.5 md:py-2.5 rounded-xl md:rounded-[1.25rem] text-base md:text-lg font-black tabular-nums transition-all ${
                  timeLeft <= 60 
                    ? 'bg-rose-300 dark:bg-rose-600 text-white shadow-lg shadow-rose-300/30 dark:shadow-rose-600/30 animate-pulse' 
                    : timeLeft <= 120
                    ? 'bg-amber-300 dark:bg-amber-600 text-white shadow-lg shadow-amber-300/30 dark:shadow-amber-600/30'
                    : 'bg-indigo-400 dark:bg-indigo-600 text-white shadow-lg shadow-indigo-400/30 dark:shadow-indigo-600/30'
                }`}>
                  {formatTime(timeLeft)}
                </div>
              )}
              {status === 'active' && (
                <div className="text-[9px] md:text-[10px] font-black text-rose-300 dark:text-rose-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-rose-300 dark:bg-rose-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" /> 
                  LIVE
                </div>
              )}
            </div>
          </div>

          {/* Two Column Grid: Task Document + Mic Section */}
          <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
            {/* Task Document Card */}
            <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-[300px] md:h-[400px] transition-colors">
              <div className="bg-slate-100 dark:bg-slate-700 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-600">
                <span className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Document #1</span>
                <button className="text-slate-600 dark:text-slate-300 hover:text-indigo-400 dark:hover:text-indigo-300 transition-colors text-xs font-bold flex items-center gap-1">
                  <span>🔍</span> <span className="hidden sm:inline">Agrandir</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-indigo-100/70 dark:bg-slate-800/50 relative group scrollbar-hide">
                <div className="bg-slate-100 dark:bg-slate-700 rounded-xl md:rounded-2xl p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center min-h-[200px] mb-4 md:mb-8">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Document Officiel</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">(Preview de l'interface d'examen)</p>
                  </div>
                </div>
                <div className="mt-4 md:mt-8 p-4 md:p-6 bg-indigo-100/70 dark:bg-slate-700/50 backdrop-blur rounded-xl md:rounded-[2rem] border border-slate-200 dark:border-slate-600 text-[10px] md:text-xs leading-relaxed text-slate-600 dark:text-slate-300 italic shadow-sm">
                  <strong className="text-slate-800 dark:text-slate-100 not-italic block mb-1">Consigne :</strong> 
                  Vous avez lu cette annonce et vous êtes intéressé(e). Vous téléphonez pour avoir plus d'informations.
                </div>
              </div>
            </div>

            {/* Mic Section */}
            <div className="bg-indigo-400 dark:bg-indigo-600 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 md:gap-0 md:space-y-8 relative overflow-hidden shadow-2xl transition-colors">
              <div className={`absolute inset-0 opacity-10 pointer-events-none transition-all duration-1000 ${
                isModelSpeaking ? 'bg-indigo-300 dark:bg-indigo-500' : (isUserSpeaking ? 'bg-emerald-300 dark:bg-emerald-500' : 'bg-transparent')
              }`} />
              
              <div className="relative group flex-shrink-0">
                <div className={`absolute inset-0 rounded-full blur-[60px] transition-all duration-700 ${
                  isModelSpeaking ? 'bg-indigo-300/40 dark:bg-indigo-500/40 scale-150' : (isUserSpeaking ? 'bg-emerald-300/40 dark:bg-emerald-500/40 scale-125' : 'bg-indigo-100/70/5 dark:bg-slate-700/5 scale-100')
                }`} />
                <button
                  onClick={status === 'active' ? handleStopDemo : handleStartDemo}
                  className={`w-24 h-24 md:w-36 md:h-36 rounded-full flex flex-col items-center justify-center transition-all duration-500 ring-4 md:ring-12 relative z-10 ${
                    status === 'active' 
                      ? 'bg-rose-300 dark:bg-rose-600 hover:bg-rose-400 dark:hover:bg-rose-700 ring-rose-300/20 dark:ring-rose-600/20 active:scale-90' 
                      : 'bg-indigo-100/70 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-slate-600 ring-white/10 dark:ring-white/10 text-slate-800 dark:text-slate-100 hover:scale-105 active:scale-95'
                  }`}
                >
                  <span className="text-2xl md:text-4xl mb-0.5 md:mb-1">{status === 'active' ? '⏹' : '🎙'}</span>
                  <span className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.3em]">
                    {status === 'active' ? 'Arrêter' : 'Start'}
                  </span>
                </button>
              </div>

              <div className="text-left md:text-center space-y-1 md:space-y-2 z-10 flex-1 md:flex-none">
                <h4 className="text-white dark:text-slate-100 font-black text-sm md:text-xl tracking-tight">
                  {status === 'active' ? (isModelSpeaking ? 'L\'examinateur répond...' : 'À vous de parler') : 'Prêt pour l\'épreuve ?'}
                </h4>
                <p className="text-indigo-100 dark:text-indigo-200 text-[7px] md:text-[9px] uppercase font-black tracking-[0.4em]">TEF AI Master Simulator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
