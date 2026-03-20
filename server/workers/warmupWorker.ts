import { Worker } from 'bullmq';
import { connection } from '../config/redis';
import { WarmupMemoryJobData } from '../jobs/jobTypes';
import { connectDB } from '../db/connection';
import { WarmupUserProfile } from '../models/WarmupUserProfile';
import { geminiService } from '../../services/gemini';

let worker: Worker<WarmupMemoryJobData, void> | null = null;

export function startWarmupWorker(): Worker<WarmupMemoryJobData, void> {
  if (worker) {
    console.log('Warmup worker already started');
    return worker;
  }

  worker = new Worker<WarmupMemoryJobData, void>(
    'warmup-profile',
    async (job) => {
      const { userId, sessionId, transcript, feedback, currentProfile } = job.data;

      try {
        const db = await connectDB();
        const collection = db.collection<WarmupUserProfile>('warmupUserProfiles');

        const existing =
          currentProfile ||
          (await collection.findOne({
            userId,
          }));

        const baseProfile: WarmupUserProfile =
          existing ??
          ({
            userId,
            levelEstimate: 'A2',
            levelHistory: ['A2'],
            strengths: [],
            weaknesses: [],
            topicsExplored: [],
            totalSessions: 0,
            lastSessionDate: undefined,
            updatedAt: new Date(),
          } as WarmupUserProfile);

        const promptLines = [
          'Tu es un·e coach de français chargé·e de maintenir un profil mémoire pour un·e candidat·e au TEF Canada.',
          '',
          'Profil actuel (JSON):',
          JSON.stringify(
            {
              levelEstimate: baseProfile.levelEstimate,
              strengths: baseProfile.strengths,
              weaknesses: baseProfile.weaknesses,
              topicsExplored: baseProfile.topicsExplored,
              totalSessions: baseProfile.totalSessions,
              lastSessionDate: baseProfile.lastSessionDate,
            },
            null,
            2,
          ),
          '',
          'Dernière séance:',
          `- SessionId: ${sessionId}`,
          `- Feedback coach (JSON): ${JSON.stringify(feedback)}`,
          '',
          'TRANSCRIPT COMPLET (utilisateur + IA):',
          transcript || '(vide)',
          '',
          'Ta mission:',
          "- Proposer une mise à jour du profil après cette séance, sous forme de DELTA JSON (pas le profil entier).",
          '',
          'Format STRICT de sortie (JSON, sans texte autour):',
          '{',
          '  "levelEstimate": "nouveau niveau global ou même valeur si inchangé (A1, A2, B1, B2, C1, C2)",',
          '  "strengthsDelta": ["élément à AJOUTER dans strengths (facultatif)"],',
          '  "weaknessesDelta": ["élément à AJOUTER dans weaknesses (facultatif)"],',
          '  "topicsDelta": ["nouveaux sujets abordés à AJOUTER dans topicsExplored"],',
          '  "lastSessionDate": "YYYY-MM-DD de la séance actuelle"',
          '}',
          '',
          'Règles:',
          "- Ne supprime rien du profil précédent, tu ne fais qu’AJOUTER ou ajuster le niveau.",
          "- Si tu n’es pas sûr·e d’un champ, garde la même valeur (par exemple, levelEstimate).",
        ];

        const prompt = promptLines.join('\n');

        const response = await geminiService.evaluateResponse(
          'OralExpression',
          prompt,
          '',
        );

        const text = (response as any)?.feedback || '';
        let delta: any = null;

        if (typeof text === 'string' && text.trim()) {
          try {
            delta = JSON.parse(text);
          } catch {
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
              try {
                delta = JSON.parse(match[0]);
              } catch {
                // ignore
              }
            }
          }
        }

        const safeDelta = delta && typeof delta === 'object' ? delta : {};

        const levelEstimate = String(
          safeDelta.levelEstimate || baseProfile.levelEstimate || 'A2',
        );
        const strengthsDelta: string[] = Array.isArray(safeDelta.strengthsDelta)
          ? safeDelta.strengthsDelta.map((s: any) => String(s))
          : [];
        const weaknessesDelta: string[] = Array.isArray(safeDelta.weaknessesDelta)
          ? safeDelta.weaknessesDelta.map((s: any) => String(s))
          : [];
        const topicsDelta: string[] = Array.isArray(safeDelta.topicsDelta)
          ? safeDelta.topicsDelta.map((t: any) => String(t))
          : [];

        const lastSessionDate: string | undefined =
          typeof safeDelta.lastSessionDate === 'string' &&
          safeDelta.lastSessionDate.trim()
            ? safeDelta.lastSessionDate.trim()
            : baseProfile.lastSessionDate;

        const now = new Date();

        await collection.updateOne(
          { userId },
          {
            $set: {
              userId,
              levelEstimate,
              lastSessionDate,
              updatedAt: now,
            },
            $push: {
              levelHistory: levelEstimate,
              ...(strengthsDelta.length && { strengths: { $each: strengthsDelta } }),
              ...(weaknessesDelta.length && { weaknesses: { $each: weaknessesDelta } }),
              ...(topicsDelta.length && { topicsExplored: { $each: topicsDelta } }),
            } as any,
            $inc: {
              totalSessions: 1,
            },
          },
          { upsert: true },
        );
      } catch (error) {
        console.error(`Warmup profile job ${job.id} failed:`, error);
        throw error;
      }
    },
    {
      connection: {
        host: connection.host,
        port: connection.port,
        ...(connection.password && { password: connection.password }),
      },
      concurrency: 3,
    },
  );

  worker.on('completed', (job) => {
    console.log(`Warmup profile job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Warmup profile job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Warmup worker error:', err);
  });

  console.log('Warmup worker started');

  return worker;
}

export async function stopWarmupWorker(): Promise<void> {
  if (!worker) return;
  console.log('Stopping warmup worker...');
  await worker.close();
  worker = null;
  console.log('Warmup worker stopped');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startWarmupWorker();

  process.on('SIGTERM', async () => {
    await stopWarmupWorker();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await stopWarmupWorker();
    process.exit(0);
  });
}

