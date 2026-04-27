/**
 * Quiz generation service — uses Gemini to create targeted MCQ quizzes
 * from a list of student weaknesses.
 */

import { GoogleGenAI, Type } from '@google/genai';

const apiKey = (process.env.API_KEY || process.env.GEMINI_API_KEY || '').trim();

export interface WeaknessLabel {
  weakness: string;
  displayLabel: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  weakness: string;
}

export interface GeneratedQuiz {
  weaknessLabels: WeaknessLabel[];
  questions: QuizQuestion[];
}

/**
 * Generate a 15-question MCQ quiz targeting the given weaknesses via Gemini.
 * Retries once on failure.
 */
export async function generateQuizFromWeaknesses(
  weaknesses: string[],
): Promise<GeneratedQuiz> {
  if (!apiKey) {
    throw new Error('Gemini API key not found in environment');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a C1-level French language examiner for TEF Canada. The student has these recurring weaknesses: "${weaknesses.join(', ')}". Generate 15 multiple-choice questions that target these weaknesses. All questions must be C1 difficulty. Each question must target one of the listed weaknesses.
Return JSON with:
- weaknessLabels: array of objects { weakness: string (exact match from input), displayLabel: string (short friendly English label, e.g. "The subjunctive" not "incorrect use of subjunctive in subordinate clauses") }
- questions: array of exactly 15 objects { id: string (uuid v4 format), question: string (French), options: string[] (exactly 4), correctIndex: number (0-3), explanation: string (English, one concise sentence), weakness: string (exact match from input) }`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      weaknessLabels: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            weakness: { type: Type.STRING },
            displayLabel: { type: Type.STRING },
          },
          required: ['weakness', 'displayLabel'],
        },
      },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctIndex: { type: Type.NUMBER },
            explanation: { type: Type.STRING },
            weakness: { type: Type.STRING },
          },
          required: [
            'id',
            'question',
            'options',
            'correctIndex',
            'explanation',
            'weakness',
          ],
        },
      },
    },
    required: ['weaknessLabels', 'questions'],
  };

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await (ai as any).models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.4,
        },
      });

      const parsed: GeneratedQuiz = JSON.parse(response.text);
      return parsed;
    } catch (err: any) {
      lastError = err;
      if (attempt === 0) {
        console.warn('Quiz generation attempt 1 failed, retrying:', err.message);
      }
    }
  }

  throw lastError ?? new Error('Quiz generation failed');
}
