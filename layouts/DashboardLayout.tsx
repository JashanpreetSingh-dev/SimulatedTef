import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser, useClerk, UserButton } from '@clerk/clerk-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../hooks/useSubscription';
import { Footer } from '../components/Footer';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { status } = useSubscription();

  const isActive = (path: string) => location.pathname === path;

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const getSubscriptionBadge = () => {
    if (!status) return null;
    
    // Show pack badge if active, otherwise show subscription type
    if (status.packType && status.packExpirationDate && new Date(status.packExpirationDate) > new Date()) {
      const packName = status.packType === 'STARTER_PACK' ? 'Starter Pack' : 'Exam Ready Pack';
      return (
        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-300/20 text-indigo-400">
          {packName}
        </span>
      );
    }

    const badges: Record<string, { text: string; color: string }> = {
      'TRIAL': { text: 'Trial', color: 'bg-blue-500/20 text-blue-400' },
      'EXPIRED': { text: 'Expired', color: 'bg-red-500/20 text-red-400' },
    };

    const badge = badges[status.subscriptionType];
    if (!badge) return null;

    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 flex flex-col transition-colors duration-300">
      <nav className="sticky top-0 z-50 bg-indigo-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center min-h-[57px] transition-colors duration-300">
        <div className="flex items-center gap-4 md:gap-8">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => navigate('/dashboard')}
          >
            <img 
              src="/logo.png" 
              alt="Akseli Logo" 
              className="h-6 md:h-8 w-auto"
            />
            <span className="hidden md:inline font-black text-lg md:text-xl text-slate-800 dark:text-slate-100">
              Akseli
            </span>
          </div>
          <div className="h-6 flex items-center">
            {getSubscriptionBadge()}
          </div>
          <div className="hidden md:flex gap-4 text-sm font-bold">
            <button 
              onClick={() => navigate('/dashboard')}
              className={isActive('/dashboard') ? 'text-indigo-400 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}>
              {t('nav.dashboard')}
            </button>
            <button 
              onClick={() => navigate('/dashboard/subscription')}
              className={isActive('/dashboard/subscription') ? 'text-indigo-400 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}>
              Subscription
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setLanguage('fr')}
              className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                language === 'fr'
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-400 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-500'
              }`}
              title="Français"
            >
              FR
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-bold rounded transition-colors ${
                language === 'en'
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-400 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-500'
              }`}
              title="English"
            >
              EN
            </button>
          </div>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <button 
            onClick={() => signOut()}
            className="hidden md:block text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-rose-300 dark:hover:text-rose-400 transition-colors"
          >
            {t('nav.signOut')}
          </button>
          <UserButton />
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Menu Panel */}
          <div className="fixed top-[57px] left-0 right-0 bg-indigo-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 z-40 md:hidden shadow-lg transition-colors duration-300">
            <div className="px-4 py-3 space-y-1">
              <button 
                onClick={() => handleNavigate('/dashboard')}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                  isActive('/dashboard') 
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-400 dark:text-indigo-300' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-slate-800'
                }`}
              >
                {t('nav.dashboard')}
              </button>
              <button 
                onClick={() => handleNavigate('/dashboard/subscription')}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                  isActive('/dashboard/subscription') 
                    ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-400 dark:text-indigo-300' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-slate-800'
                }`}
              >
                Subscription
              </button>
              <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
              <button 
                onClick={() => {
                  signOut();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-rose-300 hover:bg-rose-50 transition-colors"
              >
                {t('nav.signOut')}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="flex-1 bg-indigo-100 dark:bg-slate-900 transition-colors duration-300">
        {children}
      </div>

      <Footer variant="light" />
    </div>
  );
}
