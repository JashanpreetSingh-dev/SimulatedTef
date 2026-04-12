import React from 'react';
import { Link } from 'react-router-dom';
import { SignUpButton } from '@clerk/clerk-react';

interface BlogPostLayoutProps {
  title: string;
  publishedDate: string;
  readingTimeMin: number;
  children: React.ReactNode;
}

export const BlogPostLayout: React.FC<BlogPostLayoutProps> = ({
  title,
  publishedDate,
  readingTimeMin,
  children,
}) => {
  const formatted = new Date(publishedDate).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-lg hover:text-teal-700 dark:hover:text-teal-400 transition-colors">
            <img src="/logo.png" alt="Akseli" className="h-6 w-6" />
            Akseli
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/blog" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors">
              ← All articles
            </Link>
            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard" signInFallbackRedirectUrl="/dashboard">
              <button className="px-4 py-2 rounded-full bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-colors">
                Try free
              </button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:grid lg:grid-cols-[1fr_280px] lg:gap-12">
        {/* Article */}
        <article className="prose prose-slate dark:prose-invert prose-headings:font-black prose-h1:text-4xl prose-h1:leading-tight prose-h2:text-2xl prose-h2:mt-10 prose-h3:text-xl prose-p:leading-relaxed prose-li:leading-relaxed max-w-none">
          <header className="not-prose mb-10">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-3">
              <Link to="/blog" className="hover:text-teal-700 dark:hover:text-teal-400 transition-colors">Blog</Link>
              <span>·</span>
              <time dateTime={publishedDate}>{formatted}</time>
              <span>·</span>
              <span>{readingTimeMin} min read</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 leading-tight tracking-tight">
              {title}
            </h1>
          </header>

          {children}

          {/* Bottom CTA */}
          <div className="not-prose mt-16 p-8 rounded-2xl bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 text-center">
            <p className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-2">Ready to practice?</p>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Start a free TEF Canada oral practice session with Akseli — no credit card required.
            </p>
            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard" signInFallbackRedirectUrl="/dashboard">
              <button className="px-8 py-4 rounded-full bg-teal-700 text-white font-semibold text-lg hover:bg-teal-800 transition-colors">
                Start a free TEF practice
              </button>
            </SignUpButton>
            <p className="text-xs text-slate-400 mt-3">30 oral sessions · Less than one hour of tutoring</p>
          </div>
        </article>

        {/* Sticky sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
              <img src="/logo.png" alt="Akseli" className="h-10 w-10 mx-auto mb-3" />
              <p className="font-black text-slate-900 dark:text-slate-50 text-lg mb-1">Akseli</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                AI-powered TEF Canada oral practice. Sections A and B. Instant feedback.
              </p>
              <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard" signInFallbackRedirectUrl="/dashboard">
                <button className="w-full px-4 py-3 rounded-full bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 transition-colors">
                  Try free
                </button>
              </SignUpButton>
              <p className="text-xs text-slate-400 mt-2">No credit card required</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">More articles</p>
              <div className="space-y-3">
                <Link to="/blog/how-to-prepare-tef-canada-oral" className="block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 transition-colors leading-snug">
                  How to Prepare for TEF Canada Oral Sections A and B
                </Link>
                <Link to="/blog/tef-canada-clb-score-express-entry" className="block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 transition-colors leading-snug">
                  TEF Canada CLB Scores for Express Entry
                </Link>
                <Link to="/blog/tef-canada-vs-tcf-canada" className="block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-400 transition-colors leading-snug">
                  TEF Canada vs TCF Canada
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
