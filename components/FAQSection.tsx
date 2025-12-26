import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: 'What happens after my free trial?',
      answer: 'After your 3-day free trial ends, you can purchase a Starter Pack ($19) or Exam Ready Pack ($35) to continue practicing. Your trial usage and progress are saved, so you can pick up right where you left off.',
    },
    {
      question: 'What\'s the difference between Starter Pack and Exam Ready Pack?',
      answer: 'The Starter Pack includes 5 Full Tests, 3 Section A, and 3 Section B (11 tests total) valid for 30 days. The Exam Ready Pack includes 15 Full Tests, 10 Section A, and 10 Section B (35 tests total) valid for 30 days. Both packs are one-time purchases with no recurring charges.',
    },
    {
      question: 'Do I need a credit card for the trial?',
      answer: 'No credit card required! Start your free trial and explore all features. You only need to provide payment information if you decide to purchase a pack after your trial ends.',
    },
    {
      question: 'How do test credits work?',
      answer: 'Each pack gives you a set number of test credits that you can use anytime within the 30-day validity period. Full Tests, Section A, and Section B are separate credits - they don\'t count against each other. Once you use a credit, it\'s consumed and cannot be reused.',
    },
    {
      question: 'What happens when my pack expires?',
      answer: 'When your 30-day validity period ends, any unused test credits expire. You can purchase a new pack at any time to continue practicing. Your exam history and progress are always saved regardless of pack status.',
    },
    {
      question: 'Can I purchase multiple packs?',
      answer: 'Yes! You can purchase a new pack even if you have an active pack. The new pack will replace your current one, and any unused credits from the previous pack will be lost. We recommend using all your credits before purchasing a new pack.',
    },
    {
      question: 'Do all plans include the same features?',
      answer: 'Yes! All plans (Free Trial, Starter Pack, and Exam Ready Pack) include AI evaluation, CLB scoring, CECR levels, detailed feedback, progress tracking, and exam history. The only difference is the number of test credits included.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-12 xl:px-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 dark:text-slate-100 mb-4 sm:mb-6 leading-[1.1] tracking-[-0.02em] px-2">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">Questions</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-[1.6] px-4">
            Everything you need to know about our plans and pricing.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-indigo-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-indigo-100/70 dark:hover:bg-slate-700/50 transition-colors"
              >
                <span className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 pr-8">
                  {faq.question}
                </span>
                <span className={`text-2xl text-slate-500 dark:text-slate-400 transition-transform duration-300 flex-shrink-0 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}>
                  ↓
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

