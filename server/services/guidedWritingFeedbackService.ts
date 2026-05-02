/**
 * Server-side guided writing feedback (Gemini) so usage is recorded in aiUsageEvents.
 */

import { GoogleGenAI, Type } from '@google/genai';
import type { WrittenTask } from '../../types';
import { buildGuidedFeedbackPrompt, buildFeedbackRequestMessage } from '../../services/prompts/guidedWriting';
import { recordAiUsageFromGeminiResponse } from './aiUsageEventService';

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

const apiKey = (process.env.API_KEY || process.env.GEMINI_API_KEY || '').trim();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function getGuidedWritingFeedbackForUser(params: {
  userId: string;
  text: string;
  task: WrittenTask;
  section: 'A' | 'B';
}): Promise<GuidedFeedback> {
  const { userId, text, task, section } = params;

  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const systemPrompt = buildGuidedFeedbackPrompt(section, task, text);
  const userMessage = buildFeedbackRequestMessage(section, task, text);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { parts: [{ text: systemPrompt }] },
      { parts: [{ text: userMessage }] },
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
                explanation: { type: Type.STRING },
              },
              required: ['text', 'correction', 'explanation'],
            },
          },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          ideas: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          structureFeedback: { type: Type.STRING },
          encouragement: { type: Type.STRING },
          progress: { type: Type.STRING },
        },
        required: [
          'grammarCorrections',
          'suggestions',
          'ideas',
          'structureFeedback',
          'encouragement',
          'progress',
        ],
      },
      temperature: 0.7,
    },
  });

  void recordAiUsageFromGeminiResponse({
    source: 'guidedWritingFeedback',
    model: 'gemini-2.5-flash',
    response,
    userId,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.text ?? '{}');
  } catch (e) {
    console.error('[guidedWritingFeedback] JSON parse failed:', e);
    return {
      grammarCorrections: [],
      suggestions: [],
      ideas: [],
      structureFeedback: 'Erreur lors de l\'analyse. Veuillez réessayer.',
      encouragement: 'Continue à écrire!',
      progress: 'Analyse en cours...',
    };
  }

  const p = parsed as Record<string, unknown>;
  return {
    grammarCorrections: Array.isArray(p.grammarCorrections) ? (p.grammarCorrections as GrammarCorrection[]) : [],
    suggestions: Array.isArray(p.suggestions) ? (p.suggestions as string[]) : [],
    ideas: Array.isArray(p.ideas) ? (p.ideas as string[]) : [],
    structureFeedback: typeof p.structureFeedback === 'string' ? p.structureFeedback : '',
    encouragement: typeof p.encouragement === 'string' ? p.encouragement : '',
    progress: typeof p.progress === 'string' ? p.progress : '',
  };
}
