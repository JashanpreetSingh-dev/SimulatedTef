import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useBatches } from '../hooks/useBatches';
import { BatchCard } from '../components/batches/BatchCard';
import { CreateBatchModal } from '../components/batches/CreateBatchModal';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '@clerk/clerk-react';
import { batchService } from '../services/batchService';
import { ConfirmationModal } from '../components/common/ConfirmationModal';

export function BatchesView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { getToken } = useAuth();
  const { batches, loading, fetchBatches, deleteBatch, createBatch: createBatchFn } = useBatches();
  const [assignmentCounts, setAssignmentCounts] = useState<Record<string, number>>({});
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; batchId: string | null }>({ isOpen: false, batchId: null });
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Fetch assignment counts for each batch
  useEffect(() => {
    const fetchCounts = async () => {
      const counts: Record<string, number> = {};
      const getTokenWrapper = async () => getToken();
      
      for (const batch of batches) {
        try {
          const batchAssignments = await batchService.getBatchAssignments(batch.batchId, getTokenWrapper);
          counts[batch.batchId] = batchAssignments.length;
        } catch (err) {
          counts[batch.batchId] = 0;
        }
      }
      setAssignmentCounts(counts);
    };

    if (batches.length > 0) {
      fetchCounts();
    }
  }, [batches, getToken]);

  const handleDelete = async (batchId: string) => {
    try {
      await deleteBatch(batchId);
    } catch (err: any) {
      console.error('Failed to delete batch:', err);
      alert(err.message || 'Failed to delete batch. Please try again.');
    }
  };

  const handleCreateBatch = async (name: string) => {
    try {
      const batch = await createBatchFn(name);
      navigate(`/dashboard/batches/${batch.batchId}`);
    } catch (err: any) {
      console.error('Failed to create batch:', err);
      alert(err.message || 'Failed to create batch. Please try again.');
      throw err;
    }
  };

  if (loading && batches.length === 0) {
    return (
      <DashboardLayout>
        <main className="max-w-5xl mx-auto p-4 md:p-6 lg:p-10 space-y-6 md:space-y-8 lg:space-y-12">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="mt-4 text-slate-500 dark:text-slate-400">{t('batches.loadingBatches')}</p>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-4 md:p-6 lg:p-10 space-y-6 md:space-y-8 lg:space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2 md:space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
            >
              ← Dashboard
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t('batches.myBatches')}
            </h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
              {t('batches.subtitle')}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-3 sm:px-6 sm:py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap"
          >
            + {t('batches.createBatch')}
          </button>
        </div>

        {batches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {t('batches.noBatches')}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors"
            >
              {t('batches.createBatch')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {batches.map((batch) => (
              <BatchCard
                key={batch.batchId}
                batch={batch}
                assignmentCount={assignmentCounts[batch.batchId] || 0}
                onDelete={(batchId) => setDeleteModal({ isOpen: true, batchId })}
              />
            ))}
          </div>
        )}

        <CreateBatchModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateBatch}
        />

        <ConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, batchId: null })}
          onConfirm={() => {
            if (deleteModal.batchId) {
              handleDelete(deleteModal.batchId);
            }
          }}
          title={t('batches.deleteBatch')}
          message={t('batches.deleteConfirm')}
          confirmText={t('batches.delete')}
          cancelText={t('batches.cancel')}
          confirmButtonStyle="danger"
        />
      </main>
    </DashboardLayout>
  );
}