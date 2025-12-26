import React from 'react';

interface UpgradeWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentPack: {
    type: 'STARTER_PACK' | 'EXAM_READY_PACK';
    expiration: string;
    credits: {
      fullTests: { remaining: number };
      sectionA: { remaining: number };
      sectionB: { remaining: number };
    };
  };
  newPack: {
    type: 'STARTER_PACK' | 'EXAM_READY_PACK';
    name: string;
    credits: {
      fullTests: number;
      sectionA: number;
      sectionB: number;
    };
  };
}

export const UpgradeWarningModal: React.FC<UpgradeWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentPack,
  newPack,
}) => {
  if (!isOpen) return null;

  const getPackName = (type: 'STARTER_PACK' | 'EXAM_READY_PACK') => {
    return type === 'STARTER_PACK' ? 'Starter Pack' : 'Exam Ready Pack';
  };

  const getDaysRemaining = () => {
    const expirationDate = new Date(currentPack.expiration);
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining();

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
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Upgrade Pack</h2>
          <p className="text-slate-500 dark:text-slate-400">
            You have an active pack. Upgrading will replace it and unused credits will be lost.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Current Pack */}
          <div className="p-4 bg-indigo-100/70 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-2">Current Pack: {getPackName(currentPack.type)}</h3>
            <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
              <p>Days Remaining: {daysRemaining}</p>
              <p>Full Tests: {currentPack.credits.fullTests.remaining} remaining</p>
              <p>Section A: {currentPack.credits.sectionA.remaining} remaining</p>
              <p>Section B: {currentPack.credits.sectionB.remaining} remaining</p>
            </div>
          </div>

          {/* New Pack */}
          <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl border border-indigo-200 dark:border-indigo-700">
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-2">New Pack: {newPack.name}</h3>
            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <p>Full Tests: {newPack.credits.fullTests}</p>
              <p>Section A: {newPack.credits.sectionA}</p>
              <p>Section B: {newPack.credits.sectionB}</p>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="text-sm text-amber-800 dark:text-amber-300 font-semibold">
              ⚠️ Your current pack credits will be lost when you upgrade.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-6 bg-indigo-400 dark:bg-indigo-500 text-white dark:text-white rounded-lg text-sm font-semibold hover:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
          >
            Yes, Replace Pack
          </button>
        </div>
      </div>
    </div>
  );
};

