import React from 'react';

interface ModuleLoadingScreenProps {
  moduleName?: string;
}

export const ModuleLoadingScreen: React.FC<ModuleLoadingScreenProps> = ({ moduleName }) => {
  const getModuleDisplayName = (module?: string) => {
    switch (module) {
      case 'reading':
        return 'Compréhension Écrite';
      case 'listening':
        return 'Compréhension Orale';
      case 'oralExpression':
        return 'Expression Orale';
      default:
        return 'Module';
    }
  };

  return (
    <div className="min-h-screen bg-indigo-100/70 dark:bg-slate-900 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 p-12 shadow-xl">
        <div className="mb-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
            Chargement du module...
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Préparation de {getModuleDisplayName(moduleName)}
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 dark:bg-slate-700/50 border-2 border-indigo-100 dark:border-slate-600">
            <div className="w-6 h-6 rounded-full bg-indigo-400 dark:bg-indigo-500 flex items-center justify-center flex-shrink-0 animate-pulse">
              <div className="w-2 h-2 bg-indigo-100/70 rounded-full"></div>
            </div>
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex-1">
              Préparation des tâches
            </span>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border-2 border-transparent opacity-60">
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0"></div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex-1">
              Initialisation de l'examen
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
