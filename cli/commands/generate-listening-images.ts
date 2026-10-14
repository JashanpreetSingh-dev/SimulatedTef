/**
 * Generate composite "quel dessin" images for Q1-4 of listening tests where
 * the original source images were unavailable (tests 11-15).
 *
 * For each missing question:
 *   1. Calls Gemini to derive 4 scene descriptions (1 correct + 3 distractors)
 *   2. Renders an HTML 2×2 panel via the gstack browse tool
 *   3. Screenshots → writes PNG to /tmp
 *   4. Uploads to S3 and stores questionImageS3Key in MongoDB
 *
 * Usage:
 *   npx tsx cli/commands/generate-listening-images.ts [--tests 11,12,13,14,15] [--prod]
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

const isProd = process.argv.includes('--prod');
dotenv.config({ path: resolve(process.cwd(), isProd ? '.env.local.prod' : '.env') });

import { execSync } from 'child_process';
import { existsSync, writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { readFileSync } from 'fs';
import { GoogleGenAI } from '@google/genai';
import { uploadFile, isS3Configured } from '../../server/services/s3Service';
import { getDB, closeDatabase } from '../utils/db';

const SCRAPED_DIR = join(process.cwd(), 'scraped');
const TMP_DIR = join(process.env.TEMP || process.env.TMPDIR || process.env.TMP || '/tmp', 'listening-images');
const BROWSE = (() => {
  const ext = process.platform === 'win32' ? '.exe' : '';
  const bin = `browse${ext}`;
  const root = process.cwd();
  const local = join(root, `.claude/skills/gstack/browse/dist/${bin}`);
  const global_ = join(process.env.HOME || process.env.USERPROFILE || '', `.claude/skills/gstack/browse/dist/${bin}`);
  if (existsSync(local)) return local;
  if (existsSync(global_)) return global_;
  throw new Error('browse binary not found — run gstack setup first');
})();

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
if (!apiKey) throw new Error('API_KEY / GEMINI_API_KEY not set');
const ai = new GoogleGenAI({ apiKey });

// ── Scene description generation ─────────────────────────────────────────────

interface Panel {
  letter: 'A' | 'B' | 'C' | 'D';
  emoji: string;
  scene: string;    // 3-6 word English scene description
  isCorrect: boolean;
}

async function generatePanels(
  transcriptFr: string,
  correctIndex: number,   // 0-3
): Promise<Panel[]> {
  const letters = ['A', 'B', 'C', 'D'] as const;

  const prompt = `You are helping create a French listening comprehension exam (TEF Canada).

The student hears this French dialogue and must pick which of 4 drawings (A, B, C, D) matches it:

DIALOGUE:
${transcriptFr}

The correct answer is option ${letters[correctIndex]}.

Generate 4 panel descriptions for a 2×2 composite illustration.
Panel ${letters[correctIndex]} should clearly depict the correct scene from the dialogue.
The other 3 panels should be plausible everyday scenes that are clearly different.

Return ONLY a JSON array with exactly 4 objects in order A, B, C, D:
[
  { "letter": "A", "emoji": "🍽️", "scene": "waiter serving food at table" },
  { "letter": "B", "emoji": "✈️", "scene": "passenger at airport gate" },
  ...
]

Rules:
- scene: 3-6 words in English, describing a simple visual scene
- emoji: single emoji that best represents the scene (no skin-tone modifiers)
- Make distractors feel like real TEF exam options (everyday French life situations)
- Panel ${letters[correctIndex]} MUST match the dialogue exactly`;

  // Retry up to 5 times with backoff for 429/503 transient errors
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { temperature: 0.4 },
      });

      const raw = response.text?.trim() || '';
      const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      const panels: Panel[] = JSON.parse(jsonStr);
      return panels.map((p, i) => ({ ...p, isCorrect: i === correctIndex }));
    } catch (err: any) {
      lastError = err;
      const msg: string = err?.message || JSON.stringify(err);
      // Parse retry delay from quota error, or use exponential backoff
      const retryMatch = msg.match(/retry[^0-9]*(\d+)[\.\d]*s/i);
      const delaySec = retryMatch ? parseInt(retryMatch[1]) + 3 : Math.min(30 * 2 ** attempt, 120);
      const code = err?.status?.code || err?.code;
      if (code === 429 || code === 503 || msg.includes('503') || msg.includes('429') || msg.includes('UNAVAILABLE') || msg.includes('RESOURCE_EXHAUSTED')) {
        console.log(`      ⏳ Gemini rate limit/503, waiting ${delaySec}s (attempt ${attempt + 1}/5)...`);
        await new Promise(r => setTimeout(r, delaySec * 1000));
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error('Gemini failed after 5 attempts');
}

// ── HTML renderer ─────────────────────────────────────────────────────────────

function buildHtml(panels: Panel[], questionNumber: number, testNumber: number): string {
  const panelHtml = panels.map(p => `
    <div class="panel ${p.isCorrect ? 'correct' : ''}">
      <div class="letter">${p.letter}</div>
      <div class="emoji">${p.emoji}</div>
      <div class="scene">${p.scene}</div>
    </div>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 560px;
    height: 420px;
    background: #fff;
    font-family: 'Segoe UI', Arial, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;
  }
  .panel {
    border: 2px solid #d1d5db;
    border-radius: 10px;
    background: #f9fafb;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 14px 10px;
    min-height: 158px;
    position: relative;
  }
  .letter {
    position: absolute;
    top: 7px;
    left: 10px;
    font-size: 14px;
    font-weight: 700;
    color: #4b5563;
    background: #e5e7eb;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .emoji {
    font-size: 54px;
    line-height: 1;
    margin-bottom: 8px;
    margin-top: 10px;
  }
  .scene {
    font-size: 11.5px;
    color: #374151;
    text-align: center;
    line-height: 1.35;
    max-width: 180px;
    font-weight: 500;
  }
</style>
</head>
<body>
  <div class="grid">${panelHtml}</div>
</body>
</html>`;
}

// ── Screenshot via browse ─────────────────────────────────────────────────────

function screenshot(htmlPath: string, outPath: string): void {
  execSync(
    `"${BROWSE}" load-html "${htmlPath}" && "${BROWSE}" viewport 560x420 && "${BROWSE}" screenshot "${outPath}" --selector body`,
    { stdio: 'pipe', timeout: 30_000 }
  );
}

// ── S3 key ────────────────────────────────────────────────────────────────────

function s3Key(taskId: string, questionNumber: number): string {
  return `images/listening_section1/${taskId}/${taskId}_q${questionNumber}_composite.png`;
}

// ── Per-question processing ───────────────────────────────────────────────────

async function processQuestion(
  taskId: string,
  questionNumber: number,
  transcriptFr: string,
  correctIndex: number,
  testNumber: number,
  db: any,
): Promise<void> {
  console.log(`    Q${questionNumber} (correct=${['A','B','C','D'][correctIndex]}): generating panels...`);

  const panels = await generatePanels(transcriptFr, correctIndex);
  const html = buildHtml(panels, questionNumber, testNumber);

  const htmlPath = join(TMP_DIR, `${taskId}_q${questionNumber}.html`);
  const pngPath = join(TMP_DIR, `${taskId}_q${questionNumber}.png`);
  writeFileSync(htmlPath, html, 'utf8');

  try {
    screenshot(htmlPath, pngPath);
  } catch (e: any) {
    throw new Error(`screenshot failed: ${e.message}`);
  }

  if (!existsSync(pngPath)) throw new Error(`PNG not created at ${pngPath}`);

  const pngBuffer = readFileSync(pngPath);
  const key = s3Key(taskId, questionNumber);
  await uploadFile(pngBuffer, key, 'image/png');

  // Update question in MongoDB
  const questionId = `${taskId}_q${questionNumber}`;
  await db.collection('questions').updateOne(
    { questionId },
    { $set: { questionImageS3Key: key, updatedAt: new Date().toISOString() } }
  );

  console.log(`    Q${questionNumber}: ✅ uploaded → ${key}`);

  // Cleanup temp files
  try { unlinkSync(htmlPath); } catch {}
  try { unlinkSync(pngPath); } catch {}
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const testsIdx = args.indexOf('--tests');
  const testNumbers = testsIdx >= 0
    ? args[testsIdx + 1].split(',').map(Number)
    : [11, 12, 13, 14, 15];

  if (!isS3Configured()) throw new Error('S3 not configured');
  if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true });

  const db = await getDB();

  for (const n of testNumbers) {
    const scrapedPath = join(SCRAPED_DIR, `listening_test_${n}.json`);
    if (!existsSync(scrapedPath)) {
      console.warn(`⚠️  Scraped file not found for test ${n}, skipping`);
      continue;
    }

    const data = JSON.parse(readFileSync(scrapedPath, 'utf8'));
    const taskId = `listening_v2_${n}`;
    console.log(`\n── Test ${n} (${taskId}) ─────────────────`);

    // Check which Q1-4 already have images in DB
    for (let qi = 0; qi < 4; qi++) {
      const q = data.questions[qi];
      const questionId = `${taskId}_q${q.number}`;

      const existing = await db.collection('questions').findOne(
        { questionId },
        { projection: { questionImageS3Key: 1 } }
      );

      if (existing?.questionImageS3Key) {
        console.log(`    Q${q.number}: already has image (${existing.questionImageS3Key}), skipping`);
        continue;
      }

      try {
        await processQuestion(taskId, q.number, q.transcript.fr, q.correctAnswer, n, db);
      } catch (err: any) {
        console.error(`    Q${q.number}: ❌ ${err.message}`);
      }

      // Free tier: 5 RPM → wait 14s between calls to stay under quota
      await new Promise(r => setTimeout(r, 14_000));
    }
  }

  await closeDatabase();
  console.log('\nDone.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
