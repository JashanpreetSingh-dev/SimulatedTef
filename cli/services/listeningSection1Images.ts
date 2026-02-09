/**
 * Generate and save Section 1 ("quel dessin") option images using Gemini text + image models.
 * For each Section 1 question: produce 4 English image prompts from the French script,
 * call Gemini image model 4 times, save to public/listening_section1/ and optionally upload to S3.
 */

import { GoogleGenAI } from '@google/genai';
import { getDB } from '../utils/db';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { s3Service } from '../../server/services/s3Service';

const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-image';
const GEMINI_TEXT_MODEL = 'gemini-2.0-flash';

const PROMPT_SYSTEM = `You are helping create image prompts for a French listening exam (TEF Canada). Section 1 questions ask "Quel dessin correspond à la situation?" (Which drawing matches the situation?). The audio is a short French description. You must output exactly 4 English image prompts: one that correctly illustrates the situation described in the audio, and three plausible distractors (similar style but different situation). Use simple, clear descriptions suitable for line-drawing style images. Output ONLY a JSON array of exactly 4 strings, in order [promptA, promptB, promptC, promptD], with the CORRECT scene at the index given by correctAnswer (0=A, 1=B, 2=C, 3=D). Each prompt must start with: "Simple line drawing, TEF exam style: " and then describe the scene in English. No other text or markdown.`;

export interface Section1QuestionInput {
  questionId: string;
  taskId: string;
  questionNumber: number;
  correctAnswer: number;
  audioScript: string;
}

/**
 * Use Gemini text to produce 4 English image prompts from the French audio script.
 * Returns [promptA, promptB, promptC, promptD] with correct at index correctAnswer.
 */
export async function generateImagePrompts(
  input: Section1QuestionInput,
  apiKey: string
): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey });
  const userContent = `French audio script:
${input.audioScript}

correctAnswer index (0-3): ${input.correctAnswer}

Output a JSON array of exactly 4 English image prompts: the correct scene at index ${input.correctAnswer}, and 3 plausible distractor scenes at the other indices.`;

  const response = await ai.models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: [
      { role: 'user', parts: [{ text: PROMPT_SYSTEM + '\n\n' + userContent }] },
    ],
  });

  const text =
    (response as { text?: string }).text ??
    (response as any).candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || typeof text !== 'string') {
    throw new Error('No text in Gemini response');
  }
  const trimmed = text.replace(/^```json?\s*|\s*```$/g, '').trim();
  const parsed = JSON.parse(trimmed) as string[];
  if (!Array.isArray(parsed) || parsed.length !== 4) {
    throw new Error(`Expected 4 prompts, got: ${trimmed.slice(0, 200)}`);
  }
  return parsed.map((p) => (typeof p === 'string' ? p : String(p)));
}

/**
 * Generate one image with Gemini image model (generateContent) and return image bytes.
 */
export async function generateOneImage(prompt: string, apiKey: string): Promise<Buffer> {
  const ai = new GoogleGenAI({ apiKey });
  const fullPrompt = prompt.startsWith('Simple line drawing') ? prompt : `Simple line drawing, TEF exam style: ${prompt}`;

  const response = await ai.models.generateContent({
    model: GEMINI_IMAGE_MODEL,
    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
  });

  const parts = (response as any).candidates?.[0]?.content?.parts;
  if (!parts?.length) {
    throw new Error('No content in Gemini image response');
  }
  for (const part of parts) {
    const data = part.inlineData?.data;
    if (data) {
      return Buffer.from(data, 'base64');
    }
  }
  throw new Error('No image data in Gemini image response');
}

/**
 * Find listening task IDs that have Section 1 questions but are missing optionImageS3Keys
 * (or have incomplete keys). Use this to re-run image generation for existing tasks.
 */
export async function getTaskIdsMissingSection1Images(): Promise<string[]> {
  const db = await getDB();
  const audioItemsAll = await db
    .collection('audioItems')
    .find({ sectionId: 1 })
    .project({ taskId: 1, audioId: 1 })
    .toArray();
  const taskIdsWithSection1 = [...new Set((audioItemsAll as any[]).map((a) => a.taskId))];

  const missing: string[] = [];
  for (const taskId of taskIdsWithSection1) {
    const section1AudioIds = (audioItemsAll as any[])
      .filter((a) => a.taskId === taskId)
      .map((a) => a.audioId);
    if (section1AudioIds.length === 0) continue;

    const section1Questions = await db
      .collection('questions')
      .find({ taskId, isActive: true, audioId: { $in: section1AudioIds } })
      .toArray();
    const needsImages = (section1Questions as any[]).some(
      (q) => !q.optionImageS3Keys || !Array.isArray(q.optionImageS3Keys) || q.optionImageS3Keys.length !== 4
    );
    if (section1Questions.length > 0 && needsImages) {
      missing.push(taskId);
    }
  }
  return missing.sort();
}

