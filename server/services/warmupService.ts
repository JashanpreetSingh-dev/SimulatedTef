import { connectDB } from '../db/connection';
import { WarmupUserProfile } from '../models/WarmupUserProfile';
import { WarmupSession } from '../models/WarmupSession';
import { geminiService } from '../../services/gemini';

const WARMUP_PROFILE_COLLECTION = 'warmupUserProfiles';
const WARMUP_SESSIONS_COLLECTION = 'warmupSessions';

export const warmupService = {
  async getOrCreateProfile(userId: string): Promise<WarmupUserProfile> {
    const db = await connectDB();
    const collection = db.collection<WarmupUserProfile>(WARMUP_PROFILE_COLLECTION);

    const existing = await collection.findOne({ userId });
    if (existing) {
      return existing;
    }

    const now = new Date();
    const profile: WarmupUserProfile = {
      userId,
      levelEstimate: 'A2',
      levelHistory: ['A2'],
      strengths: [],
      weaknesses: [],
      topicsExplored: [],
      totalSessions: 0,
      lastSessionDate: undefined,
      updatedAt: now,
    };

    await collection.insertOne(profile as any);
    return profile;
  },

  async computeStreak(userId: string, localDate: string): Promise<number> {
    const db = await connectDB();
    const collection = db.collection<WarmupSession>(WARMUP_SESSIONS_COLLECTION);

    const today = localDate;
    const cursor = collection
      .find({ userId, status: 'completed' })
      .sort({ date: -1 })
      .limit(30);

    const sessions = await cursor.toArray();
    if (!sessions.length) {
      return 0;
    }

    const toDate = (d: string) => new Date(`${d}T00:00:00Z`);
    const target = toDate(today);

    let streak = 0;
    let expected = target;

    for (const session of sessions) {
      const sessionDate = toDate(session.date);
      const diffDays = Math.round(
        (expected.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 0) {
        streak += 1;
        expected = new Date(expected.getTime() - 24 * 60 * 60 * 1000);
      } else if (diffDays === 1 && streak === 0) {
        // Handle case where user completed yesterday but not today yet
        expected = new Date(expected.getTime() - 24 * 60 * 60 * 1000);
        streak += 1;
      } else {
        break;
      }
    }

    return streak;
  },

  buildSystemPrompt(
    profile: WarmupUserProfile,
    topic: string,
    keywords: string[],
  ): string {
    const level = profile.levelEstimate || 'A2';
    const strengths = profile.strengths || [];
    const weaknesses = profile.weaknesses || [];
    const recentTopics = (profile.topicsExplored || []).slice(-5);
    const topWeakness = weaknesses[0];

    const weaknessHint = topWeakness
      ? `\n\nPoints faibles à travailler: ${topWeakness}.\nIntègre doucement des rappels et des occasions de pratiquer ce point faible, sans jamais mettre la pression.`
      : '';

    return [
      'Tu es un·e tuteur·trice de français bienveillant·e pour un·e candidat·e au TEF Canada.',
      "Ton rôle n'est PAS d'évaluer ou de noter, mais d'aider la personne à s'échauffer à l'oral de façon détendue.",
      "Dès que la connexion s'ouvre, prends l'initiative : dis bonjour chaleureusement, présente-toi en une phrase, puis pose une première question ouverte sur le sujet du jour pour inviter le candidat à parler.",
      '',
      `Niveau estimé actuel: ${level}.`,
      strengths.length
        ? `Points forts: ${strengths.join(', ')}.`
        : "Points forts: non encore déterminés précisément — garde un ton encourageant et simple.",
      weaknesses.length
        ? `Points à améliorer connus: ${weaknesses.join(', ')}.`
        : 'Points à améliorer: encore en cours de découverte.',
      recentTopics.length
        ? `Sujets récemment abordés: ${recentTopics.join(', ')}.`
        : 'Peu de sujets précédents — considère cette séance comme un premier échauffement.',
      '',
      `Sujet du jour: ${topic}.`,
      `Mots-clés suggérés: ${keywords.join(', ')}.`,
      '',
      "Style de conversation:",
      "- chaleureux, coach bienveillant, jamais examinateur;",
      "- encourage beaucoup, reformule, donne le temps de parler;",
      "- pose des questions ouvertes en lien avec le sujet et les mots-clés;",
      "- adapte le niveau de langue au niveau estimé du candidat.",
      weaknessHint,
      '',
      "À 60 secondes de la fin, si tu reçois une note interne t'indiquant qu'il reste une minute, commence à conclure doucement, à résumer et à encourager la personne pour la prochaine séance.",
    ].join('\n');
  },

  async generateKeywords(topic: string, level: string): Promise<string[]> {
    try {
      const prompt = [
        'Tu génères des mots-clés pour une séance de mise en route orale en français (TEF Canada).',
        '',
        `Sujet: ${topic}`,
        `Niveau approximatif: ${level}`,
        '',
        'Objectif:',
        '- Proposer 4 à 5 mots-clés ou mini-expressions utiles pour parler de ce sujet à ce niveau.',
        '- Mélanger vocabulaire concret et quelques connecteurs simples.',
        '',
        'Contraintes:',
        '- Réponds UNIQUEMENT en JSON, sans texte autour.',
        '- Format: { "keywords": ["...", "...", ...] }',
        '- Chaque entrée doit être une courte expression (1 à 3 mots).',
      ].join('\n');

      const raw = await geminiService.generateText(prompt);

      if (typeof raw === 'string' && raw.trim()) {
        try {
          const text = raw.replace(/```json\n?|\n?```/g, '').trim();
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed.keywords)) {
            return parsed.keywords.map((k: any) => String(k)).slice(0, 5);
          }
        } catch {
          const parts = raw
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter(Boolean);
          if (parts.length) {
            return parts.slice(0, 5);
          }
        }
      }
    } catch (error) {
      console.error('Error generating warmup keywords:', error);
    }

    // Fallback: static keywords if Gemini fails
    return ['conversation', 'quotidien', 'travail', 'famille', 'projets'];
  },

  async markAbandonedIfStale(userId: string, localDate: string): Promise<void> {
    const db = await connectDB();
    const collection = db.collection<WarmupSession>(WARMUP_SESSIONS_COLLECTION);

    const THIRTY_MINUTES_MS = 30 * 60 * 1000;
    const now = new Date();
    const threshold = new Date(now.getTime() - THIRTY_MINUTES_MS);

    await collection.updateMany(
      {
        userId,
        date: localDate,
        status: 'active',
        createdAt: { $lt: threshold },
      } as any,
      {
        $set: {
          status: 'abandoned',
        },
      },
    );
  },

  async generateCorrections(
    userTranscript: string,
    level: string,
  ): Promise<{ original: string; corrected: string; explanation: string }[]> {
    const wordCount = userTranscript.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 10) return [];

    const prompt = [
      'Tu es un·e correcteur·trice bienveillant·e de français pour un·e candidat·e au TEF Canada.',
      '',
      `Niveau estimé: ${level || 'A2-B1'}.`,
      '',
      'Voici les phrases prononcées par le candidat pendant la séance:',
      userTranscript,
      '',
      'Ta mission:',
      '- Repère 2 à 3 phrases ou segments où le candidat a fait une erreur ou utilisé une formulation maladroite.',
      '- Pour chaque extrait, propose une reformulation naturelle et explique brièvement pourquoi.',
      '',
      'Format de sortie STRICT (JSON uniquement, pas de texte autour):',
      '[',
      '  {',
      '    "original": "ce que le candidat a dit",',
      '    "corrected": "la version correcte ou plus naturelle",',
      '    "explanation": "explication courte en français (1 phrase max)"',
      '  }',
      ']',
      '',
      'Important:',
      '- Maximum 3 corrections.',
      '- Choisis les erreurs les plus utiles à corriger pour le TEF.',
      '- Reste bienveillant·e et concis·e.',
      '- Si le candidat a très bien parlé et qu\'il n\'y a pas d\'erreur notable, retourne un tableau vide [].',
    ].join('\n');

    try {
      const raw = await geminiService.generateText(prompt);
      if (typeof raw === 'string' && raw.trim()) {
        const text = raw.replace(/```json\n?|\n?```/g, '').trim();
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed)) {
            return parsed
              .filter((c: any) => c.original && c.corrected && c.explanation)
              .slice(0, 3)
              .map((c: any) => ({
                original: String(c.original),
                corrected: String(c.corrected),
                explanation: String(c.explanation),
              }));
          }
        }
      }
    } catch (error) {
      console.error('Error generating warmup corrections:', error);
    }

    return [];
  },

  async generateSessionFeedback(
    transcript: string,
    levelEstimate: string,
  ): Promise<{
    wentWell: string;
    practiceTip: string;
    levelNote: string;
    topicsCovered: string[];
    levelAtSession: string;
  }> {
    const promptLines = [
      'Tu es un·e coach bienveillant·e de français pour un·e candidat·e au TEF Canada.',
      "On vient de terminer une séance d'échauffement à l'oral (warm-up).",
      '',
      `Niveau estimé avant la séance: ${levelEstimate || 'A2'}.`,
      '',
      'TRANSCRIPT (tour à tour, utilisateur + IA):',
      transcript || '(vide)',
      '',
      'Ta mission:',
      '- Analyser rapidement la performance globale (fluide, hésitations, variété de vocabulaire, complexité des phrases).',
      "- Produire un retour ENCOURAGEANT, concret et sans jargon d'examen.",
      '',
      'Format de sortie STRICT (JSON uniquement, pas de texte autour):',
      '{',
      '  "wentWell": "une phrase ou un petit paragraphe en français, ton chaleureux, sur ce qui a bien fonctionné",',
      '  "practiceTip": "un conseil concret en français pour la prochaine séance, ciblé mais bienveillant",',
      '  "levelNote": "une phrase courte en français qui situe globalement le niveau ressenti (ex: \\"Tu te situes plutôt autour de B1 pour ce type de situation\\")",',
      '  "topicsCovered": ["liste de 1 à 5 mots/expressions en français résumant les thèmes abordés"],',
      '  "levelAtSession": "niveau estimé global (A1, A2, B1, B2, C1, C2) basé sur cette séance uniquement"',
      '}',
      '',
      'Important:',
      "- Garde un ton positif, même si le niveau est encore modeste.",
      "- Sois précis et exploitable: l'utilisateur doit savoir sur quoi se concentrer demain.",
    ];

    const prompt = promptLines.join('\n');

    try {
      const raw = await geminiService.generateText(prompt);
      let parsed: any = null;

      if (typeof raw === 'string' && raw.trim()) {
        try {
          const text = raw.replace(/```json\n?|\n?```/g, '').trim();
          parsed = JSON.parse(text);
        } catch {
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              parsed = JSON.parse(match[0]);
            } catch {
              // ignore
            }
          }
        }
      }

      const safe = parsed && typeof parsed === 'object' ? parsed : {};

      return {
        wentWell: String(safe.wentWell || "Tu as pris la parole en français — c'est déjà excellent. Continue comme ça !"),
        practiceTip: String(
          safe.practiceTip ||
            "Pour la prochaine séance, choisis un petit aspect précis à travailler (par exemple les connecteurs comme 'd'abord', 'ensuite', 'par contre') et essaie de les utiliser consciemment.",
        ),
        levelNote: String(
          safe.levelNote ||
            "Sur cette séance, tu te situes plutôt autour de A2-B1: une bonne base, avec encore de la marge pour gagner en fluidité et en variété.",
        ),
        topicsCovered: Array.isArray(safe.topicsCovered)
          ? safe.topicsCovered.map((t: any) => String(t)).filter(Boolean)
          : [],
        levelAtSession: String(safe.levelAtSession || levelEstimate || 'A2'),
      };
    } catch (error) {
      console.error('Error generating warmup session feedback:', error);
      return {
        wentWell:
          "Tu as pris le temps de parler en français aujourd'hui, bravo. Chaque séance compte pour te sentir plus à l'aise.",
        practiceTip:
          "Demain, essaie de parler un peu plus longtemps sur un exemple concret (une journée récente, une situation au travail, un souvenir de voyage).",
        levelNote:
          "Cette séance ressemble à un niveau A2-B1: tu peux déjà communiquer, et chaque jour tu gagnes en confiance.",
        topicsCovered: [],
        levelAtSession: levelEstimate || 'A2',
      };
    }
  },
};

