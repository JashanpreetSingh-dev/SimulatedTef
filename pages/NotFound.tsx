import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center px-4 text-center">
      <Helmet>
        <title>Page not found – Akseli</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <p className="text-6xl font-black text-slate-200 dark:text-slate-700 mb-6">404</p>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-3">Page not found</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
        The page you are looking for does not exist.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/"
          className="px-6 py-3 rounded-full bg-teal-700 text-white font-semibold hover:bg-teal-800 transition-colors"
        >
          Go to homepage
        </Link>
        <Link
          to="/blog"
          className="px-6 py-3 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          Read the blog
        </Link>
      </div>
    </div>
  );
};
