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
      answer: 'After your 3-day free trial ends, you can choose to subscribe to Pro Monthly, Pro Yearly, or purchase a 5-Pack. Your trial usage and progress are saved, so you can pick up right where you left off.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes! You can cancel your Pro subscription at any time. Your subscription will remain active until the end of your current billing period, and you\'ll continue to have access until then.',
    },
    {
      question: 'What\'s the difference between Pro and 5-Pack?',
      answer: 'Pro subscriptions give you daily limits that reset every day (1 full test, 2 Section A, 2 Section B per day). The 5-Pack gives you 5 full tests total that you can use anytime - no daily limits, no expiration, but no individual Section A/B practice.',
    },
    {
      question: 'Do I need a credit card for the trial?',
      answer: 'No credit card required! Start your free trial and explore all features. You only need to provide payment information if you decide to subscribe after your trial ends.',
    },
    {
      question: 'Can I use 5-Pack if I have a Pro subscription?',
      answer: 'Yes! You can purchase a 5-Pack even if you have an active Pro subscription. For full tests, the 5-Pack takes priority (if you have tests remaining), otherwise your Pro daily limits apply.',
    },
    {
      question: 'How do daily limits work?',
      answer: 'Daily limits reset at 12:00 AM UTC every day. For Pro plans, you get 1 full test, 2 Section A, and 2 Section B attempts per day. Full tests are separate from Section A/B - they don\'t count against each other.',
    },
    {
      question: 'When do limits reset?',
      answer: 'All daily limits reset at 12:00 AM UTC (midnight UTC) every day. This ensures a consistent reset time for all users worldwide.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-[1.1] tracking-[-0.02em] px-2">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400">Questions</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-[1.6] px-4">
            Everything you need to know about our plans and pricing.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-300 hover:border-slate-700"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-slate-900/30 transition-colors"
              >
                <span className="text-base sm:text-lg font-semibold text-white pr-8">
                  {faq.question}
                </span>
                <span className={`text-2xl text-slate-400 transition-transform duration-300 flex-shrink-0 ${
                  openIndex === index ? 'rotate-180' : ''
                }`}>
                  ↓
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5">
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
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

