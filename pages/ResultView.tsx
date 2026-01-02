import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useLanguage } from '../contexts/LanguageContext';
import { DetailedResultView } from '../components/results';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { SavedResult } from '../types';
import { persistenceService } from '../services/persistence';
import { authenticatedFetchJSON } from '../services/authenticatedFetch';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

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
        // Always fetch from backend with populated tasks to ensure task data is available
        // This ensures the subject and other task details are displayed correctly
        try {
          const fetchedResult = await authenticatedFetchJSON<SavedResult>(
            `${BACKEND_URL}/api/results/detail/${id}?populateTasks=true`,
            {
              method: 'GET',
              getToken,
            }
          );
          
          setResult(fetchedResult);
          
          // Also update localStorage with the populated result for faster access next time
          const localResults = persistenceService.getResultsSync();
          const index = localResults.findIndex(r => r._id === id);
          if (index !== -1) {
            localResults[index] = fetchedResult;
            localStorage.setItem('tef_results', JSON.stringify(localResults));
          }
          setLoading(false);
        } catch (fetchError: any) {
          // If backend fetch fails, fallback to localStorage
          if (fetchError?.status === 404) {
            setError('Result not found');
          } else {
            console.warn('Backend fetch failed, trying localStorage:', fetchError);
            const localResults = persistenceService.getResultsSync();
            const localFound = localResults.find(r => r._id === id);
            if (localFound) {
              setResult(localFound);
            } else {
              setError('Failed to load result');
            }
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch result:', err);
        // Final fallback to localStorage on error
        const localResults = persistenceService.getResultsSync();
        const localFound = localResults.find(r => r._id === id);
        if (localFound) {
          setResult(localFound);
        } else {
          setError('Failed to load result');
        }
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
            onBack={() => {
              if (result.mockExamId) {
                navigate(`/mock-exam/${result.mockExamId}`);
              } else if (result.module === 'writtenExpression' || result.module === 'oralExpression') {
                // Navigate back to practice, preserving module selection
                const module = result.module === 'writtenExpression' ? 'written' : 'oral';
                sessionStorage.setItem('practice_selected_module', module);
                navigate('/practice');
              } else {
                navigate('/history');
              }
            }} 
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
