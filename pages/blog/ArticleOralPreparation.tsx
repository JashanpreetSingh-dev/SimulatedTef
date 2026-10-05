import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BlogPostLayout } from '../../components/BlogPostLayout';

const post = {
  slug: 'how-to-prepare-tef-canada-oral',
  title: 'How to Prepare for TEF Canada Oral Sections A and B',
  description:
    'What to expect in TEF Canada Expression Orale, how Sections A and B are scored on the CLB scale, and the most effective ways to prepare.',
  publishedDate: '2026-04-12',
  modifiedDate: '2026-04-12',
  readingTimeMin: 7,
};

export const ArticleOralPreparation: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>{post.title} – Akseli</title>
        <meta name="description" content={post.description} />
        <link rel="canonical" href={`https://akseli.ca/blog/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://akseli.ca/blog/${post.slug}`} />
        <meta property="og:image" content="https://akseli.ca/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.description} />
        <meta name="twitter:image" content="https://akseli.ca/og-image.png" />
        <meta name="keywords" content="TEF Canada oral preparation, TEF Canada section A practice, TEF Canada section B practice, TEF Canada speaking practice, prepare TEF Canada oral" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.description,
          datePublished: post.publishedDate,
          dateModified: post.modifiedDate,
          author: { '@type': 'Organization', name: 'Akseli', url: 'https://akseli.ca' },
          publisher: { '@type': 'Organization', name: 'Akseli', url: 'https://akseli.ca' },
          mainEntityOfPage: { '@type': 'WebPage', '@id': `https://akseli.ca/blog/${post.slug}` },
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://akseli.ca/' },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://akseli.ca/blog' },
            { '@type': 'ListItem', position: 3, name: post.title, item: `https://akseli.ca/blog/${post.slug}` },
          ],
        })}</script>
      </Helmet>

      <BlogPostLayout title={post.title} publishedDate={post.publishedDate} readingTimeMin={post.readingTimeMin} slug={post.slug}>
        <p>
          TEF Canada Expression Orale is the spoken French component of the TEF Canada exam. It is scored out of 699 points and converted to a CLB level recognized by IRCC for immigration applications. It is also the section most candidates find hardest to prepare for on their own. Speaking practice requires a conversation partner, and finding one who can simulate a real exam is expensive and hard to schedule.
        </p>
        <p>
          This guide covers what to expect in both oral sections, how they are scored, and the most effective ways to build fluency before exam day.
        </p>

        <h2>What is the TEF Canada Oral Exam?</h2>
        <p>
          TEF Canada (Test d'Évaluation de Français pour le Canada) is a French language proficiency test administered by CCI Paris and recognized by Immigration, Refugees and Citizenship Canada (IRCC). It has four components: oral expression, oral comprehension, written expression, and written comprehension.
        </p>
        <p>
          The oral expression component — Expression Orale — is divided into two sections:
        </p>
        <ul>
          <li><strong>Section A (Expression Orale 1):</strong> A short interview format, typically 5–8 minutes.</li>
          <li><strong>Section B (Expression Orale 2):</strong> A longer role-play or structured discussion, typically 10–15 minutes.</li>
        </ul>
        <p>
          Together they assess your ability to communicate naturally, handle unexpected questions, and express nuanced opinions in French.
        </p>

        <h2>What happens in Section A?</h2>
        <p>
          Section A simulates the opening of a conversation with an examiner. You will be asked 3–5 questions on familiar, everyday topics — your job, your daily life, your interests, your family, or your home country. The format feels like a structured interview.
        </p>
        <p>
          What the examiner is listening for:
        </p>
        <ul>
          <li>How quickly and confidently you respond (fluency)</li>
          <li>Variety in your vocabulary — avoiding the same words repeatedly</li>
          <li>Grammatical accuracy, especially verb tenses</li>
          <li>Your ability to extend answers beyond one or two sentences</li>
        </ul>
        <p>
          A common mistake is answering too briefly. If the examiner asks "Parlez-moi de votre travail," a two-sentence answer scores poorly. Aim for 4–6 sentences with relevant detail and a natural transition.
        </p>

        <h2>What happens in Section B?</h2>
        <p>
          Section B is more demanding. You will be given a scenario and asked to play a role — typically defending a position, making a request, resolving a situation, or negotiating. Examples:
        </p>
        <ul>
          <li>You are a customer complaining about a product you bought online.</li>
          <li>You want to convince your employer to let you work remotely.</li>
          <li>You are trying to organize an event with a colleague who has different ideas.</li>
        </ul>
        <p>
          The examiner plays the other character. Your job is to stay in the scenario, respond to what they say, and express your point of view clearly and naturally — even when they push back.
        </p>
        <p>
          What the examiner is listening for:
        </p>
        <ul>
          <li>Your ability to initiate and sustain a conversation</li>
          <li>Appropriate register (polite but assertive)</li>
          <li>Handling of unexpected turns in the conversation</li>
          <li>Coherence and argument structure</li>
        </ul>

        <h2>How Are the Oral Sections Scored?</h2>
        <p>
          TEF Canada oral expression is scored out of 699 points. These raw scores are converted to Canadian Language Benchmark (CLB) levels, which is what IRCC uses for immigration purposes. The score bands below apply from December 11, 2023.
        </p>

        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-teal-50 dark:bg-teal-900/30">
                <th className="text-left p-3 border border-slate-200 dark:border-slate-700 font-semibold">CLB Level</th>
                <th className="text-left p-3 border border-slate-200 dark:border-slate-700 font-semibold">TEF Canada Score (out of 699)</th>
                <th className="text-left p-3 border border-slate-200 dark:border-slate-700 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['CLB 4', '328–386', 'Basic conversational ability'],
                ['CLB 5', '387–421', 'Intermediate — handles familiar topics'],
                ['CLB 6', '422–455', 'Upper intermediate'],
                ['CLB 7', '456–493', 'Advanced — required for most Express Entry streams'],
                ['CLB 8', '494–517', 'Strong advanced'],
                ['CLB 9', '518–555', 'Near-fluent'],
                ['CLB 10', '556–591', 'Fluent'],
                ['CLB 11', '592–641', 'Highly proficient'],
                ['CLB 12', '642–699', 'Near-native'],
              ].map(([clb, score, desc]) => (
                <tr key={clb} className="even:bg-slate-50 dark:even:bg-slate-800/30">
                  <td className="p-3 border border-slate-200 dark:border-slate-700 font-semibold text-teal-700 dark:text-teal-400">{clb}</td>
                  <td className="p-3 border border-slate-200 dark:border-slate-700">{score}</td>
                  <td className="p-3 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4">
          Source: Official CCI Paris conversion table, effective December 11, 2023. Always verify against the current IRCC TEF Canada chart before submitting your application.
        </p>

        <h2>What are the most effective ways to prepare?</h2>

        <h3>1. Speak every day, even for 10 minutes</h3>
        <p>
          The single biggest factor in oral exam performance is speaking volume. Candidates who practice speaking daily — even briefly — consistently outperform those who study more but speak less. Your brain needs repetition to retrieve vocabulary quickly under pressure. Reading about French grammar does not build that retrieval speed. Speaking does.
        </p>

        <h3>2. Practice the exam format, not just the language</h3>
        <p>
          Knowing French and knowing how to perform on a timed oral exam are different skills. Practice answering questions within 30–60 seconds. Practice maintaining a role-play scenario for 10 minutes without breaking character. Get comfortable with the specific rhythms of the TEF Canada format before exam day.
        </p>

        <h3>3. Record yourself</h3>
        <p>
          Most people have never heard themselves speak French. Recording a 5-minute Section A practice session and listening back is one of the most effective — and uncomfortable — ways to identify recurring errors, filler words, and vocabulary gaps. Do it once a week.
        </p>

        <h3>4. Build vocabulary around TEF Canada topics</h3>
        <p>
          TEF Canada Section A draws heavily from a predictable set of topics: work and career, daily routines, housing, travel, health, technology, environment, and current events. Build 30–40 solid phrases and vocabulary items in each category. You do not need to know everything — you need to be fluent in the most likely topics.
        </p>

        <h3>5. Get feedback, not just practice</h3>
        <p>
          Practice without feedback reinforces your current level — including your errors. Find a way to get genuine feedback on your pronunciation, grammar, and fluency. This is where an AI examiner like Akseli helps: you get instant, detailed feedback after every session without scheduling a tutor.
        </p>

        <h2>How does Akseli help you prepare?</h2>
        <p>
          Akseli is built specifically for TEF Canada oral practice. It simulates real Section A and Section B scenarios with prompts and timing that match the actual exam format. After each session you receive a detailed evaluation with scores and feedback — the same kind of assessment a human examiner would give, available any time of day.
        </p>
        <p>
          Most candidates use Akseli alongside 1–2 human tutoring sessions per month: Akseli for daily volume and consistency, a tutor for nuanced coaching on strategy and accent. The combination is significantly more effective — and much cheaper — than tutoring alone.
        </p>
        <p>
          If you are preparing for Express Entry, see <Link to="/blog/tef-canada-clb-score-express-entry">TEF Canada CLB score requirements for Express Entry</Link> for the exact scores you need in each immigration stream. If you are still deciding which test to take, read <Link to="/blog/tef-canada-vs-tcf-canada">TEF Canada vs TCF Canada</Link> for a direct comparison.
        </p>

        <div className="not-prose mt-12 p-6 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Related articles</p>
          <ul className="space-y-3">
            <li>
              <Link to="/blog/tef-canada-clb-score-express-entry" className="font-medium text-teal-700 dark:text-teal-400 hover:underline">
                TEF Canada CLB Scores for Express Entry: What You Need to Know
              </Link>
            </li>
            <li>
              <Link to="/blog/tef-canada-vs-tcf-canada" className="font-medium text-teal-700 dark:text-teal-400 hover:underline">
                TEF Canada vs TCF Canada: Which French Test for Immigration?
              </Link>
            </li>
          </ul>
        </div>
      </BlogPostLayout>
    </>
  );
};
