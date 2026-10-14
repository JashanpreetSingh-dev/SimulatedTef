/**
 * Scrape listening tests from external HTML pages (Listening4.html – Listening18.html).
 *
 * Usage:
 *   npx tsx cli/commands/scrape-listening.ts [--start 4] [--end 18] [--out scraped]
 *
 * Produces one JSON file per test: scraped/listening_test_<N>.json
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'https://rosybrown-emu-315233.hostingersite.com/wp-content/uploads/Listenings/Listening';
const DEFAULT_OUT = join(process.cwd(), 'scraped');

interface ScrapedQuestion {
  number: number;
  question: string;
  questionImage?: string; // composite image URL (Q1-4)
  opts: string[];
  correctAnswer: number; // 0-3
  transcript: {
    fr: string;
    en: string;
    vocab: string;
  };
}

interface ScrapedTest {
  testNumber: number;
  sourceUrl: string;
  audioUrl: string;
  timeLimitSec: number;
  questions: ScrapedQuestion[];
  scrapedAt: string;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function extractAudioUrl(html: string, pageUrl: string): string {
  const m = html.match(/<source\s+src="([^"]+)"\s+type="audio\/mpeg"/);
  if (!m) throw new Error('Could not find audio <source> tag');
  const src = m[1];
  if (src.startsWith('http')) return src;
  // Resolve relative URL against page base
  const base = new URL(pageUrl);
  return new URL(src, base).href;
}

function extractTimerSeconds(html: string): number {
  // e.g. ⏱️ 50:00  or  id="timerDisplay"...50:00
  const m = html.match(/(\d{2}):00<\/div>/);
  if (m) return parseInt(m[1]) * 60;
  return 3000; // default 50 min
}

function extractQuizData(html: string, testNumber: number): ScrapedQuestion[] {
  // Pull the raw JS array literal for quizData from the script block
  const scriptMatch = html.match(/const\s+quizData\s*=\s*(\[[\s\S]*?\]);\s*(?:\/\/|function|let |const |var )/);
  if (!scriptMatch) throw new Error(`Could not extract quizData from Listening${testNumber}.html`);

  // Safe eval: we only expose an empty sandbox and grab the return value
  // eslint-disable-next-line no-new-func
  const raw: any[] = new Function(`return ${scriptMatch[1]}`)();

  return raw.map((item, idx) => {
    const q: ScrapedQuestion = {
      number: idx + 1,
      question: String(item.q || '').trim(),
      opts: (item.opts as string[]).map(String),
      correctAnswer: Number(item.ans),
      transcript: {
        fr: String(item.fr || '').replace(/\\n/g, '\n').trim(),
        en: String(item.en || '').replace(/\\n/g, '\n').trim(),
        vocab: String(item.vocab || '').trim(),
      },
    };
    if (item.image) q.questionImage = String(item.image);
    return q;
  });
}

async function scrapeTest(testNumber: number, outDir: string): Promise<ScrapedTest> {
  const url = `${BASE_URL}${testNumber}.html`;
  console.log(`  Fetching ${url}...`);
  const html = await fetchHtml(url);

  const audioUrl = extractAudioUrl(html, url);
  const timeLimitSec = extractTimerSeconds(html);
  const questions = extractQuizData(html, testNumber);

  const result: ScrapedTest = {
    testNumber,
    sourceUrl: url,
    audioUrl,
    timeLimitSec,
    questions,
    scrapedAt: new Date().toISOString(),
  };

  const outPath = join(outDir, `listening_test_${testNumber}.json`);
  writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`  ✅ Saved ${questions.length} questions → ${outPath}`);
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const startIdx = args.indexOf('--start');
  const endIdx = args.indexOf('--end');
  const outIdx = args.indexOf('--out');

  const start = startIdx >= 0 ? parseInt(args[startIdx + 1]) : 4;
  const end = endIdx >= 0 ? parseInt(args[endIdx + 1]) : 18;
  const outDir = outIdx >= 0 ? args[outIdx + 1] : DEFAULT_OUT;

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  console.log(`\nScraping Listening${start}.html → Listening${end}.html`);
  console.log(`Output directory: ${outDir}\n`);

  const results: { test: number; ok: boolean; error?: string }[] = [];

  for (let n = start; n <= end; n++) {
    try {
      await scrapeTest(n, outDir);
      results.push({ test: n, ok: true });
    } catch (err: any) {
      console.error(`  ❌ Listening${n}: ${err.message}`);
      results.push({ test: n, ok: false, error: err.message });
    }
    // Small delay to avoid hammering the server
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n=== Scrape Summary ===');
  results.forEach(r => console.log(`  Listening${r.test}: ${r.ok ? '✅ OK' : `❌ ${r.error}`}`));
  const failed = results.filter(r => !r.ok);
  if (failed.length) {
    console.log(`\n${failed.length} test(s) failed. Re-run with --start/--end to retry specific tests.`);
    process.exit(1);
  }
  console.log('\nAll tests scraped successfully.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
