import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser, useClerk, useAuth } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { OralExpressionLive } from './components/OralExpressionLive';
import { HistoryList } from './components/HistoryList';
import { DetailedResultView } from './components/DetailedResultView';
import { LoadingResult } from './components/LoadingResult';
import { SavedResult } from './types';
import { getRandomTasks, getTaskById } from './services/tasks';
import { persistenceService } from './services/persistence';

const PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />
      <div className="z-10 text-center space-y-8 max-w-2xl">
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">
            TEF <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Master</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium">
            Your AI-powered companion for the TEF Canada exam.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <SignInButton mode="modal">
            <button className="px-8 py-3 rounded-full bg-white text-slate-900 font-bold hover:bg-indigo-50 transition-all transform hover:scale-105">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="px-8 py-3 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/25">
              Get Started
            </button>
          </SignUpButton>
        </div>
      </div>
    </div>
  );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <span 
            className="font-black text-xl text-slate-900 dark:text-white cursor-pointer" 
            onClick={() => navigate('/dashboard')}
          >
            TEF Master
          </span>
          <div className="hidden md:flex gap-4 text-sm font-bold">
            <button 
              onClick={() => navigate('/dashboard')}
              className={isActive('/dashboard') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}>
              Dashboard
            </button>
            <button 
              onClick={() => navigate('/history')}
              className={isActive('/history') ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}>
              History
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => signOut()}
            className="text-sm font-bold text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
          >
            Sign Out
          </button>
          <UserButton />
        </div>
      </nav>
      {children}
    </div>
  );
}

function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();

  const startExam = (mode: 'partA' | 'partB' | 'full') => {
    navigate(`/exam/${mode}`);
  };

  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-6 md:p-12 space-y-12">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Bonjour, {user?.firstName}!</h2>
          <p className="text-slate-500 dark:text-slate-400">Ready to practice your oral expression today?</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => startExam('partA')}>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">📞</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Section A</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Posez des questions pour obtenir des informations. (4 min)
            </p>
            <div className="mt-6 flex items-center text-blue-600 dark:text-blue-400 font-bold text-sm">
              Commencer <span className="ml-2">→</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => startExam('partB')}>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">🤝</div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Section B</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Argumentez pour convaincre un ami. (8 min)
            </p>
            <div className="mt-6 flex items-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              Commencer <span className="ml-2">→</span>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-3xl p-8 shadow-lg hover:shadow-xl hover:shadow-indigo-600/20 transition-all group cursor-pointer" onClick={() => startExam('full')}>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:rotate-12 transition-transform">🏆</div>
            <h3 className="text-xl font-bold text-white mb-2">Examen Complet</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Enchaînez les deux sections pour une simulation réelle. (12 min)
            </p>
            <div className="mt-6 flex items-center text-white font-bold text-sm">
              Commencer <span className="ml-2">→</span>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}

function HistoryView() {
  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-6 md:p-12 space-y-12">
        <HistoryList />
      </main>
    </DashboardLayout>
  );
}

function ResultView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { getToken } = useAuth();
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
        const token = await getToken();
        const results = await persistenceService.getAllResults(user.id, token);
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
        <LoadingResult />
      </DashboardLayout>
    );
  }

  if (error || !result) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
          <div className="max-w-7xl mx-auto py-20 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4">{error || 'Result not found'}</p>
            <button 
              onClick={() => navigate('/history')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-colors"
            >
              Back to History
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <DetailedResultView 
            result={result} 
            onBack={() => navigate('/history')} 
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function ExamView() {
  const { mode } = useParams<{ mode: 'partA' | 'partB' | 'full' }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { getToken } = useAuth();
  const [scenario, setScenario] = useState<any>(null);

  useEffect(() => {
    if (!mode || !['partA', 'partB', 'full'].includes(mode)) {
      navigate('/dashboard');
      return;
    }

    // Check if scenario was passed via location state (for retakes)
    if (location.state?.scenario) {
      setScenario(location.state.scenario);
    } else {
      // Generate new scenario, excluding completed tasks
      const loadCompletedTaskIds = async () => {
        try {
          const token = await getToken();
          const results = await persistenceService.getAllResults(user?.id || 'guest', token);
          // Extract completed task IDs from results
          const completedIds: number[] = [];
          results.forEach(result => {
            if (result.taskPartA?.id) completedIds.push(result.taskPartA.id);
            if (result.taskPartB?.id) completedIds.push(result.taskPartB.id);
          });
          
          // Get random tasks excluding completed ones
          const { partA, partB } = getRandomTasks(completedIds);
          setScenario({
            title: mode === 'full' ? "Entraînement Complet" : (mode === 'partA' ? "Section A" : "Section B"),
            mode: mode,
            officialTasks: {
              partA,
              partB
            }
          });
        } catch (error) {
          console.error('Error loading completed tasks:', error);
          // Fallback to random selection without filtering
          const { partA, partB } = getRandomTasks();
          setScenario({
            title: mode === 'full' ? "Entraînement Complet" : (mode === 'partA' ? "Section A" : "Section B"),
            mode: mode,
            officialTasks: {
              partA,
              partB
            }
          });
        }
      };
      
      loadCompletedTaskIds();
    }
  }, [mode, location.state, navigate, user]);

  const handleFinish = async (savedResult: SavedResult) => {
    // Navigate to result view with the saved result ID
    if (savedResult._id) {
      navigate(`/results/${savedResult._id}`);
    } else {
      // Fallback to history if no ID
      navigate('/history');
    }
  };

  if (!scenario) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
          <div className="max-w-7xl mx-auto py-20 text-center animate-pulse text-slate-400">
            Loading exam...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={() => navigate('/dashboard')}
            className="mb-6 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
          >
            ← Back to Dashboard
          </button>
          <OralExpressionLive scenario={scenario} onFinish={handleFinish} />
        </div>
      </div>
    </DashboardLayout>
  );
}

function ProtectedRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/history" element={<HistoryView />} />
      <Route path="/results/:id" element={<ResultView />} />
      <Route path="/exam/:mode" element={<ExamView />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// Custom Clerk theme matching app's indigo/slate design
const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: '#6366f1', // indigo-500
    colorBackground: '#0f172a', // slate-900
    colorInputBackground: '#1e293b', // slate-800
    colorInputText: '#f1f5f9', // slate-100
    colorText: '#f8fafc', // slate-50
    colorTextSecondary: '#cbd5e1', // slate-300
    borderRadius: '1rem',
    fontFamily: 'Inter, sans-serif',
  },
  elements: {
    rootBox: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    },
    card: {
      borderRadius: '2rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(30, 41, 59, 0.8)', // slate-800
      backgroundColor: '#0f172a', // slate-900
    },
    headerTitle: {
      fontWeight: '900',
      letterSpacing: '-0.025em',
      color: '#f8fafc', // slate-50
      fontSize: '1.5rem',
    },
    headerSubtitle: {
      color: '#94a3b8', // slate-400
      fontSize: '0.875rem',
    },
    socialButtonsBlockButton: {
      borderRadius: '1rem',
      border: '1px solid rgba(30, 41, 59, 0.5)',
      backgroundColor: '#1e293b', // slate-800
      color: '#f8fafc', // slate-50
      '&:hover': {
        backgroundColor: '#334155', // slate-700
      },
    },
    formButtonPrimary: {
      borderRadius: '1rem',
      textTransform: 'uppercase',
      fontWeight: '800',
      letterSpacing: '0.05em',
      fontSize: '0.75rem',
      backgroundColor: '#6366f1', // indigo-500
      color: '#ffffff',
      '&:hover': {
        backgroundColor: '#4f46e5', // indigo-600
      },
    },
    formFieldInput: {
      borderRadius: '0.75rem',
      backgroundColor: '#1e293b', // slate-800
      border: '1px solid rgba(30, 41, 59, 0.5)',
      color: '#f1f5f9', // slate-100
      '&:focus': {
        borderColor: '#6366f1', // indigo-500
        boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
      },
    },
    formFieldLabel: {
      color: '#cbd5e1', // slate-300
      fontWeight: '600',
      fontSize: '0.875rem',
    },
    footerActionLink: {
      color: '#818cf8', // indigo-400
      fontWeight: '600',
      '&:hover': {
        color: '#6366f1', // indigo-500
      },
    },
    identityPreviewText: {
      color: '#f8fafc', // slate-50
    },
    identityPreviewEditButton: {
      color: '#818cf8', // indigo-400
    },
    alertText: {
      color: '#cbd5e1', // slate-300
    },
    dividerLine: {
      backgroundColor: 'rgba(30, 41, 59, 0.5)',
    },
    dividerText: {
      color: '#94a3b8', // slate-400
    },
  },
};

function App() {
  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={clerkAppearance}
    >
      <BrowserRouter>
        <SignedOut>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SignedOut>
        <SignedIn>
          <ProtectedRoutes />
        </SignedIn>
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;
