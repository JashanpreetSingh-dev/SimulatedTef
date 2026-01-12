/**
 * AI client for listening question generation
 * Handles Gemini API interactions and response parsing
 */

import { GoogleGenAI, Type } from "@google/genai";

/**
 * Initialize the AI client
 */
export function createAIClient(): GoogleGenAI {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Please set it in your environment variables.');
  }

  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

/**
 * Generate content from AI using the provided prompt
 */
export async function generateAIContent(
  ai: GoogleGenAI,
  prompt: string
): Promise<any> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          section: { type: Type.STRING },
          audio_items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                audio_id: { type: Type.STRING },
                section_id: { type: Type.NUMBER },
                repeatable: { type: Type.BOOLEAN },
                audio_script: { type: Type.STRING },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question_id: { type: Type.NUMBER },
                      question: { type: Type.STRING },
                      options: {
                        type: Type.OBJECT,
                        properties: {
                          A: { type: Type.STRING },
                          B: { type: Type.STRING },
                          C: { type: Type.STRING },
                          D: { type: Type.STRING }
                        },
                        required: ["A", "B", "C", "D"]
                      },
                      correct_answer: { type: Type.STRING }
                    },
                    required: ["question_id", "question", "options", "correct_answer"]
                  }
                }
              },
              required: ["audio_id", "section_id", "repeatable", "audio_script", "questions"]
            }
          }
        },
        required: ["section", "audio_items"]
      }
    }
  });

  // Parse the response
  let parsed: any;
  try {
    const responseText = response.text || '';
    parsed = JSON.parse(responseText);
  } catch (e) {
    console.error('❌ Failed to parse AI response as JSON');
    console.error('Response:', response.text);
    throw new Error('Failed to parse AI response. The AI may not have returned valid JSON.');
  }

  // Validate response structure
  if (!parsed.audio_items || !Array.isArray(parsed.audio_items)) {
    throw new Error('Invalid response format: missing audio_items array');
  }

  return parsed;
}
