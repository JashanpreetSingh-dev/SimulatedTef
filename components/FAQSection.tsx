import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: 'What are the 4 modules in TEF Canada?',
      answer: 'TEF Canada consists of 4 modules: Compréhension Écrite (Reading - 40 MCQ), Compréhension Orale (Listening - 40 MCQ), Expression Écrite (Writing - 2 tasks), and Expression Orale (Speaking - 2 sections). Akseli covers all 4 modules with AI-powered evaluation.',
    },
    {
      question: 'How does the AI evaluate my speaking?',
      answer: 'Our AI examiner conducts real-time conversations using advanced speech recognition. It evaluates your pronunciation, fluency, grammar, vocabulary, and coherence based on the official CCI Paris framework used by actual TEF examiners.',
    },
    {
      question: 'How does the AI evaluate my writing?',
      answer: 'When you submit your written responses, our AI analyzes grammar, vocabulary range, text coherence, and structure according to the official CCI Paris evaluation criteria. You receive detailed feedback with specific areas for improvement.',
    },
    {
      question: 'What\'s the difference between Practice and Mock Exam modes?',
      answer: 'Practice mode lets you learn at your own pace with no time pressure - great for building skills. Mock Exam mode simulates the real test conditions with official time limits, helping you prepare for actual exam day stress.',
    },
    {
      question: 'How accurate is the CLB scoring?',
      answer: 'Our AI is trained on the official CCI Paris evaluation framework. While no simulation can guarantee exact scores, our CLB predictions closely align with actual TEF results and help you understand your current level.',
    },
    {
      question: 'Can teachers create custom assessments?',
      answer: 'Yes! Teachers can use our AI Assessment Creator to generate custom Reading and Listening comprehension tests. Simply describe the topic, and our AI creates questions, passages, and audio. Teachers can review, edit, and publish assessments to their students.',
    },
    {
      question: 'How do organizations work?',
      answer: 'Teachers can create organizations and invite students. Once students join, they automatically see assessments published by their teachers. This makes it easy to manage classes and track student progress.',
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

