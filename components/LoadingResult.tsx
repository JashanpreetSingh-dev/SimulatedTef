import React from 'react';

export const LoadingResult: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-12 shadow-xl text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
            Analyse en cours...
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Évaluation de votre performance
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
            <span>Analyse de la transcription</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <span>Traitement de l'enregistrement audio</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <span>Génération du rapport détaillé</span>
          </div>
        </div>
      </div>
    </div>
  );
};

