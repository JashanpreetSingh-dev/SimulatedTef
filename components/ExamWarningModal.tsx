import React from 'react';

interface ExamWarningModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  examType: 'full' | 'partA' | 'partB';
}

export const ExamWarningModal: React.FC<ExamWarningModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  examType,
}) => {
  if (!isOpen) return null;

  const getExamName = () => {
    if (examType === 'full') return 'Examen Complet';
    if (examType === 'partA') return 'Section A';
    return 'Section B';
  };

  const getTimeLimit = () => {
    if (examType === 'full') return '12 minutes (4 min Partie A + 8 min Partie B)';
    if (examType === 'partA') return '4 minutes';
    return '8 minutes';
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        // Prevent closing on backdrop click
        e.stopPropagation();
      }}
    >
      <div 
        className="bg-indigo-100/70 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl transition-colors"
        onClick={(e) => {
          // Prevent closing when clicking inside the modal
          e.stopPropagation();
        }}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/50 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto">
            ⚠️
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Prêt à commencer ?</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Vous êtes sur le point de commencer le {getExamName()}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-indigo-100/70 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-2">Informations importantes</h3>
            <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <p>• Durée: {getTimeLimit()}</p>
              <p>• L'utilisation sera comptée lorsque vous cliquerez sur le bouton micro</p>
              <p>• Assurez-vous d'avoir un environnement calme</p>
              <p>• Votre microphone sera utilisé pour l'enregistrement</p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="text-sm text-amber-800 dark:text-amber-300 font-semibold">
              ⚠️ Une fois que vous cliquez sur "Commencer", l'utilisation sera comptée dès que vous activez le micro.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-6 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-6 bg-indigo-400 dark:bg-indigo-500 text-white dark:text-white rounded-lg text-sm font-semibold hover:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
          >
            Commencer
          </button>
        </div>
      </div>
    </div>
  );
};

