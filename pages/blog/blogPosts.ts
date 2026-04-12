export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedDate: string;
  readingTimeMin: number;
  keywords: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'how-to-prepare-tef-canada-oral',
    title: 'How to Prepare for TEF Canada Oral Sections A and B',
    description:
      'A practical guide to TEF Canada Expression Orale — what Section A and Section B look like, how they are scored on the CLB scale, and the most effective ways to practice.',
    publishedDate: '2026-04-12',
    readingTimeMin: 7,
    keywords: [
      'TEF Canada oral preparation',
      'TEF Canada section A practice',
      'TEF Canada section B practice',
      'TEF Canada speaking practice',
      'prepare TEF Canada oral',
      'TEF Canada oral tips',
    ],
  },
  {
    slug: 'tef-canada-clb-score-express-entry',
    title: 'TEF Canada CLB Scores for Express Entry: What You Need to Know',
    description:
      'Everything immigration candidates need to know about TEF Canada CLB score requirements for Express Entry, Federal Skilled Worker, CEC, and provincial nominee programs.',
    publishedDate: '2026-04-12',
    readingTimeMin: 6,
    keywords: [
      'TEF Canada Express Entry',
      'TEF Canada CLB score',
      'TEF Canada permanent residency',
      'TEF Canada immigration',
      'TEF Canada CLB 7',
      'TEF Canada Federal Skilled Worker',
    ],
  },
  {
    slug: 'tef-canada-vs-tcf-canada',
    title: 'TEF Canada vs TCF Canada: Which French Test for Immigration?',
    description:
      'Comparing TEF Canada and TCF Canada for IRCC and Express Entry. Format differences, difficulty, score conversion, and how to decide which test to take.',
    publishedDate: '2026-04-12',
    readingTimeMin: 5,
    keywords: [
      'TEF Canada vs TCF',
      'TEF Canada or TCF for immigration',
      'TEF Canada vs TCF Canada',
      'French test for Canadian immigration',
      'TEF vs TCF Express Entry',
    ],
  },
];
