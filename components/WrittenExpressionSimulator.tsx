
import React, { useState, useEffect } from 'react';
import { WrittenTask, EvaluationResult } from '../types';
import { geminiService } from '../services/gemini';

interface Props {
  task: WrittenTask;
  onFinish: (result: EvaluationResult, text: string) => void;
}

export const WrittenExpressionSimulator: React.FC<Props> = ({ task, onFinish }) => {
  const [text, setText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(task.section === 'A' ? 10 * 60 : 45 * 60);

  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinish = async () => {
    if (wordCount < task.minWords * 0.7) {
      alert(`Votre texte est trop court (${wordCount} mots). Le minimum conseillé est de ${task.minWords} mots.`);
      return;
    }

    setIsEvaluating(true);
    try {
      const result = await geminiService.evaluateResponse(
        'WrittenExpression',
        `Sujet Section ${task.section}: ${task.subject}\nConsigne: ${task.instruction}`,
        text
      );
      onFinish(result, text);
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de l'évaluation.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      {/* Task Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-sm h-fit sticky top-24">
        <div className="flex items-center justify-between mb-8">
          <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
            Expression Écrite - Section {task.section}
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
            {formatTime(timeLeft)}
          </div>
        </div>

        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
          {task.subject}
        </h3>
        
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
          "{task.instruction}"
        </div>

        <div className="mt-10 space-y-4">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>Objectif mots</span>
            <span>{wordCount} / {task.minWords}</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${wordCount >= task.minWords ? 'bg-emerald-500' : 'bg-indigo-500'}`}
              style={{ width: `${Math.min((wordCount / task.minWords) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Editor Panel */}
      <div className="flex flex-col gap-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Commencez à rédiger ici..."
          className="w-full h-[500px] p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 text-lg leading-relaxed text-slate-900 dark:text-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
        />

        <button
          onClick={handleFinish}
          disabled={isEvaluating || text.length < 50}
          className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50 disabled:grayscale"
        >
          {isEvaluating ? (
            <span className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Évaluation en cours...
            </span>
          ) : "Soumettre ma rédaction"}
        </button>
      </div>
    </div>
  );
};
