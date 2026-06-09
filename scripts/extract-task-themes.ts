/**
 * One-time script to extract a short human-readable theme from each oral task
 * and write it back into the knowledge-base JSON files.
 *
 * Strategy:
 *   Section B  – parse theme from counter_arguments[0] (format: "TOPIC – Liste de…")
 *   Section A  – parse from prompt regex first; fall back to Gemini vision for the rest
 *
 * Run: npm run extract-themes
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
const PUBLIC  = join(ROOT, 'public');

interface TEFTask {
  id: number;
  section: string;
  prompt: string;
  title: string | null;
  theme?: string;
  image: string;
  time_limit_sec: number;
  suggested_questions?: string[];
  counter_arguments?: string[];
}

// ─── helpers ────────────────────────────────────────────────────────────────

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(?:^|\s|'|-)\S/g, (c) => c.toUpperCase())
    .trim();
}

/** Section B: scan all counter_arguments for "TOPIC – Liste de contre-arguments..." */
function extractSectionBTheme(task: TEFTask): string | null {
  for (const line of task.counter_arguments ?? []) {
    const match = line.match(/^(.+?)\s*[–—-]\s*Liste/i);
    if (match) return toTitleCase(match[1].trim());
  }
  return null;
}

/**
 * Section A: try to pull the topic from the prompt.
 *   "publicité pour des cours de cuisine" → "Cours De Cuisine"
 *   "publicité pour une agence évenementielle" → "Agence Évenementielle"
 */
function extractSectionAThemeFromPrompt(task: TEFTask): string | null {
  const prompt = task.prompt;

  // Pattern: "publicité pour [article] X" / "annonce pour [article] X"
  const forMatch = prompt.match(
    /(?:publicité|annonce)\s+pour\s+(?:une?\s+|des?\s+|les?\s+|du\s+|un\s+bénévol(?:at)?\s*)?(.+?)(?:\s+et\s+vous|,|\.\s*Vous)/i
  );
  if (forMatch) return toTitleCase(forMatch[1].trim());

  // Pattern: "publicité sur X"
  const surMatch = prompt.match(
    /publicité\s+sur\s+(.+?)(?:\s+et\s+vous|,|\.\s*Vous)/i
  );
  if (surMatch) return toTitleCase(surMatch[1].trim());

  // Pattern: "cette offre d'emploi"
  if (/offre d'emploi/i.test(prompt)) return 'Offre D\'Emploi';

  // Pattern: "annonce pour du bénévolat"
  if (/b[eé]n[eé]vol/i.test(prompt)) return 'Bénévolat';

  return null;
}

// ─── Gemini vision ───────────────────────────────────────────────────────────

async function extractThemeFromImage(
  ai: GoogleGenAI,
  imagePath: string
): Promise<string> {
  const absPath = join(PUBLIC, imagePath.replace(/^\//, ''));
  const imageBytes = readFileSync(absPath);
  const base64 = imageBytes.toString('base64');
  const ext = imagePath.split('.').pop()?.toLowerCase() ?? 'png';
  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        parts: [
          {
            inlineData: { mimeType, data: base64 },
          },
          {
            text: 'This is a French TEF Canada oral exam document. In 2-4 words, state ONLY the topic/theme of the document (e.g. "Cours de yoga", "Club de randonnée", "Offre d\'emploi"). Answer in French, title-case, no punctuation.',
          },
        ],
      },
    ],
  });

  return (response.text ?? '')
    .trim()
    .replace(/[.!?]$/, '');
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not set in .env.local');
    process.exit(1);
  }
  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  // ── Section B ────────────────────────────────────────────────────────────
  console.log('\n📦 Processing Section B…');
  const tasksB: TEFTask[] = JSON.parse(readFileSync(DATA_B, 'utf-8'));
  let bUpdated = 0;
  const bNeedsVision: TEFTask[] = [];
  for (const task of tasksB) {
    if (task.theme && !/^Topic \d+$/.test(task.theme)) continue;
    const theme = extractSectionBTheme(task);
    if (theme) {
      task.theme = theme;
      bUpdated++;
    } else {
      bNeedsVision.push(task);
    }
  }
  if (bNeedsVision.length > 0) {
    console.log(`  🔭 Need vision API for ${bNeedsVision.length} Section B task(s)`);
    for (let i = 0; i < bNeedsVision.length; i++) {
      const task = bNeedsVision[i];
      process.stdout.write(`  [${i + 1}/${bNeedsVision.length}] B#${task.id} → `);
      try {
        const theme = await extractThemeFromImage(ai, task.image);
        task.theme = theme;
        bUpdated++;
        console.log(theme);
      } catch (err: any) {
        console.log(`❌ ${err?.message ?? err}`);
        task.theme = `Topic B${task.id}`;
      }
      if (i < bNeedsVision.length - 1) await sleep(500);
    }
  }
  writeFileSync(DATA_B, JSON.stringify(tasksB, null, 2), 'utf-8');
  console.log(`  ✅ Section B done — ${bUpdated} themes written`);

  // ── Section A ────────────────────────────────────────────────────────────
  console.log('\n📦 Processing Section A…');
  const tasksA: TEFTask[] = JSON.parse(readFileSync(DATA_A, 'utf-8'));

  const needsVision: TEFTask[] = [];
  let aFromPrompt = 0;

  for (const task of tasksA) {
    if (task.theme && !/^Topic \d+$/.test(task.theme)) continue; // skip fallbacks
    const theme = extractSectionAThemeFromPrompt(task);
    if (theme) {
      task.theme = theme;
      aFromPrompt++;
    } else {
      needsVision.push(task);
    }
  }
  console.log(`  ✅ Extracted from prompt: ${aFromPrompt}`);
  console.log(`  🔭 Need vision API: ${needsVision.length}`);

  for (let i = 0; i < needsVision.length; i++) {
    const task = needsVision[i];
    process.stdout.write(`  [${i + 1}/${needsVision.length}] A#${task.id} → `);
    try {
      const theme = await extractThemeFromImage(ai, task.image);
      task.theme = theme;
      console.log(theme);
    } catch (err: any) {
      console.log(`❌ ${err?.message ?? err}`);
      task.theme = `Topic ${task.id}`; // fallback so the field is always present
    }
    if (i < needsVision.length - 1) await sleep(500); // stay under rate limit
  }

  writeFileSync(DATA_A, JSON.stringify(tasksA, null, 2), 'utf-8');
  console.log(`\n  ✅ Section A done — ${aFromPrompt + needsVision.length} themes written`);

  console.log('\n🎉 All done. Re-run is safe (already-set themes are skipped).');
}

main().catch((err) => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
