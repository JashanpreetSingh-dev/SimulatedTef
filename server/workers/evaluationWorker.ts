/**
 * Background worker for processing AI evaluation jobs
 */

import { Worker } from 'bullmq';
import { connection, redis } from '../config/redis';
import { EvaluationJobData, EvaluationJobResult } from '../jobs/jobTypes';
import { geminiService } from '../../services/gemini';
import { resultsService } from '../services/resultsService';
import * as taskService from '../services/taskService';
import { generateTaskId, TaskType } from '../../types/task';
import { SavedResult, OralExpressionData, WrittenExpressionData } from '../../types';
import { connectDB, closeDB } from '../db/connection';

let worker: Worker<EvaluationJobData, EvaluationJobResult> | null = null;

/**
 * Start the evaluation worker
 */
export function startWorker(): Worker<EvaluationJobData, EvaluationJobResult> {
  if (worker) {
    console.log('Worker already started');
    return worker;
  }

  worker = new Worker<EvaluationJobData, EvaluationJobResult>(
    'evaluation',
    async (job) => {
      const {
        section,
        prompt,
        transcript: providedTranscript,
        audioBlob,
        scenarioId,
        timeLimitSec,
        questionCount,
        userId,
        recordingId,
        mode,
        title,
        taskPartA,
        taskPartB,
        eo2RemainingSeconds,
        fluencyAnalysis: providedFluencyAnalysis,
      } = job.data;

      try {
        // Update job progress
        await job.updateProgress(5); // 5% - Starting
        
        // Publish progress event to Redis for SSE clients
        const channel = `evaluation:${job.id}:progress`;
        try {
          await redis.publish(channel, JSON.stringify({ status: 'active', progress: 5 }));
        } catch (pubError) {
          console.warn(`Failed to publish progress event for job ${job.id}:`, pubError);
          // Continue processing even if publish fails
        }

        console.log(`Processing evaluation job ${job.id} for user ${userId}`);

        let transcript = providedTranscript;
        let fluencyAnalysis = providedFluencyAnalysis;

        // For OralExpression: transcribe audio if audioBlob is provided and transcript is not
        if (section === 'OralExpression' && audioBlob && !transcript) {
          await job.updateProgress(15); // 15% - Transcribing
          try {
            await redis.publish(channel, JSON.stringify({ status: 'active', progress: 15 }));
          } catch (pubError) {
            console.warn(`Failed to publish progress event for job ${job.id}:`, pubError);
          }

          console.log(`Transcribing audio for job ${job.id}...`);
          
          // Extract base64 data (remove data:audio/wav;base64, prefix if present)
          const base64Data = audioBlob.split(',')[1] || audioBlob;
          
          // Directly call Gemini API with base64 (bypass blobToBase64 which uses FileReader)
          // This is more efficient in Node.js since we already have base64
          const { GoogleGenAI, Type } = await import('@google/genai');
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
            throw new Error('GEMINI_API_KEY not found in environment');
          }
          const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
          
          const response = await (ai as any).models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{
              parts: [{
                inlineData: {
                  mimeType: "audio/wav",
                  data: base64Data
                }
              }, {
                text: [
                  "Transcribe this TEF Canada oral exam audio. First voice = CANDIDATE (label \"User:\"). Second voice = EXAMINER (label \"Examiner:\").",
                  "",
                  "Tasks:",
                  "1) Diarize speakers, produce clean French transcript with natural spacing.",
                  "2) Prefix each utterance with \"User:\" or \"Examiner:\".",
                  "3) Retain both speakers' contributions.",
                  "4) Analyze User's speech for fluency: hesitations, fillers, pauses, self-corrections.",
                  "",
                  "Return ONLY valid JSON:",
                  "{",
                  "  \"transcript\": string,  // diarized dialogue: 'User: ...' and 'Examiner: ...'",
                  "  \"fluency_analysis\": {",
                  "    \"hesitation_rate\": \"low\"|\"medium\"|\"high\",",
                  "    \"filler_words_per_min\": number,",
                  "    \"average_pause_seconds\": number,",
                  "    \"self_corrections\": number,",
                  "    \"fluency_comment\": string",
                  "  }",
                  "}"
                ].join("\n")
              }]
            }],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  transcript: { type: Type.STRING },
                  fluency_analysis: {
                    type: Type.OBJECT,
                    properties: {
                      hesitation_rate: { type: Type.STRING },
                      filler_words_per_min: { type: Type.NUMBER },
                      average_pause_seconds: { type: Type.NUMBER },
                      self_corrections: { type: Type.NUMBER },
                      fluency_comment: { type: Type.STRING },
                    },
                  },
                },
              },
            }
          });

          let parsed: any;
          try {
            parsed = response.text ? JSON.parse(response.text) : {};
          } catch (e) {
            console.error('❌ Failed to parse transcription JSON:', e);
            throw new Error('Failed to parse transcription response');
          }

          const transcriptionResult = {
            transcript: (parsed?.transcript ?? '').toString().trim(),
            fluency_analysis: parsed?.fluency_analysis && typeof parsed.fluency_analysis === 'object'
              ? parsed.fluency_analysis
              : undefined,
          };
          transcript = transcriptionResult.transcript || '';
          fluencyAnalysis = transcriptionResult.fluency_analysis || providedFluencyAnalysis;
          
          console.log(`✅ Transcription completed for job ${job.id}, transcript length: ${transcript.length}`);
          
          await job.updateProgress(30); // 30% - Transcription complete
          try {
            await redis.publish(channel, JSON.stringify({ status: 'active', progress: 30 }));
          } catch (pubError) {
            console.warn(`Failed to publish progress event for job ${job.id}:`, pubError);
          }
        } else if (!transcript) {
          throw new Error('Either transcript or audioBlob must be provided');
        }

        // Call Gemini API for evaluation (this is the slow part)
        await job.updateProgress(40); // 40% - Starting evaluation
        try {
          await redis.publish(channel, JSON.stringify({ status: 'active', progress: 40 }));
        } catch (pubError) {
          console.warn(`Failed to publish progress event for job ${job.id}:`, pubError);
        }
        
        const result = await geminiService.evaluateResponse(
          section,
          prompt,
          transcript,
          scenarioId,
          timeLimitSec,
          questionCount,
          mode,
          taskPartA,
          taskPartB,
          eo2RemainingSeconds,
          fluencyAnalysis
        );

        await job.updateProgress(80); // 80% - Evaluation complete
        try {
          await redis.publish(channel, JSON.stringify({ status: 'active', progress: 80 }));
        } catch (pubError) {
          console.warn(`Failed to publish progress event for job ${job.id}:`, pubError);
        }

        // Determine resultType and module
        const resultType: 'practice' | 'mockExam' = job.data.mockExamId ? 'mockExam' : 'practice';
        const module: 'oralExpression' | 'writtenExpression' = section === 'OralExpression' ? 'oralExpression' : 'writtenExpression';

        // Save tasks to normalized storage and create references
        const taskReferences: { taskA?: { taskId: string; type: TaskType }; taskB?: { taskId: string; type: TaskType } } = {};
        
        if (taskPartA) {
          const taskAType: TaskType = section === 'OralExpression' ? 'oralA' : 'writtenA';
          const taskAId = generateTaskId(taskAType, taskPartA);
          await taskService.saveTask(taskAType, taskPartA);
          taskReferences.taskA = { taskId: taskAId, type: taskAType };
        }
        
        if (taskPartB) {
          const taskBType: TaskType = section === 'OralExpression' ? 'oralB' : 'writtenB';
          const taskBId = generateTaskId(taskBType, taskPartB);
          await taskService.saveTask(taskBType, taskPartB);
          taskReferences.taskB = { taskId: taskBId, type: taskBType };
        }

        // Build moduleData based on section
        let moduleData: OralExpressionData | WrittenExpressionData;
        
        if (section === 'OralExpression') {
          // For oral expression, transcript is stored at top-level (result.transcript)
          // Evaluation is stored at top-level (result.evaluation)
          // moduleData is not needed - we can determine type from result.module
          moduleData = undefined;
        } else {
          // WrittenExpression
          moduleData = {
            type: 'writtenExpression',
            ...(mode === 'partA' || mode === 'full' ? {
              sectionA: {
                text: job.data.writtenSectionAText || '',
                result: mode === 'partA' ? result : undefined,
              }
            } : {}),
            ...(mode === 'partB' || mode === 'full' ? {
              sectionB: {
                text: job.data.writtenSectionBText || '',
                result: mode === 'partB' ? result : undefined,
              }
            } : {}),
          };
        }

        // Build the result object with new structure
        // For oral expression, moduleData is not needed (transcript/evaluation at top level)
        // For written expression, moduleData contains sectionA/sectionB.text
        const resultToSave: SavedResult = {
          _id: undefined, // Will be generated by MongoDB
          userId,
          resultType,
          mode: mode as 'partA' | 'partB' | 'full',
          module,
          title,
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          taskReferences,
          evaluation: result,
          ...(moduleData && { moduleData }), // Only include if needed (written expression)
          recordingId,
          transcript,
          ...(job.data.mockExamId && { mockExamId: job.data.mockExamId }),
        };

        // Save result to database
        // For mock exams, use upsert to update any existing placeholder instead of creating duplicate
        let savedResult: SavedResult;
        if (job.data.mockExamId) {
          savedResult = await resultsService.upsertMockExamResult(resultToSave);
        } else {
          savedResult = await resultsService.create(resultToSave);
        }

        // Track usage for written expression (non-mock exam practice) - D2C users only
        // D2C users can only do guided learning (partA or partB), not full exams
        if (module === 'writtenExpression' && !job.data.mockExamId) {
          const { getTodayUTC } = await import('../models/usage');
          const today = getTodayUTC();
          const db = await connectDB();

          // Check if user is D2C (no orgId) by checking existing usage records or results
          // If user has orgId in any usage record, they're B2B and we don't track written expression usage
          const existingUsage = await db.collection('usage').findOne({ userId });
          const hasOrgId = existingUsage?.orgId !== null && existingUsage?.orgId !== undefined;
          
          // Only track usage for D2C users (no orgId)
          if (!hasOrgId) {
            // Track based on mode: partA increments Section A, partB increments Section B
            // Full mode should not be allowed for D2C users, but if it happens, track both
            const updateFields: any = {
              $set: { updatedAt: new Date().toISOString() },
              $setOnInsert: { createdAt: new Date().toISOString() }
            };
            
            if (mode === 'partA') {
              updateFields.$inc = { writtenExpressionSectionAUsed: 1 };
            } else if (mode === 'partB') {
              updateFields.$inc = { writtenExpressionSectionBUsed: 1 };
            } else if (mode === 'full') {
              // Full mode should not be allowed for D2C, but if it happens, track both sections
              updateFields.$inc = { 
                writtenExpressionSectionAUsed: 1,
                writtenExpressionSectionBUsed: 1
              };
            }
            
            if (updateFields.$inc) {
              await db.collection('usage').updateOne(
                { userId, date: today },
                updateFields,
                { upsert: true }
              );
            }
          }
        }

        await job.updateProgress(100); // 100% - Complete
        
        // Publish completion event
        try {
          await redis.publish(channel, JSON.stringify({ 
            status: 'completed', 
            progress: 100,
            resultId: savedResult._id as string
          }));
        } catch (pubError) {
          console.warn(`Failed to publish completion event for job ${job.id}:`, pubError);
          // Continue even if publish fails - job is still completed
        }

        console.log(`Evaluation job ${job.id} completed, result ID: ${savedResult._id}`);

        // Return result ID
        return {
          resultId: savedResult._id as string,
          success: true,
        };
      } catch (error: any) {
        console.error(`Evaluation job ${job.id} failed:`, error);
        
        // Publish failure event
        const channel = `evaluation:${job.id}:progress`;
        try {
          await redis.publish(channel, JSON.stringify({ 
            status: 'failed', 
            error: error.message || 'Evaluation failed'
          }));
        } catch (pubError) {
          console.warn(`Failed to publish failure event for job ${job.id}:`, pubError);
          // Continue even if publish fails
        }
        
        // Job failed - will be retried automatically by BullMQ
        throw error;
      }
    },
    {
      connection: {
        host: connection.host,
        port: connection.port,
        ...(connection.password && { password: connection.password }),
      },
      concurrency: 12, // Process 12 jobs simultaneously (increased from 5 for better throughput)
      limiter: {
        max: 20, // Max 20 jobs per second (increased from 10)
        duration: 1000, // 1 second (rate limiting)
      },
    }
  );

  // Worker event handlers
  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  worker.on('active', (job) => {
    console.log(`Job ${job.id} is now active`);
  });

  console.log('Evaluation worker started');

  return worker;
}

/**
 * Stop the evaluation worker gracefully
 */
export async function stopWorker(): Promise<void> {
  if (worker) {
    console.log('Stopping evaluation worker...');
    await worker.close();
    worker = null;
    console.log('Evaluation worker stopped');
  }
  // Close database connection
  await closeDB();
}

// If this file is run directly, start the worker
if (import.meta.url === `file://${process.argv[1]}`) {
  startWorker();
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await stopWorker();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await stopWorker();
    process.exit(0);
  });
}

