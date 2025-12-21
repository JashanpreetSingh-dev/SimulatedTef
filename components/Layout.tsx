
import React, { useState, useEffect } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onNavigate: (section: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeSection, onNavigate }) => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      // Respect existing class if present, otherwise default to true (dark)
      return document.documentElement.classList.contains('dark') || !document.documentElement.classList.contains('light');
    }
    return true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'simulator', label: 'Simulateur EO', icon: '🗣️' },
    { id: 'history', label: 'Historique', icon: '🕒' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden lg:flex">
        <div className="p-8">
          <h1 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2 tracking-tighter">
            <span className="text-3xl">🇨🇦</span> TEF MASTER
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                activeSection === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest transition-colors"
          >
            <span>{isDark ? 'Mode Nuit' : 'Mode Jour'}</span>
            <span className="text-lg">{isDark ? '🌙' : '☀️'}</span>
          </button>
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600 rounded-3xl p-5 text-white shadow-xl shadow-indigo-500/20">
            <p className="text-[10px] opacity-70 mb-1 uppercase tracking-widest font-black">Score Prédit</p>
            <p className="text-2xl font-black">B2+</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="lg:hidden font-black text-indigo-600 dark:text-indigo-400 text-xl tracking-tighter flex items-center gap-2">
             <span>🇨🇦</span> TEF MASTER
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center gap-6">
            <button className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors">
              🔔
            </button>
            {process.env.CLERK_PUBLISHABLE_KEY ? (
              <UserButton 
                appearance={{ 
                  baseTheme: isDark ? dark : undefined,
                  elements: {
                    userButtonAvatarBox: "w-10 h-10 border-2 border-indigo-100 dark:border-indigo-900 shadow-sm"
                  }
                }} 
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400">JD</div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide">
          <div className="max-w-5xl mx-auto pb-20">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
