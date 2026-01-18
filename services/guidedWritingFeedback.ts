import { WrittenTask } from '../types';
import { buildGuidedFeedbackPrompt, buildFeedbackRequestMessage } from './prompts/guidedWriting';
import { GoogleGenAI, Type } from '@google/genai';

// Get API key
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
const cleanApiKey = apiKey.trim();
const ai = new GoogleGenAI({ apiKey: cleanApiKey });

export interface GrammarCorrection {
  text: string;
  correction: string;
  explanation: string;
}

export interface GuidedFeedback {
  grammarCorrections: GrammarCorrection[];
  suggestions: string[];
  ideas: string[];
  structureFeedback: string;
  encouragement: string;
  progress: string;
}

// Cache for feedback to avoid redundant API calls
const feedbackCache = new Map<string, GuidedFeedback>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(text: string, taskId: string, section: 'A' | 'B'): string {
  return `${taskId}_${section}_${text.substring(0, 100)}_${text.length}`;
}

/**
 * Get on-demand feedback for guided writing
 */
export async function getOnDemandFeedback(
  text: string,
  task: WrittenTask,
  section: 'A' | 'B'
): Promise<GuidedFeedback> {
  // Check cache first
  const cacheKey = getCacheKey(text, task.id, section);
  const cached = feedbackCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const systemPrompt = buildGuidedFeedbackPrompt(section, task, text);
    const userMessage = buildFeedbackRequestMessage(section, task, text);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { parts: [{ text: systemPrompt }] },
        { parts: [{ text: userMessage }] }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grammarCorrections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  correction: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ['text', 'correction', 'explanation']
              }
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            ideas: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            structureFeedback: { type: Type.STRING },
            encouragement: { type: Type.STRING },
            progress: { type: Type.STRING }
          },
          required: ['grammarCorrections', 'suggestions', 'ideas', 'structureFeedback', 'encouragement', 'progress']
        },
        temperature: 0.7 // Slightly higher for more natural, encouraging tone
      }
    });

    let parsed: any;
    try {
      parsed = JSON.parse(response.text);
    } catch (e) {
      console.error('Failed to parse guided feedback JSON:', e);
      // Return default structure if parsing fails
      parsed = {
        grammarCorrections: [],
        suggestions: [],
        ideas: [],
        structureFeedback: 'Erreur lors de l\'analyse. Veuillez réessayer.',
        encouragement: 'Continue à écrire!',
        progress: 'Analyse en cours...'
      };
    }

    const feedback: GuidedFeedback = {
      grammarCorrections: Array.isArray(parsed.grammarCorrections)
        ? parsed.grammarCorrections
        : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      ideas: Array.isArray(parsed.ideas) ? parsed.ideas : [],
      structureFeedback: parsed.structureFeedback || '',
      encouragement: parsed.encouragement || '',
      progress: parsed.progress || ''
    };

    // Cache the result
    feedbackCache.set(cacheKey, feedback);
    
    // Clean up old cache entries after cache duration
    setTimeout(() => {
      feedbackCache.delete(cacheKey);
    }, CACHE_DURATION);

    return feedback;
  } catch (error: any) {
    console.error('Error getting guided feedback:', error);
    // Return default structure on error
    return {
      grammarCorrections: [],
      suggestions: [],
      ideas: [],
      structureFeedback: 'Une erreur est survenue lors de l\'analyse. Veuillez réessayer.',
      encouragement: 'Continue à écrire!',
      progress: 'Erreur lors de l\'analyse.'
    };
  }
}