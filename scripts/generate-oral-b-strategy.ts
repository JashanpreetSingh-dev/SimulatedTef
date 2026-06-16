/**
 * Generates the universal Section B counter-argument strategy guide.
 *
 * Reads all counter_arguments from section_b_knowledge_base.json, sends them
 * to Gemini in one shot to cluster into unique objection categories, then
 * generates a model ADS (Acknowledge–Defend–Solve) response for each.
 *
 * Output: data/section_b_universal_strategy.json
 * Run:    npm run generate-oral-b-strategy
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_B = join(ROOT, 'data/section_b_knowledge_base.json');
const OUT = join(ROOT, 'data/section_b_universal_strategy.json');

interface TEFTask {
  counter_arguments?: string[];
  [key: string]: unknown;
}

export interface StrategyCategory {
  id: string;
  category: string;
  icon: string;
  exampleObjection: string;
  acknowledge: string;
  defend: string;
  solve: string;
  fullResponse: string;
}

async function main() {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not set in .env');
    process.exit(1);
  }
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  const tasks: TEFTask[] = JSON.parse(readFileSync(DATA_B, 'utf-8'));
  // Skip the header line (index 0) in each task's counter_arguments
  const allArgs = tasks
    .flatMap((t) => (t.counter_arguments ?? []).slice(1))
    .filter(Boolean);

  console.log(`\n📦 Analysing ${allArgs.length} counter-arguments across ${tasks.length} Section B tasks…`);

  const argList = allArgs.map((a, i) => `${i + 1}. ${a}`).join('\n');

  const prompt = `You are a TEF Canada oral exam coach analysing every examiner objection that appears in Section B (EO2) of the exam.

Below is the full list of ${allArgs.length} objections collected from ${tasks.length} different exam tasks. Your job is to:

1. Read ALL objections carefully.
2. Identify the UNIQUE underlying concern categories (expect 12–20 categories).
3. For each category, write a model ADS response a B2-level candidate can memorise and reuse with ANY topic.

ADS structure:
- Acknowledge: 1 sentence validating the concern (use "tu" / informal register)
- Defend: 1–2 sentences countering with a concrete argument
- Solve: 1 sentence offering a practical resolution or safety net

Rules for the responses:
- INFORMAL spoken French between friends ("tu", contractions, natural rhythm)
- B2 level vocabulary only (CLB/NCLC 7–8) — clear, everyday words; NO advanced C1 vocabulary or rare expressions
- Varied but accessible: the kind of French a confident B2 speaker actually uses in conversation
- Full response = Acknowledge + Defend + Solve combined (~60-80 words)
- Generic enough to work across all topics, yet concrete and persuasive
- Start each "acknowledge" differently (don't always use the same opener)

Full objection list:
${argList}

Return ONLY valid JSON — an array of objects with this shape:
[
  {
    "id": "cost",
    "category": "Coût et budget",
    "icon": "💰",
    "exampleObjection": "C'est sûrement hors de prix.",
    "acknowledge": "Ouais, je comprends, le prix c'est toujours quelque chose qu'on regarde en premier.",
    "defend": "Mais honnêtement, quand tu vois tout ce qui est inclus — l'hébergement, les repas, l'encadrement — c'est vraiment un bon rapport qualité-prix. Tu paies pas pour rien.",
    "solve": "Et si c'est encore trop cher d'un coup, demande s'ils font des paiements en plusieurs fois, beaucoup le proposent.",
    "fullResponse": "Ouais, je comprends, le prix c'est toujours quelque chose qu'on regarde en premier. Mais honnêtement, quand tu vois tout ce qui est inclus — l'hébergement, les repas, l'encadrement — c'est vraiment un bon rapport qualité-prix. Tu paies pas pour rien. Et si c'est encore trop cher d'un coup, demande s'ils font des paiements en plusieurs fois, beaucoup le proposent."
  }
]

No markdown fences. No extra text. Only the JSON array.`;

  console.log('🤖 Calling Gemini…');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    config: {
      maxOutputTokens: 16384,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: 'application/json',
    },
    contents: [{ parts: [{ text: prompt }] }],
  });

  const raw = response.text ?? '';
  let categories: StrategyCategory[];
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    categories = JSON.parse(cleaned);
    if (!Array.isArray(categories) || categories.length === 0) throw new Error('Empty array');
  } catch {
    console.error('❌ Failed to parse Gemini response:');
    console.error(raw.substring(0, 500));
    process.exit(1);
  }

  writeFileSync(OUT, JSON.stringify(categories, null, 2), 'utf-8');
  console.log(`\n✅ ${categories.length} categories saved to data/section_b_universal_strategy.json`);
  categories.forEach((c, i) => console.log(`  ${i + 1}. ${c.icon} ${c.category}`));
}

main().catch((err) => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
