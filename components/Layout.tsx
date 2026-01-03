/**
 * Layout Component
 * 
 * Main application layout with sidebar navigation and content area.
 * Uses standardized spacing from utils/designTokens.ts:
 * - Card padding: p-6 (24px)
 * - Section padding: px-6 (24px) mobile, px-8 (32px) desktop
 * - Gap between elements: gap-4 (16px) standard
 * - Border radius: rounded-2xl (16px) for cards
 */

import React from 'react';
import { UserButton } from '@clerk/clerk-react';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onNavigate: (section: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeSection, onNavigate }) => {

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'simulator', label: 'Simulateur EO', icon: '🗣️' },
    { id: 'history', label: 'Historique', icon: '🕒' },
  ];

  return (
    <div className="flex h-screen bg-indigo-100 overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-100/50 border-r border-slate-200 flex flex-col hidden lg:flex">
        <div className="p-6">
          <h1 className="text-2xl font-black text-indigo-400 flex items-center gap-2 tracking-tighter">
            <span className="text-3xl">🇨🇦</span> TEF MASTER
          </h1>
        </div>
        
        <nav className="flex-1 px-6 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                activeSection === item.id
                  ? 'bg-indigo-400 text-white shadow-lg shadow-indigo-400/20'
                  : 'text-slate-500 hover:bg-indigo-100/50 hover:text-slate-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-200 space-y-4">
          <div className="bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-3xl p-6 text-white shadow-xl shadow-indigo-300/20">
            <p className="text-xs opacity-70 mb-1 uppercase tracking-widest font-black">Score Prédit</p>
            <p className="text-2xl font-black">B2+</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-indigo-100/50/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="lg:hidden font-black text-indigo-400 text-xl tracking-tighter flex items-center gap-2">
             <span>🇨🇦</span> TEF MASTER
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center gap-6">
            <button className="p-2 text-slate-500 hover:text-slate-600 bg-indigo-100/50 rounded-xl transition-colors">
              🔔
            </button>
            {process.env.CLERK_PUBLISHABLE_KEY ? (
              <UserButton 
                appearance={{ 
                  elements: {
                    userButtonAvatarBox: "w-10 h-10 border-2 border-indigo-100 shadow-sm"
                  }
                }} 
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-black text-indigo-400">JD</div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 scrollbar-hide">
          <div className="max-w-5xl mx-auto pb-20">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
