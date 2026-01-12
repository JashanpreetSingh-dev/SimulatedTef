import React, { useState, useEffect } from 'react';
import { useScrollAnimation } from '../utils/animations';

export const ExamInterfaceShowcase: React.FC = () => {
  const [ref, isVisible] = useScrollAnimation();
  const [oralTimeLeft, setOralTimeLeft] = useState(240);
  const [writtenTimeLeft, setWrittenTimeLeft] = useState(1500);
  const [oralStatus, setOralStatus] = useState<'idle' | 'active'>('idle');
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [writtenText, setWrittenText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentOralPart, setCurrentOralPart] = useState<'A' | 'B'>('A');

  const sampleEssay = "Madame, Monsieur,\n\nJe vous écris pour vous faire part de mon intérêt pour le poste de responsable marketing que vous avez publié récemment.\n\nFort de mes cinq années d'expérience dans le domaine du marketing digital, je suis convaincu que mes compétences correspondent parfaitement aux exigences du poste...";

  // Oral timer countdown
  useEffect(() => {
    if (!isVisible || oralStatus !== 'active' || oralTimeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setOralTimeLeft((prev) => {
        if (prev <= 1) {
          setOralStatus('idle');
          return 240;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, oralStatus, oralTimeLeft]);

  // Written timer countdown
  useEffect(() => {
    if (!isVisible || !isTyping || writtenTimeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setWrittenTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, isTyping, writtenTimeLeft]);

  // Simulate speaking animations with thinking state
  useEffect(() => {
    if (oralStatus !== 'active') return;
    
    const interval = setInterval(() => {
      setIsModelSpeaking((prevModel) => {
        if (prevModel) {
          // Model stops speaking, user starts
          setIsUserSpeaking(true);
          setIsAiThinking(false);
          return false;
        } else {
          setIsUserSpeaking((prevUser) => {
            if (prevUser) {
              // User stops speaking, AI thinks
              setIsAiThinking(true);
              setTimeout(() => {
                setIsAiThinking(false);
                setIsModelSpeaking(true);
              }, 1500);
              return false;
            }
            return true;
          });
          return false;
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [oralStatus]);

  // Simulate typing animation
  useEffect(() => {
    if (!isTyping || writtenText.length >= sampleEssay.length) return;
    
    const timeout = setTimeout(() => {
      setWrittenText(sampleEssay.slice(0, writtenText.length + 1));
    }, 50);

    return () => clearTimeout(timeout);
  }, [isTyping, writtenText]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const wordCount = writtenText.trim().split(/\s+/).filter(Boolean).length;

  const handleStartOralDemo = () => {
    setOralStatus('active');
    setOralTimeLeft(240);
    setIsModelSpeaking(true);
  };

  const handleStopOralDemo = () => {
    setOralStatus('idle');
    setOralTimeLeft(240);
    setIsUserSpeaking(false);
    setIsModelSpeaking(false);
    setIsAiThinking(false);
  };

  const handleStartWrittenDemo = () => {
    setIsTyping(true);
    setWrittenText('');
    setWrittenTimeLeft(1500);
  };

  const handleStopWrittenDemo = () => {
    setIsTyping(false);
  };

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`relative py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-12 xl:px-16 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 dark:text-slate-100 mb-4 sm:mb-6 leading-[1.1] tracking-[-0.02em]">
            AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">Expression Evaluation</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-[1.6]">
            Both Oral and Written Expression modules are evaluated by AI using the official CCI Paris framework.
          </p>
        </div>

        {/* Two Column Grid: Oral + Written */}
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
          
          {/* Oral Expression Card - Matches OralExpressionLive */}
          <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
            {/* Top Bar with Part badges and Timer - matching actual component */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <div className="flex gap-2">
                <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                  currentOralPart === 'A' 
                    ? 'bg-indigo-400 dark:bg-indigo-500 border-indigo-400 dark:border-indigo-500 text-white shadow-lg' 
                    : 'bg-indigo-100/70 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'
                }`}>
                  Partie A
                </div>
                <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                  currentOralPart === 'B' 
                    ? 'bg-indigo-400 dark:bg-indigo-500 border-indigo-400 dark:border-indigo-500 text-white shadow-lg' 
                    : 'bg-indigo-100/70 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'
                }`}>
                  Partie B
                </div>
              </div>
              <div className="flex items-center gap-2">
                {oralStatus === 'active' && oralTimeLeft > 0 && (
                  <div className={`px-4 py-1.5 rounded-xl text-sm font-black tabular-nums transition-all ${
                    oralTimeLeft <= 60 
                      ? 'bg-rose-300 dark:bg-rose-500 text-white shadow-lg shadow-rose-300/30 animate-pulse' 
                      : oralTimeLeft <= 120
                      ? 'bg-amber-300 dark:bg-amber-500 text-white shadow-lg shadow-amber-300/30'
                      : 'bg-indigo-400 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-400/30'
                  }`}>
                    {formatTime(oralTimeLeft)}
                  </div>
                )}
                {oralStatus === 'active' && (
                  <div className="text-[9px] font-black text-rose-400 dark:text-rose-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                    LIVE
                  </div>
                )}
              </div>
            </div>

            {/* Two Column Layout: Document + Mic - matching actual component */}
            <div className="grid md:grid-cols-2 gap-4 p-4">
              {/* Task Document Card */}
              <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-700 px-4 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-600">
                  <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Document #EO1</span>
                  <span className="text-slate-600 dark:text-slate-400 text-[10px]">🔍</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl mb-1">📋</div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">Document Officiel</p>
                    </div>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 text-[10px] leading-relaxed text-slate-600 dark:text-slate-300 italic">
                    <strong className="text-slate-800 dark:text-slate-100 not-italic block mb-1">Consigne :</strong>
                    Vous téléphonez pour avoir des informations...
                  </div>
                </div>
              </div>

              {/* Mic Section - matching actual indigo background */}
              <div className="bg-indigo-400 dark:bg-indigo-500 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-xl min-h-[200px]">
                <div className={`absolute inset-0 opacity-10 pointer-events-none transition-all duration-1000 ${
                  isModelSpeaking ? 'bg-indigo-300' : isAiThinking ? 'bg-amber-300 animate-pulse' : (isUserSpeaking ? 'bg-emerald-300' : 'bg-transparent')
                }`} />
                
                <div className="relative mb-4">
                  <div className={`absolute inset-0 rounded-full blur-[40px] transition-all duration-700 ${
                    isModelSpeaking ? 'bg-indigo-300/40 scale-150' : (isUserSpeaking ? 'bg-emerald-300/40 scale-125' : 'bg-transparent scale-100')
                  }`} />
                  <button
                    onClick={oralStatus === 'active' ? handleStopOralDemo : handleStartOralDemo}
                    className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-500 ring-6 relative z-10 ${
                      oralStatus === 'active'
                        ? 'bg-rose-400 hover:bg-rose-500 ring-rose-300/20 active:scale-90'
                        : 'bg-white/90 hover:bg-white ring-white/10 text-slate-800 hover:scale-105 active:scale-95'
                    }`}
                  >
                    <span className="text-2xl mb-0.5">{oralStatus === 'active' ? '⏹' : '🎙'}</span>
                    <span className="text-[7px] font-black uppercase tracking-[0.3em]">
                      {oralStatus === 'active' ? 'Stop' : 'Start'}
                    </span>
                  </button>
                </div>

                <div className="text-center z-10">
                  <h4 className="text-white font-black text-sm tracking-tight">
                    {oralStatus === 'active' 
                      ? (isModelSpeaking ? "L'examinateur répond..." : isAiThinking ? "L'examinateur réfléchit..." : 'À vous de parler')
                      : 'Prêt pour l\'épreuve ?'}
                  </h4>
                  <p className="text-indigo-100 text-[8px] uppercase font-black tracking-[0.3em] mt-1">TEF AI Simulator</p>
                </div>
              </div>
            </div>
          </div>

          {/* Written Expression Card - Matches WrittenExpressionEditor */}
          <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
            {/* Header with step indicator and timer - matching actual component */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <div className="flex items-center gap-3">
                {/* Step indicator dots */}
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 dark:bg-indigo-500" />
                  <div className="w-6 h-0.5 bg-slate-300 dark:bg-slate-600" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Section A</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{wordCount} mots</span>
                <div className={`px-3 py-1 rounded-lg text-sm font-bold tabular-nums ${
                  isTyping 
                    ? 'bg-indigo-400 dark:bg-indigo-500 text-white' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {formatTime(writtenTimeLeft)}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Task description - matching actual component header */}
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-700/50">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✍️</span>
                  <div>
                    <p className="text-amber-800 dark:text-amber-200 font-bold text-sm mb-1">Section A - Article de blog</p>
                    <p className="text-amber-700 dark:text-amber-300 text-xs leading-relaxed">
                      Écrivez un article pour le blog de votre entreprise sur l'importance du télétravail...
                    </p>
                  </div>
                </div>
              </div>

              {/* French Accent Bar - matching actual component */}
              <div className="flex items-center gap-1 flex-wrap">
                {['é', 'è', 'ê', 'ë', 'à', 'â', 'ù', 'û', 'ô', 'î', 'ï', 'ç', 'œ', '«', '»'].map((char) => (
                  <button
                    key={char}
                    className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors"
                  >
                    {char}
                  </button>
                ))}
              </div>

              {/* Text Editor - matching actual textarea style */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-300 dark:border-slate-600 overflow-hidden focus-within:border-indigo-400 dark:focus-within:border-indigo-500 transition-colors">
                <div className="p-4 min-h-[160px]">
                  <p className="text-slate-800 dark:text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                    {writtenText || <span className="text-slate-400 dark:text-slate-500 italic">Commencez à écrire votre réponse...</span>}
                    {isTyping && <span className="inline-block w-0.5 h-4 bg-indigo-500 ml-0.5 animate-pulse" />}
                  </p>
                </div>
              </div>

              {/* Submit Button - matching actual component */}
              <button
                onClick={isTyping ? handleStopWrittenDemo : handleStartWrittenDemo}
                className={`w-full py-3 rounded-lg font-semibold text-xs uppercase tracking-wide transition-all shadow-md ${
                  isTyping
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'bg-indigo-500 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-700 text-white'
                }`}
              >
                {isTyping ? '⏹ Arrêter la démo' : '✨ Lancer la démo'}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom notice */}
        <div className="mt-8 text-center">
          <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 inline-flex items-center gap-2">
            <span className="text-amber-600 dark:text-amber-400 text-sm">ℹ️</span>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium">
              This is a demo preview. Sign up to access full AI evaluation with detailed feedback.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
