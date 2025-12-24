import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  variant?: 'light' | 'dark';
}

export const Footer: React.FC<FooterProps> = ({ variant = 'dark' }) => {
  const isDark = variant === 'dark';
  
  return (
    <footer className={`border-t ${isDark ? 'border-slate-800/50 bg-slate-950' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'} py-6 px-4 sm:px-6 md:sticky md:bottom-0 z-10`}>
      <div className={`max-w-6xl mx-auto`}>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>
            © {new Date().getFullYear()} Akseli. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-center sm:justify-end">
            <a
              href="mailto:support@akseli.ca"
              className={`text-sm transition-colors ${
                isDark 
                  ? 'text-slate-400 hover:text-white' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              support@akseli.ca
            </a>
            <Link
              to="/terms"
              className={`text-sm transition-colors ${
                isDark 
                  ? 'text-slate-400 hover:text-white' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Terms of Service
            </Link>
            <Link
              to="/privacy"
              className={`text-sm transition-colors ${
                isDark 
                  ? 'text-slate-400 hover:text-white' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

