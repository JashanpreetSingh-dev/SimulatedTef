import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SignUpButton } from '@clerk/clerk-react';
import { blogPosts } from './blog/blogPosts';

export const BlogPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Helmet>
        <title>TEF Canada Preparation Blog – Akseli</title>
        <meta name="description" content="Guides and tips to help you prepare for TEF Canada oral sections, understand CLB score requirements for Express Entry, and pass the French language test for Canadian immigration." />
        <link rel="canonical" href="https://akseli.ca/blog" />
      </Helmet>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-lg hover:text-teal-700 dark:hover:text-teal-400 transition-colors">
            <img src="/logo.png" alt="Akseli" className="h-6 w-6" />
            Akseli
          </Link>
          <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard" signInFallbackRedirectUrl="/dashboard">
            <button className="px-4 py-2 rounded-full bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-colors">
              Try free
            </button>
          </SignUpButton>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <header className="mb-12">
          <p className="text-sm font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-widest mb-3">Akseli Blog</p>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-50 leading-tight tracking-tight mb-4">
            TEF Canada Preparation Guides
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed">
            Practical guides for TEF Canada oral preparation, CLB score requirements, and French language testing for Canadian immigration.
          </p>
        </header>

        <div className="space-y-6">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="block group p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-md transition-all duration-200"
            >
              <div className="text-xs text-slate-400 mb-2 flex items-center gap-2">
                <time dateTime={post.publishedDate}>
                  {new Date(post.publishedDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
                <span>·</span>
                <span>{post.readingTimeMin} min read</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors mb-3 leading-snug">
                {post.title}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                {post.description}
              </p>
              <span className="inline-block mt-4 text-sm font-semibold text-teal-700 dark:text-teal-400 group-hover:underline">
                Read article →
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-2xl bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 text-center">
          <p className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-2">Start practicing today</p>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Reading about TEF Canada is step one. Practice is what moves the needle.
          </p>
          <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard" signInFallbackRedirectUrl="/dashboard">
            <button className="px-8 py-4 rounded-full bg-teal-700 text-white font-semibold text-lg hover:bg-teal-800 transition-colors">
              Start a free TEF practice
            </button>
          </SignUpButton>
        </div>
      </div>
    </div>
  );
};
