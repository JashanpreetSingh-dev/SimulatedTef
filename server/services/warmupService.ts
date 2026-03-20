import { connectDB } from '../db/connection';
import { WarmupUserProfile } from '../models/WarmupUserProfile';
import { WarmupSession } from '../models/WarmupSession';
import { geminiService } from '../../services/gemini';

// Static phrase library mirroring constants/warmupTopics.ts
// Keep in sync when topics are added or phrases are edited.
const TOPIC_PHRASES: Record<string, string[]> = {
  'se-presenter': ["Je m'appelle… et je viens de…", "J'habite à… depuis… ans.", "Dans ma vie quotidienne, je travaille comme…", "Ce qui me définit le mieux, c'est…", "En dehors du travail, j'aime surtout…", "Mon plus grand défi en ce moment, c'est…"],
  'routine-quotidienne': ["Je commence généralement ma journée par…", "Le matin, j'ai l'habitude de…", "Ce qui structure ma semaine, c'est…", "Le soir, je consacre du temps à…", "Ce que j'essaie de ne jamais sauter, c'est…", "Ma routine a changé depuis que…"],
  'famille': ["Dans ma famille, nous sommes… personnes.", "Je m'entends très bien avec… parce que…", "Ce qui unit notre famille, c'est surtout…", "Quand on se retrouve tous ensemble, on aime…", "La personne qui m'a le plus influencé, c'est…", "Pour moi, la famille signifie avant tout…"],
  'logement': ["J'habite dans un appartement / une maison situé(e)…", "Ce que j'apprécie le plus chez moi, c'est…", "Mon loyer s'élève à… par mois.", "Ce qui manque à mon logement actuel, c'est…", "Le quartier où je vis est plutôt…", "Idéalement, j'aimerais un logement qui…"],
  'repas-cuisine': ["En semaine, je mange plutôt…", "Le plat que je prépare le plus souvent, c'est…", "Ce que j'aime dans la cuisine, c'est…", "Je fais mes courses généralement…", "Un repas en famille, ça ressemble à…", "La cuisine que je préfère au restaurant, c'est…"],
  'loisirs': ["Pendant mon temps libre, je préfère…", "Ma passion depuis longtemps, c'est…", "Je consacre environ… heures par semaine à…", "Ce qui me détend vraiment, c'est…", "J'ai commencé à… il y a… ans et depuis…", "Ce que j'aimerais explorer comme nouveau loisir, c'est…"],
  'animaux': ["J'ai un(e)… qui s'appelle… depuis…", "Ce que j'aime le plus chez mon animal, c'est…", "Prendre soin d'un animal, ça demande…", "Avoir un animal de compagnie m'apporte…", "Pour moi, les animaux jouent un rôle important parce que…", "Si je pouvais adopter un autre animal, ce serait…"],
  'amis': ["Je me retrouve souvent avec mes amis pour…", "Mon ami(e) le/la plus proche, c'est… parce que…", "Quand je veux sortir, je propose généralement…", "Ce qui est important pour moi dans une amitié, c'est…", "Depuis mon arrivée au Canada, j'ai rencontré…", "Je garde le contact avec mes amis d'enfance en…"],
  'achats-commerces': ["Je fais mes courses principalement à…", "Ce que j'achète en ligne plutôt qu'en magasin, c'est…", "Quand je cherche un bon prix, je…", "Mon budget mensuel pour les achats courants est environ…", "Ce que je n'achète jamais sans comparer les prix, c'est…", "Le marché / l'épicerie que je préfère, c'est… parce que…"],
  'transports': ["Pour aller au travail, je prends généralement…", "Le trajet que je fais le plus souvent dure environ…", "Ce que j'apprécie dans les transports en commun, c'est…", "En hiver, se déplacer au Canada, c'est…", "Je préfère le métro / l'autobus parce que…", "Depuis que j'utilise…, mes déplacements sont…"],
  'meteo-saisons': ["La saison que je préfère au Canada, c'est… parce que…", "En hiver, les températures peuvent descendre jusqu'à…", "Ce qui m'a surpris dans le climat canadien, c'est…", "Quand il fait froid, j'aime surtout…", "Pour m'adapter aux hivers canadiens, j'ai appris à…", "L'été à Montréal / Ottawa / Toronto, c'est…"],
  'travail-ambitions': ["Dans mon domaine, ce qui me motive le plus c'est…", "À moyen terme, j'aimerais évoluer vers un poste de…", "Ce que je cherche dans un environnement de travail, c'est…", "L'expérience professionnelle qui m'a le plus formé(e), c'est…", "Pour atteindre mes objectifs, je compte…", "Ce qui distingue le marché du travail canadien, à mon avis, c'est…"],
  'etudes-formation': ["J'ai étudié… pendant… ans à…", "La formation qui m'a le plus apporté professionnellement, c'est…", "Au Québec / au Canada, le système scolaire fonctionne…", "Ce que j'aurais fait différemment dans mon parcours, c'est…", "Pour se reconvertir au Canada, il est souvent nécessaire de…", "La formation continue est importante pour moi parce que…"],
  'recherche-emploi': ["Lors de ma recherche d'emploi, j'ai constaté que…", "Le plus grand défi pour trouver un emploi au Canada, c'est…", "Pour préparer un entretien, je…", "Mon CV a été adapté au marché canadien en…", "Les compétences les plus recherchées dans mon domaine sont…", "Grâce à mon réseau professionnel, j'ai pu…"],
  'vie-bureau': ["Dans mon équipe, l'ambiance est plutôt…", "Ce qui me plaît dans la culture de travail au Canada, c'est…", "En réunion, j'essaie toujours de…", "Le télétravail a changé ma façon de travailler en…", "Quand il y a un conflit au bureau, je préfère…", "L'équilibre travail-vie personnelle ici, c'est…"],
  'immigration-integration': ["Ce qui m'a poussé(e) à immigrer au Canada, c'est…", "Les premières semaines après mon arrivée ont été…", "S'intégrer dans une nouvelle société, ça passe par…", "La langue française a été pour moi un atout parce que…", "Ce que j'aurais aimé savoir avant d'immigrer, c'est…", "L'aspect culturel qui m'a demandé le plus d'adaptation, c'est…"],
  'logement-canada': ["Trouver un logement à… n'est pas facile parce que…", "Le coût de la vie dans les grandes villes canadiennes…", "Pour louer un appartement, il faut généralement fournir…", "La différence entre un bail au Québec et ailleurs, c'est…", "Les droits des locataires au Canada incluent…", "Pour trouver mon logement actuel, j'ai utilisé…"],
  'systeme-sante-canada': ["Au Canada, les soins de santé sont couverts par…", "Pour avoir accès à la carte d'assurance maladie, il faut…", "Ce qui distingue le système de santé canadien, c'est…", "L'accès à un médecin de famille peut prendre…", "En cas d'urgence, on peut se rendre à…", "Les médicaments et les soins dentaires sont…"],
  'culture-canadienne': ["Ce qui m'a le plus frappé(e) dans la culture canadienne, c'est…", "Au Québec, la culture francophone se manifeste par…", "Les fêtes et traditions canadiennes que j'apprécie le plus…", "La diversité culturelle au Canada se ressent dans…", "Ce que les Canadiens valorisent beaucoup, c'est…", "Comparer la culture canadienne à la mienne, je dirais que…"],
  'environnement-ecologie': ["Pour réduire mon empreinte écologique, j'essaie de…", "Le changement climatique se ressent déjà dans…", "Les politiques environnementales au Canada…", "Ce que les individus peuvent faire concrètement, c'est…", "La question du recyclage au Québec est particulière parce que…", "Si on ne change pas nos habitudes, dans 20 ans…"],
  'vie-ville-campagne': ["Vivre en ville offre l'avantage de…", "La campagne attire ceux qui recherchent…", "Depuis la pandémie, beaucoup de gens ont décidé de…", "Le coût de la vie en région est souvent…", "Ce que je ne pourrais pas sacrifier en quittant la ville, c'est…", "Pour les familles avec enfants, la campagne présente…"],
  'benevolat': ["Je fais du bénévolat auprès de… parce que…", "S'engager dans sa communauté permet de…", "Le bénévolat m'a appris à…", "Les organismes communautaires au Canada jouent un rôle…", "Ce qui motive les bénévoles, c'est souvent…", "Pour quelqu'un qui arrive au Canada, le bénévolat est utile car…"],
  'medias-reseaux-sociaux': ["Je m'informe principalement via…", "Les réseaux sociaux ont changé la façon dont…", "Ce qui me préoccupe dans la désinformation, c'est…", "Je passe environ… heures par jour sur les réseaux sociaux.", "La liberté de la presse est importante parce que…", "Pour distinguer une vraie information d'une fausse, je…"],
  'education-enfants': ["Le système scolaire québécois / canadien fonctionne…", "Ce que j'apprécie dans l'éducation ici, c'est…", "Les parents jouent un rôle essentiel en…", "Les activités parascolaires permettent aux enfants de…", "Comparer l'éducation ici et dans mon pays d'origine, je dirais…", "Pour préparer un enfant à réussir, il est important de…"],
  'sante-habitudes': ["Pour rester en bonne santé, je fais attention à…", "Une alimentation équilibrée, pour moi, ça veut dire…", "Depuis que j'ai changé mon mode de vie, je…", "Le sommeil est crucial parce que…", "Ce que les Canadiens font bien en matière de santé publique, c'est…", "La prévention est plus importante que le traitement parce que…"],
  'sport-activites': ["Je pratique… régulièrement depuis…", "Le sport que j'aimerais apprendre au Canada, c'est…", "Faire de l'exercice m'aide à…", "L'hiver ne m'empêche pas de faire du sport parce que…", "Les activités sportives en famille, ça nous permet de…", "Pour rester motivé(e), j'ai besoin de…"],
  'bien-etre-stress': ["Quand je me sens stressé(e), j'ai tendance à…", "Ce qui m'aide le plus à décompresser, c'est…", "La santé mentale est un sujet qui…", "Depuis mon immigration, les sources de stress ont changé : maintenant…", "Pour trouver un équilibre entre vie pro et perso, je…", "Prendre soin de soi, pour moi, ça se traduit par…"],
  'voyages-destinations': ["Le voyage qui m'a le plus marqué(e), c'est…", "Ce que je recherche quand je voyage, c'est…", "Au Canada, j'aimerais encore visiter…", "Voyager permet de…", "La différence entre voyager en touriste et s'installer, c'est…", "Avant de partir en voyage, je prépare toujours…"],
  'technologie-quotidien': ["La technologie a simplifié ma vie en…", "L'outil numérique que j'utilise le plus, c'est…", "Ce qui m'inquiète dans notre dépendance à la technologie, c'est…", "L'intelligence artificielle va probablement changer…", "La protection des données personnelles est importante parce que…", "Pour les démarches administratives au Canada, la technologie permet de…"],
  'argent-budget': ["Pour gérer mon budget, j'utilise…", "Les dépenses qui ont le plus changé depuis mon arrivée, c'est…", "Le coût de la vie au Canada m'a surpris parce que…", "Pour économiser, j'ai pris l'habitude de…", "La différence entre le système bancaire canadien et celui de mon pays…", "Avoir un fonds d'urgence est essentiel parce que…"],
};

export function getTopicPhrases(topicId: string): string[] {
  return TOPIC_PHRASES[topicId] ?? [];
}

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
    phrases: string[],
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
      phrases.length
        ? `Phrases d'amorce suggérées au candidat: ${phrases.join(' / ')}.`
        : '',
      '',
      "Style de conversation:",
      "- chaleureux, coach bienveillant, jamais examinateur;",
      "- encourage beaucoup, reformule, donne le temps de parler;",
      "- pose des questions ouvertes en lien avec le sujet;",
      "- adapte le niveau de langue au niveau estimé du candidat.",
      weaknessHint,
      '',
      "À 60 secondes de la fin, si tu reçois une note interne t'indiquant qu'il reste une minute, commence à conclure doucement, à résumer et à encourager la personne pour la prochaine séance.",
    ].join('\n');
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

