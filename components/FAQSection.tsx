import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: 'Do these questions match the real TEF Canada oral exam?',
      answer:
        'Akseli uses prompts that mirror TEF Canada structures and difficulty, but they are not official CCI Paris materials. You will see interview and role-play style tasks very similar to what appears on exam day.',
    },
    {
      question: 'Can I practice TEF Canada oral sections A and B separately?',
      answer:
        'Yes. You can focus on short interview-style questions (Section A), longer role-plays (Section B), or run a full oral session that chains both. This lets you target your weakest area or simulate the full exam.',
    },
    {
      question: 'How many practice sessions do I get per month?',
      answer:
        'On the Basic plan you get 10 oral sessions per month. On the Premium plan you get up to 30 oral sessions per month, which is usually enough to practice several times a week before your exam.',
    },
    {
      question: 'Is this enough to replace a TEF tutor?',
      answer:
        'Akseli is designed to give you far more speaking volume and feedback than an occasional tutoring session, but it is not a perfect substitute for a human teacher. Many learners combine AI practice with 1–2 human sessions to check nuance and strategy.',
    },
    {
      question: 'Can I try a TEF Canada practice session for free?',
      answer:
        'Yes. You can start with a free TEF Canada oral practice session before choosing a plan, so you can see how the AI examiner and feedback work for you.',
    },
    {
      question: 'What TEF Canada CLB score do I need for Express Entry or permanent residency?',
      answer:
        'For Express Entry (Federal Skilled Worker), you typically need CLB 7 in all four skills (oral expression, oral comprehension, written expression, written comprehension). Many provincial nominee programs (PNPs) require CLB 5 or CLB 6. Akseli helps you build the speaking fluency and comfort needed to reach your target CLB level on TEF Canada oral sections.',
    },
    {
      question: 'How long does it take to prepare for TEF Canada oral sections?',
      answer:
        'Most candidates who practice consistently for 4–8 weeks see meaningful improvement. The key is speaking volume — Akseli lets you do 1–2 realistic practice sessions per day at your own schedule, which accelerates the improvement you would normally get from weekly tutoring spread over months.',
    },
    {
      question: 'Can I use Akseli to prepare for TEF Canada if I already speak some French?',
      answer:
        'Yes. Akseli is built specifically for TEF Canada oral preparation, not general French learning. Even intermediate speakers benefit from practicing the exam format: timed responses, Section A interview questions, Section B role-play scenarios, and understanding the CLB scoring rubric. Most users arrive with some French and use Akseli to close the gap between their everyday French and exam-ready French.',
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
            TEF Canada oral practice FAQ
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-[1.6] px-4">
            Everything you need to know about TEF Canada preparation with Akseli.
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