/**
 * Generate and save Section 1 images for a task. Loads questions and audioItems from DB,
 * filters to Section 1 (sectionId === 1), then for each question: Gemini prompts -> Gemini image model x4 -> save to publicDir.
 */
export async function generateAndSaveSection1Images(
  taskId: string,
  publicDir: string,
  apiKey: string
): Promise<{ questionsProcessed: number; filesWritten: number }> {
  const db = await getDB();
  const audioItems = await db
    .collection('audioItems')
    .find({ taskId })
    .sort({ sectionId: 1, audioId: 1 })
    .toArray();
  const questions = await db
    .collection('questions')
    .find({ taskId, isActive: true })
    .sort({ questionNumber: 1 })
    .toArray();

  const audioByAudioId = new Map<string | null, { sectionId: number; audioScript: string }>();
  for (const item of audioItems as any[]) {
    audioByAudioId.set(item.audioId, {
      sectionId: item.sectionId,
      audioScript: item.audioScript || '',
    });
  }

  const section1Questions = questions.filter((q: any) => {
    const audio = q.audioId ? audioByAudioId.get(q.audioId) : null;
    return audio?.sectionId === 1;
  });

  if (section1Questions.length === 0) {
    console.log(`No Section 1 questions found for task ${taskId}.`);
    return { questionsProcessed: 0, filesWritten: 0 };
  }

  const outDir = join(publicDir, 'listening_section1');
  await mkdir(outDir, { recursive: true });

  const s3Configured = s3Service.isS3Configured();
  if (!s3Configured) {
    console.warn(`\n⚠️  S3 is not configured. Section 1 images will only be saved locally.`);
    console.warn(`   Please set AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables to upload to S3.`);
  }

  let filesWritten = 0;
  const letters = ['A', 'B', 'C', 'D'];
  const questionsCollection = db.collection('questions');

  for (const q of section1Questions as any[]) {
    const audio = q.audioId ? audioByAudioId.get(q.audioId) : null;
    if (!audio?.audioScript) {
      console.warn(`Skipping ${q.questionId}: no audio script`);
      continue;
    }

    console.log(`  Question ${q.questionNumber}: generating 4 image prompts...`);
    const prompts = await generateImagePrompts(
      {
        questionId: q.questionId,
        taskId: q.taskId,
        questionNumber: q.questionNumber,
        correctAnswer: q.correctAnswer,
        audioScript: audio.audioScript,
      },
      apiKey
    );

    const optionImageS3Keys: string[] = [];
    for (let i = 0; i < 4; i++) {
      console.log(`    Generating image ${letters[i]}...`);
      const buffer = await generateOneImage(prompts[i], apiKey);
      const filename = `${taskId}_q${q.questionNumber}_${letters[i]}.png`;
      const filepath = join(outDir, filename);
      await writeFile(filepath, buffer);
      filesWritten++;

      if (s3Configured) {
        try {
          const key = s3Service.generateSection1ImageKey(taskId, q.questionNumber, letters[i]);
          await s3Service.uploadFile(buffer, key, 'image/png');
          optionImageS3Keys.push(key);
        } catch (err: any) {
          console.error(`    ⚠️ Failed to upload ${filename} to S3:`, err.message);
        }
      }
    }

    if (s3Configured && optionImageS3Keys.length === 4) {
      try {
        await questionsCollection.updateOne(
          { questionId: q.questionId, taskId },
          { $set: { optionImageS3Keys, updatedAt: new Date().toISOString() } }
        );
        console.log(`    ☁️ Updated question ${q.questionId} with S3 image keys`);
      } catch (err: any) {
        console.error(`    ⚠️ Failed to update question with optionImageS3Keys:`, err.message);
      }
    }
  }

  return { questionsProcessed: section1Questions.length, filesWritten };
}
