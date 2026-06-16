/**
 * Generates B2-level spoken-French hints for the oral exam carousel.
 *
 * Section A: expands shorthand cues into full spoken questions (incremental)
 * Section B: generates ADS (Acknowledge-Defend-Solve) structured counter-responses
 *            Pass --rebuild to force-regenerate all tasks (needed when switching format)
 *
 * Run: npm run generate-oral-hints
 * Run: npm run generate-oral-hints -- --rebuild   (force all Section B tasks)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_A = join(ROOT, 'data/section_a_knowledge_base.json');
const DATA_B = join(ROOT, 'data/section_b_knowledge_base.json');

interface AdsCounter {
  acknowledge: string;
  defend: string;
  solve: string;
  fullResponse: string;
}

interface TEFTask {
  id: number;
  theme?: string;
  prompt: string;
  image: string;
  suggested_questions?: string[];
  expanded_questions?: string[];
  counter_arguments?: string[];
  suggested_counters?: AdsCounter[];
  [key: string]: unknown;
}

const REBUILD = process.argv.includes('--rebuild');

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isAdsCounter(x: unknown): x is AdsCounter {
  return typeof x === 'object' && x !== null && 'acknowledge' in x && 'defend' in x && 'solve' in x;
}

function parseJsonObjectArray(raw: string, expectedCount: number): AdsCounter[] | null {
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length === expectedCount && parsed.every(isAdsCounter)) {
      return parsed as AdsCounter[];
    }
    return null;
  } catch {
    return null;
  }
}

function parseStringArray(raw: string): string[] | null {
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Section A: expand shorthand cues into full B2 spoken questions ────────────

async function generateExpandedQuestions(ai: GoogleGenAI, task: TEFTask): Promise<string[]> {
  const cues = (task.suggested_questions ?? []).join('\n');
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    config: {
      maxOutputTokens: 4096,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: 'application/json',
    },
    contents: [{
      parts: [{
        text: `You are a TEF Canada oral exam coach helping a B2-level French learner prepare for Section A (EO1).

Context:
- Topic: ${task.theme ?? task.prompt}
- Consigne: ${task.prompt}
- The candidate is phoning to ask about an ad/announcement they read.

Expand each shorthand cue below into a natural, spoken French question at B2 level (CLB/NCLC 7-8).
Rules:
- Informal but polite register (use "vous" to address the service)
- Natural spoken syntax — how you'd actually phrase it on the phone
- 10-20 words per question
- No filler words like "donc" or "euh"
- Each question must be specific to the topic

Cues to expand (one per line):
${cues}

Return ONLY a valid JSON array of strings (same order, same count as the cues). No other text.
Example: ["Pourriez-vous me préciser combien de temps dure chaque séance ?", ...]`,
      }],
    }],
  });

  const result = parseStringArray(response.text ?? '');
  if (!result || result.length !== (task.suggested_questions?.length ?? 0)) {
    throw new Error(`Bad response shape: ${(response.text ?? '').substring(0, 200)}`);
  }
  return result;
}

// ── Section B: generate ADS counter-responses ─────────────────────────────────

async function generateCounterBatch(
  ai: GoogleGenAI,
  topic: string,
  batch: string[],
  offset: number,
): Promise<AdsCounter[]> {
  const numbered = batch.map((a, i) => `${offset + i + 1}. ${a}`).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    config: {
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: 'application/json',
    },
    contents: [{
      parts: [{
        text: `You are a TEF Canada oral exam coach helping a B2-level French learner prepare for Section B (EO2).

Context:
- Topic: ${topic}
- Situation: The candidate saw an ad and wants to convince a skeptical friend to try it.
- The "friend" (examiner) raises objections — the candidate must counter them using the ADS structure.

ADS structure (Acknowledge → Defend → Solve):
- Acknowledge: 1 sentence validating the concern warmly
- Defend: 1-2 sentences countering with a concrete, topic-specific argument
- Solve: 1 sentence offering a practical resolution or safety net
- fullResponse: all three combined naturally (~65-85 words total — speakable in 30-50 seconds)

Rules:
- INFORMAL spoken French between friends ("tu", contractions, natural rhythm)
- B2 level only (CLB/NCLC 7-8) — clear everyday words, NO advanced C1 vocabulary
- Persuasive and warm, not aggressive
- Each "acknowledge" must start differently
- Arguments must be specific to the topic, not vague

Objections:
${numbered}

Return ONLY a valid JSON array of objects (one per objection, same order, exactly ${batch.length} items):
[
  {
    "acknowledge": "...",
    "defend": "...",
    "solve": "...",
    "fullResponse": "..."
  }
]
No other text.`,
      }],
    }],
  });

  const result = parseJsonObjectArray(response.text ?? '', batch.length);
  if (!result) {
    throw new Error(`Bad response shape (expected ${batch.length} ADS objects): ${(response.text ?? '').substring(0, 200)}`);
  }
  return result;
}

async function generateSuggestedCounters(ai: GoogleGenAI, task: TEFTask): Promise<AdsCounter[]> {
  const args = (task.counter_arguments ?? []).slice(1); // skip header line
  if (args.length === 0) return [];

  const topic = task.theme ?? task.prompt;
  const BATCH_SIZE = 4;
  const results: AdsCounter[] = [];

  for (let i = 0; i < args.length; i += BATCH_SIZE) {
    const batch = args.slice(i, i + BATCH_SIZE);
    if (i > 0) await sleep(600);
    const batchResults = await generateCounterBatch(ai, topic, batch, i);
    results.push(...batchResults);
  }
  return results;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not set in .env');
    process.exit(1);
  }
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  // ── Section A (always incremental) ───────────────────────────────────────
  console.log('\n📦 Generating Section A expanded questions…');
  const tasksA: TEFTask[] = JSON.parse(readFileSync(DATA_A, 'utf-8'));
  const aNeeds = tasksA.filter(
    (t) => !t.expanded_questions?.length && t.suggested_questions?.length,
  );
  console.log(`  ${tasksA.length - aNeeds.length} already done, ${aNeeds.length} to generate`);

  for (let i = 0; i < aNeeds.length; i++) {
    const task = aNeeds[i];
    process.stdout.write(`  [${i + 1}/${aNeeds.length}] A#${task.id} "${task.theme ?? ''}" → `);
    try {
      task.expanded_questions = await generateExpandedQuestions(ai, task);
      console.log(`${task.expanded_questions.length} questions ✓`);
    } catch (err: any) {
      console.log(`❌ ${err?.message?.substring(0, 120) ?? err}`);
    }
    if (i < aNeeds.length - 1) await sleep(600);
  }
  writeFileSync(DATA_A, JSON.stringify(tasksA, null, 2), 'utf-8');
  console.log('  ✅ Section A saved');

  // ── Section B ─────────────────────────────────────────────────────────────
  console.log(`\n📦 Generating Section B ADS counter-responses${REBUILD ? ' (--rebuild: all tasks)' : ''}…`);
  const tasksB: TEFTask[] = JSON.parse(readFileSync(DATA_B, 'utf-8'));

  // Needs generation if: --rebuild, or no counters yet, or counters are still plain strings (old format)
  const bNeeds = tasksB.filter((t) => {
    if ((t.counter_arguments?.length ?? 0) <= 1) return false;
    if (REBUILD) return true;
    const first = t.suggested_counters?.[0];
    return !first || !isAdsCounter(first);
  });

  console.log(`  ${tasksB.length - bNeeds.length} already done, ${bNeeds.length} to generate`);

  for (let i = 0; i < bNeeds.length; i++) {
    const task = bNeeds[i];
    const argCount = (task.counter_arguments?.length ?? 1) - 1;
    process.stdout.write(`  [${i + 1}/${bNeeds.length}] B#${task.id} "${task.theme ?? ''}" (${argCount} args) → `);
    try {
      task.suggested_counters = await generateSuggestedCounters(ai, task);
      console.log(`${task.suggested_counters.length} counters ✓`);
    } catch (err: any) {
      console.log(`❌ ${err?.message?.substring(0, 120) ?? err}`);
      // Keep existing counters on failure — don't overwrite with nothing
    }
    if (i < bNeeds.length - 1) await sleep(600);
  }
  writeFileSync(DATA_B, JSON.stringify(tasksB, null, 2), 'utf-8');
  console.log('  ✅ Section B saved');

  console.log('\n🎉 Done. Re-run is safe — already-done ADS counters are skipped (use --rebuild to force all).');
}

main().catch((err) => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
