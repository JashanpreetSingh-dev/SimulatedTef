/**
 * One-time script to generate B2+ spoken-French hints for the oral exam carousel.
 *
 * Section A: expands shorthand question cues ("Durée ?") into full spoken questions
 * Section B: generates informal spoken counter-responses for each examiner argument
 *
 * One Gemini call per task (~77 + ~81 = ~158 calls total).
 * Run: npm run generate-oral-hints
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

interface TEFTask {
  id: number;
  theme?: string;
  prompt: string;
  image: string;
  suggested_questions?: string[];
  expanded_questions?: string[];
  counter_arguments?: string[];
  suggested_counters?: string[];
  [key: string]: unknown;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseJsonArray(raw: string): string[] | null {
  try {
    // Strip markdown code fences if present
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

// ── Section A: expand shorthand cues into full B2+ spoken questions ──────────

async function generateExpandedQuestions(
  ai: GoogleGenAI,
  task: TEFTask
): Promise<string[]> {
  const cues = (task.suggested_questions ?? []).join('\n');
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        parts: [
          {
            text: `You are a TEF Canada oral exam coach helping a B2-level French learner prepare for Section A (EO1).

Context:
- Topic: ${task.theme ?? task.prompt}
- Consigne: ${task.prompt}
- The candidate is phoning to ask about an ad/announcement they read.

Expand each shorthand cue below into a natural, spoken French question at B2-C1 level.
Rules:
- Informal but polite register (use "vous" to address the service)
- Natural spoken syntax — how you'd actually phrase it on the phone
- 10-20 words per question
- No filler words like "donc" or "euh"
- Each question must be specific to the topic

Cues to expand (one per line):
${cues}

Return ONLY a valid JSON array of strings (same order, same count). No other text.
Example: ["Pourriez-vous me préciser combien de temps dure chaque séance ?", ...]`,
          },
        ],
      },
    ],
  });

  const result = parseJsonArray(response.text ?? '');
  if (!result || result.length !== (task.suggested_questions?.length ?? 0)) {
    throw new Error(`Bad response shape: ${(response.text ?? '').substring(0, 200)}`);
  }
  return result;
}

// ── Section B: generate spoken counter-responses for each examiner argument ──

async function generateSuggestedCounters(
  ai: GoogleGenAI,
  task: TEFTask
): Promise<string[]> {
  // Skip the header line (index 0)
  const args = (task.counter_arguments ?? []).slice(1);
  if (args.length === 0) return [];

  const numbered = args.map((a, i) => `${i + 1}. ${a}`).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        parts: [
          {
            text: `You are a TEF Canada oral exam coach helping a B2-level French learner prepare for Section B (EO2).

Context:
- Topic: ${task.theme ?? task.prompt}
- Situation: The candidate saw an ad and wants to convince a skeptical friend to try it.
- The "friend" (examiner) will raise objections — the candidate must counter them persuasively.

For each objection below, write a natural spoken response the candidate could say.
Rules:
- INFORMAL spoken French between friends (use "tu", contractions, spoken rhythm)
- B2-C1 level — varied vocabulary, correct grammar, no anglicisms
- 2-3 sentences per response (40-70 words)
- Persuasive and warm, not aggressive
- Start each response differently (avoid always starting with "Mais tu sais...")
- Use concrete arguments, not vague reassurances

Objections:
${numbered}

Return ONLY a valid JSON array of strings (one response per objection, same order, ${args.length} items). No other text.`,
          },
        ],
      },
    ],
  });

  const result = parseJsonArray(response.text ?? '');
  if (!result || result.length !== args.length) {
    throw new Error(`Bad response shape (expected ${args.length}): ${(response.text ?? '').substring(0, 200)}`);
  }
  return result;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not set in .env.local');
    process.exit(1);
  }
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  // ── Section A ─────────────────────────────────────────────────────────────
  console.log('\n📦 Generating Section A expanded questions…');
  const tasksA: TEFTask[] = JSON.parse(readFileSync(DATA_A, 'utf-8'));
  const aNeeds = tasksA.filter(
    (t) => !t.expanded_questions?.length && t.suggested_questions?.length
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
  console.log('\n📦 Generating Section B counter-responses…');
  const tasksB: TEFTask[] = JSON.parse(readFileSync(DATA_B, 'utf-8'));
  const bNeeds = tasksB.filter(
    (t) => !t.suggested_counters?.length && (t.counter_arguments?.length ?? 0) > 1
  );
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
    }
    if (i < bNeeds.length - 1) await sleep(600);
  }
  writeFileSync(DATA_B, JSON.stringify(tasksB, null, 2), 'utf-8');
  console.log('  ✅ Section B saved');

  console.log('\n🎉 Done. Re-run is safe — already-generated tasks are skipped.');
}

main().catch((err) => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
