import React from 'react';
import { Link } from 'react-router-dom';

interface FooterProps {
  variant?: 'light' | 'dark';
}

export const Footer: React.FC<FooterProps> = ({ variant = 'dark' }) => {
  const isDark = variant === 'dark';
  
  return (
    <footer className={`border-t ${isDark ? 'border-slate-200 dark:border-slate-700 bg-indigo-100 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 bg-indigo-100 dark:bg-slate-800'} py-3 sm:py-4 md:py-6 px-4 sm:px-6 md:sticky md:bottom-0 z-10 transition-colors duration-300`}>
      <div className={`max-w-6xl mx-auto`}>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
          <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-600 dark:text-slate-400' : 'text-slate-600 dark:text-slate-400'} text-center sm:text-left`}>
            © {new Date().getFullYear()} Akseli. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-4 md:gap-6 justify-center sm:justify-end text-xs sm:text-sm">
            <a
              href="mailto:support@akseli.ca"
              className={`transition-colors ${
                isDark 
                  ? 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="hidden sm:inline">support@akseli.ca</span>
              <span className="sm:hidden">Support</span>
            </a>
            <Link
              to="/terms"
              className={`transition-colors ${
                isDark 
                  ? 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              className={`transition-colors ${
                isDark 
                  ? 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

