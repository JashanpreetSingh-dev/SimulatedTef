/**
 * Import scraped listening tests into MongoDB + upload assets to S3.
 *
 * For each scraped/listening_test_<N>.json it will:
 *   1. Download the MP3 → upload to S3 → store s3Key in ListeningTask.audioUrl (presigned at serve time)
 *   2. For Q1-4 with questionImage: download PNG → upload to S3 → store questionImageS3Key
 *   3. Create 1 ListeningTask + 40 Question documents
 *
 * Usage:
 *   npx tsx cli/commands/import-listening-tests.ts [--start 4] [--end 18] [--dry-run] [--prod]
 *
 * Flags:
 *   --dry-run   Print what would be created, write nothing to DB or S3
 *   --prod      Use .env.local.prod
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

const isProd = process.argv.includes('--prod');
dotenv.config({ path: resolve(process.cwd(), isProd ? '.env.local.prod' : '.env') });

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { getDB, closeDatabase } from '../utils/db';
import { uploadFile, isS3Configured, getPresignedUrl } from '../../server/services/s3Service';

const SCRAPED_DIR = join(process.cwd(), 'scraped');
const DRY_RUN = process.argv.includes('--dry-run');

// ── S3 key helpers ──────────────────────────────────────────────────────────

function audioS3Key(taskId: string, ext = 'mp3'): string {
  return `audio/listening-global/${taskId}.${ext}`;
}

function questionImageS3Key(taskId: string, questionNumber: number): string {
  return `images/listening_section1/${taskId}/${taskId}_q${questionNumber}_composite.png`;
}

// ── Downloader ───────────────────────────────────────────────────────────────

async function downloadBuffer(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const ct = res.headers.get('content-type') || 'application/octet-stream';
  const ab = await res.arrayBuffer();
  return { buffer: Buffer.from(ab), contentType: ct.split(';')[0].trim() };
}

// ── Task ID ──────────────────────────────────────────────────────────────────

function taskId(testNumber: number): string {
  return `listening_v2_${testNumber}`;
}

// ── Main import ──────────────────────────────────────────────────────────────

async function importTest(testNumber: number): Promise<void> {
  const filePath = join(SCRAPED_DIR, `listening_test_${testNumber}.json`);
  if (!existsSync(filePath)) {
    throw new Error(`Scraped file not found: ${filePath} — run scrape-listening first`);
  }

  const data = JSON.parse(readFileSync(filePath, 'utf8'));
  const tid = taskId(testNumber);

  console.log(`\n── Listening${testNumber} (${tid}) ──────────────────────`);
  console.log(`   Audio URL : ${data.audioUrl}`);
  console.log(`   Questions : ${data.questions.length}`);
  console.log(`   Time limit: ${data.timeLimitSec}s`);

  if (!isS3Configured()) {
    throw new Error('S3 not configured — set AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY in .env');
  }

  // ── 1. Download + upload MP3 ──────────────────────────────────────────────
  const mp3Key = audioS3Key(tid);
  let finalAudioUrl: string;

  if (DRY_RUN) {
    console.log(`   [dry-run] Would upload MP3 → s3://${mp3Key}`);
    finalAudioUrl = `DRY_RUN_S3_KEY:${mp3Key}`;
  } else {
    console.log(`   Downloading MP3...`);
    const { buffer: mp3Buffer } = await downloadBuffer(data.audioUrl);
    console.log(`   Uploading MP3 (${(mp3Buffer.length / 1024 / 1024).toFixed(1)} MB) → ${mp3Key}`);
    await uploadFile(mp3Buffer, mp3Key, 'audio/mpeg');
    // Store the S3 key; presigned URL is generated at serve time by getPresignedUrl
    // We store an internal s3:// URI so the server knows to generate a presigned URL
    finalAudioUrl = `s3://${mp3Key}`;
  }

  // ── 2. Prepare questions ──────────────────────────────────────────────────
  const now = new Date().toISOString();
  const questionDocs: any[] = [];

  for (const q of data.questions) {
    const qId = `${tid}_q${q.number}`;
    const hasCompositeImage = !!q.questionImage;

    let qImgS3Key: string | undefined;

    if (hasCompositeImage) {
      qImgS3Key = questionImageS3Key(tid, q.number);
      if (DRY_RUN) {
        console.log(`   [dry-run] Q${q.number}: Would upload composite image → s3://${qImgS3Key}`);
      } else {
        try {
          console.log(`   Q${q.number}: Downloading composite image...`);
          const { buffer: imgBuffer, contentType } = await downloadBuffer(q.questionImage);
          await uploadFile(imgBuffer, qImgS3Key, contentType || 'image/png');
        } catch (err: any) {
          console.warn(`   ⚠️  Q${q.number}: Could not download image (${err.message}) — will use text opts`);
          qImgS3Key = undefined;
        }
      }
    }

    // Build explanation from transcript
    const explanation = [
      `🇫🇷 ${q.transcript.fr}`,
      `🇬🇧 ${q.transcript.en}`,
      q.transcript.vocab ? `💡 ${q.transcript.vocab}` : '',
    ].filter(Boolean).join('\n\n');

    questionDocs.push({
      questionId: qId,
      taskId: tid,
      type: 'listening',
      questionNumber: q.number,
      question: q.question,
      options: q.opts,
      correctAnswer: q.correctAnswer,
      explanation,
      transcriptFr: q.transcript.fr,
      transcriptEn: q.transcript.en,
      vocabHints: q.transcript.vocab || undefined,
      ...(qImgS3Key ? { questionImageS3Key: qImgS3Key } : {}),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ── 3. Write to DB ────────────────────────────────────────────────────────
  if (DRY_RUN) {
    console.log(`   [dry-run] Would upsert ListeningTask ${tid}`);
    console.log(`   [dry-run] Would upsert ${questionDocs.length} questions`);
    return;
  }

  const db = await getDB();

  // Upsert task
  const taskDoc = {
    taskId: tid,
    type: 'listening',
    prompt: `TEF Canada Listening Mock Test — ${testNumber - 3}`, // e.g. test 4 → "Mock Test 1"
    audioUrl: finalAudioUrl,
    timeLimitSec: data.timeLimitSec,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection('listeningTasks').updateOne(
    { taskId: tid },
    { $set: taskDoc },
    { upsert: true }
  );
  console.log(`   ✅ Upserted ListeningTask: ${tid}`);

  // Upsert questions
  let upserted = 0;
  for (const qDoc of questionDocs) {
    await db.collection('questions').updateOne(
      { questionId: qDoc.questionId },
      { $set: qDoc },
      { upsert: true }
    );
    upserted++;
  }
  console.log(`   ✅ Upserted ${upserted} questions for ${tid}`);
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const startIdx = args.indexOf('--start');
  const endIdx = args.indexOf('--end');

  const start = startIdx >= 0 ? parseInt(args[startIdx + 1]) : 4;
  const end = endIdx >= 0 ? parseInt(args[endIdx + 1]) : 18;

  if (DRY_RUN) console.log('\n⚠️  DRY RUN — no DB writes, no S3 uploads\n');

  const results: { test: number; ok: boolean; error?: string }[] = [];

  for (let n = start; n <= end; n++) {
    try {
      await importTest(n);
      results.push({ test: n, ok: true });
    } catch (err: any) {
      console.error(`\n❌ Listening${n}: ${err.message}`);
      results.push({ test: n, ok: false, error: err.message });
    }
  }

  await closeDatabase();

  console.log('\n=== Import Summary ===');
  results.forEach(r => console.log(`  Listening${r.test}: ${r.ok ? '✅ OK' : `❌ ${r.error}`}`));

  const failed = results.filter(r => !r.ok);
  if (failed.length) process.exit(1);
  console.log('\nAll tests imported successfully.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
