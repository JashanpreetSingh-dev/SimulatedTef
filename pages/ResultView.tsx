import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useLanguage } from '../contexts/LanguageContext';
import { DetailedResultView } from '../components/results';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { SavedResult } from '../types';
import { persistenceService } from '../services/persistence';

export function ResultView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { t } = useLanguage();
  const [result, setResult] = useState<SavedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) {
      setLoading(false);
      return;
    }

    // Fetch result by ID
    const fetchResult = async () => {
      try {
        // First check localStorage for recently saved results (faster and more reliable for new results)
        const localResults = persistenceService.getResultsSync();
        const localFound = localResults.find(r => r._id === id);
        if (localFound) {
          setResult(localFound);
          setLoading(false);
          return;
        }

        // If not in localStorage, try fetching from backend
        const results = await persistenceService.getAllResults(user.id, getToken);
        const found = results.find(r => r._id === id);
        if (found) {
          setResult(found);
        } else {
          setError('Result not found');
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch result:', err);
        setError('Failed to load result');
        setLoading(false);
      }
    };
    
    fetchResult();
  }, [id, user, getToken]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-800 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-500 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">{t('status.loading')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !result) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 p-4 md:p-8 transition-colors">
          <div className="max-w-7xl mx-auto">
            <button 
              onClick={() => navigate('/history')}
              className="mb-3 md:mb-6 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
            >
              ← {t('back.history')}
            </button>
            <div className="py-20 text-center">
              <p className="text-slate-500 dark:text-slate-400">{error || 'Result not found'}</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 p-4 md:p-8 transition-colors">
        <div className="max-w-7xl mx-auto">
          <DetailedResultView 
            result={result} 
            onBack={() => navigate(result.mockExamId ? `/mock-exam/${result.mockExamId}` : '/history')} 
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
