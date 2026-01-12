
import { GoogleGenAI, Type, Modality, Blob } from "@google/genai";
import { TEFSection, EvaluationResult, TEFTask } from "../types";
import { makeExamInstructions } from "./prompts/examiner";
import { buildRubricSystemPrompt, buildEvaluationUserMessage } from "./prompts/evaluation";

/**
 * Normalize and validate evaluation result to ensure all fields are present
 * This prevents missing fields from causing UI issues
 * 
 * @param result - Raw evaluation result from AI
 * @param section - TEF section being evaluated
 * @param mode - Exam mode: 'partA', 'partB', or 'full'
 * @param taskPartA - Task A with modelAnswer from knowledge base (if available)
 * @param taskPartB - Task B with modelAnswer from knowledge base (if available)
 */
function normalizeEvaluationResult(
  result: any, 
  section: TEFSection,
  mode?: string,
  taskPartA?: any,
  taskPartB?: any
): EvaluationResult {
  // Ensure base required fields have valid values
  const normalized: EvaluationResult = {
    score: typeof result.score === 'number' ? result.score : 0,
    clbLevel: result.clbLevel || 'CLB 0',
    cecrLevel: result.cecrLevel || 'A1',
    feedback: result.feedback || '',
    strengths: Array.isArray(result.strengths) ? result.strengths : [],
    weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
    grammarNotes: result.grammarNotes || '',
    vocabularyNotes: result.vocabularyNotes || '',
    
    // Enhanced fields - use what's provided, empty defaults if missing
    overall_comment: result.overall_comment || result.feedback || '',
    top_improvements: Array.isArray(result.top_improvements) ? result.top_improvements : [],
    upgraded_sentences: Array.isArray(result.upgraded_sentences) ? result.upgraded_sentences : [],
    model_answer: result.model_answer || '',
    
    // Criteria - only include if actually provided by AI, don't fake scores
    criteria: normalizeCriteria(result.criteria, section),
  };

  // Written Expression specific fields
  if (section === 'WrittenExpression') {
    // Use exact model answers from knowledge base when available
    // Override AI-generated model answers with exact ones from knowledge base
    // All written tasks come from the knowledge base, so always prefer knowledge base answers
    
    // Section A: Use knowledge base model answer if available (for partA or full mode)
    if (mode === 'partA' || mode === 'full') {
      // Prefer exact model answer from knowledge base over AI-generated
      const kbModelAnswerA = taskPartA?.modelAnswer && typeof taskPartA.modelAnswer === 'string' && taskPartA.modelAnswer.trim();
      normalized.model_answer_sectionA = kbModelAnswerA || (result.model_answer_sectionA || '');
    } else {
      // For partB mode or undefined mode, Section A is not evaluated
      normalized.model_answer_sectionA = result.model_answer_sectionA || '';
    }
    
    // Section B: Use knowledge base model answer if available (for partB or full mode)
    if (mode === 'partB' || mode === 'full') {
      // Prefer exact model answer from knowledge base over AI-generated
      const kbModelAnswerB = taskPartB?.modelAnswer && typeof taskPartB.modelAnswer === 'string' && taskPartB.modelAnswer.trim();
      normalized.model_answer_sectionB = kbModelAnswerB || (result.model_answer_sectionB || '');
    } else {
      // For partA mode or undefined mode, Section B is not evaluated
      normalized.model_answer_sectionB = result.model_answer_sectionB || '';
    }
    
    normalized.corrections_sectionA = Array.isArray(result.corrections_sectionA) ? result.corrections_sectionA : [];
    normalized.corrections_sectionB = Array.isArray(result.corrections_sectionB) ? result.corrections_sectionB : [];
  }

  // OralExpression EO1 specific - AI-counted questions
  if (section === 'OralExpression' && typeof result.actual_questions_count === 'number') {
    normalized.actual_questions_count = result.actual_questions_count;
  }

  // WrittenExpression specific - AI-counted words
  if (section === 'WrittenExpression') {
    if (typeof result.actual_word_count_sectionA === 'number') {
      normalized.actual_word_count_sectionA = result.actual_word_count_sectionA;
    }
    if (typeof result.actual_word_count_sectionB === 'number') {
      normalized.actual_word_count_sectionB = result.actual_word_count_sectionB;
    }
  }

  return normalized;
}

/**
 * Normalize criteria - only include criteria that were actually evaluated
 * If criteria is missing entirely, return undefined (UI should handle "not available")
 */
function normalizeCriteria(criteria: any, section?: TEFSection): Record<string, any> | undefined {
  // If no criteria provided at all, return undefined (not fake data)
  if (!criteria || typeof criteria !== 'object') {
    return undefined;
  }

  // Only include criteria that have actual scores
  const validCriteria: Record<string, any> = {};
  // Section-specific criteria lists
  const baseCriteria = ['taskFulfillment', 'coherence', 'lexicalRange', 'grammarControl'];
  const oralCriteria = ['fluency', 'interaction'];
  const writtenCriteria = ['clarityDevelopment', 'argumentationQuality'];
  
  const possibleCriteria = section === 'OralExpression' 
    ? [...baseCriteria, ...oralCriteria]
    : section === 'WrittenExpression'
    ? [...baseCriteria, ...writtenCriteria]
    : [...baseCriteria, ...oralCriteria, ...writtenCriteria]; // Fallback: include all
  
  for (const key of possibleCriteria) {
    if (criteria[key] && typeof criteria[key] === 'object' && typeof criteria[key].score === 'number') {
      validCriteria[key] = {
        score: criteria[key].score,
        comment: criteria[key].comment || '',
      };
    }
  }
  
  // If no valid criteria found, return undefined
  if (Object.keys(validCriteria).length === 0) {
    return undefined;
  }
  
  return validCriteria;
}

// Get API key and validate
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is missing!');
  console.error('Please create a .env.local file in the project root with:');
  console.error('GEMINI_API_KEY=your_api_key_here');
  console.error('Then restart the dev server (npm run dev)');
}

// Remove any whitespace that might have been accidentally included
const cleanApiKey = apiKey.trim();

if (cleanApiKey && cleanApiKey.length < 20) {
  console.warn('⚠️ API key seems too short. Make sure you copied the full key from Gemini console.');
}

const ai = new GoogleGenAI({ apiKey: cleanApiKey });

// Live API response timeout configuration
// Adjust these values to control response wait times
export const LIVE_API_CONFIG = {
  // Connection timeout (how long to wait for WebSocket to establish)
  connectionTimeout: 10000, // 10 seconds
  
  // Response wait time (how long to wait for AI response after user stops speaking)
  // The Gemini API has built-in turn detection, but this controls client-side timeout handling
  responseWaitTime: 30000, // 30 seconds - adjust if responses are taking too long
  
  // Turn detection timeout - set to undefined to use Gemini's native defaults
  // Gemini's native audio model has built-in voice activity detection (VAD)
  // Only set a value here if you need to override the default behavior
  turnDetectionTimeout: undefined as number | undefined, // Use Gemini's native turn detection
} as const;

export const encodeAudio = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const decodeAudio = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Resamples audio data from one sample rate to another using linear interpolation
 */
function resampleAudioData(audioData: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) {
    return audioData;
  }
  
  const ratio = fromRate / toRate;
  const newLength = Math.round(audioData.length / ratio);
  const resampled = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, audioData.length - 1);
    const fraction = srcIndex - srcIndexFloor;
    
    resampled[i] = audioData[srcIndexFloor] * (1 - fraction) + audioData[srcIndexCeil] * fraction;
  }
  
  return resampled;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  targetSampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // Gemini sends audio at 24kHz, so we decode it first at that rate
  const sourceSampleRate = 24000;
  
  // Convert Uint8Array to Int16Array (little-endian, 16-bit PCM)
  // Each sample is 2 bytes
  const frameCount = Math.floor(data.length / (2 * numChannels));
  
  // First decode at source rate (24kHz)
  const sourceBuffer = ctx.createBuffer(numChannels, frameCount, sourceSampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = sourceBuffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Extract 16-bit sample (little-endian)
      const byteIndex = (i * numChannels + channel) * 2;
      if (byteIndex + 1 < data.length) {
        const sample = data[byteIndex] | (data[byteIndex + 1] << 8);
        // Convert to signed 16-bit
        const int16Sample = sample > 32767 ? sample - 65536 : sample;
        // Normalize to [-1, 1]
        channelData[i] = int16Sample / 32768.0;
      } else {
        channelData[i] = 0;
      }
    }
  }
  
  // If target sample rate is different, resample
  if (targetSampleRate !== sourceSampleRate) {
    const resampledFrameCount = Math.round(frameCount * (targetSampleRate / sourceSampleRate));
    const targetBuffer = ctx.createBuffer(numChannels, resampledFrameCount, targetSampleRate);
    
    for (let channel = 0; channel < numChannels; channel++) {
      const sourceChannel = sourceBuffer.getChannelData(channel);
      const targetChannel = targetBuffer.getChannelData(channel);
      const resampled = resampleAudioData(sourceChannel, sourceSampleRate, targetSampleRate);
      targetChannel.set(resampled);
    }
    
    return targetBuffer;
  }
  
  return sourceBuffer;
}

export function createPcmBlob(data: Float32Array, sampleRate: number): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s * 32767;
  }
  return {
    data: encodeAudio(new Uint8Array(int16.buffer)),
    mimeType: `audio/pcm;rate=${Math.round(sampleRate)}`,
  };
}

// Helper function to convert blob to base64 (using DOM Blob, not Gemini Blob)
function blobToBase64(blob: globalThis.Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const geminiService = {

  async transcribeAudio(audioBlob: globalThis.Blob): Promise<{
    transcript: string;
    fluency_analysis?: {
      hesitation_rate?: string;
      filler_words_per_min?: number;
      average_pause_seconds?: number;
      self_corrections?: number;
      fluency_comment?: string;
    };
  }> {
    try {
      // Convert blob to base64
      const base64 = await blobToBase64(audioBlob);
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{
          parts: [{
            inlineData: {
              mimeType: "audio/wav",
              data: base64
            }
          }, {
            text: [
              "You will receive an audio recording of a two-speaker conversation for a TEF Canada oral exam simulation.",
              "",
              "Speaker assumptions:",
              "- The FIRST voice that speaks is the HUMAN CANDIDATE (label: \"User:\").",
              "- The SECOND voice is the AI EXAMINER (label: \"Examiner:\").",
              "",
              "Your tasks (ALL required):",
              "1) Use your built-in diarization to separate speakers.",
              "2) Produce a clean, continuous transcript in FRENCH, with natural spacing and punctuation.",
              "3) Prefix each utterance or paragraph with either \"User:\" or \"Examiner:\" to indicate the speaker.",
              "4) Retain BOTH speakers' contributions in the transcript.",
              "5) Do NOT add any explanations or commentary in the transcript—only the labeled dialogue text.",
              "",
              "6) Analyse ONLY the User's speech (the candidate) for fluency and disfluencies.",
              "   Consider: hesitations (\"euh\", long pauses, restarts), filler words, average pause duration, and self-corrections.",
              "",
              "IMPORTANT OUTPUT FORMAT:",
              "- You must return ONLY valid JSON matching this schema:",
              "{",
              "  \"transcript\": string,  // diarized dialogue in French, with lines like 'User: ...' and 'Examiner: ...', no extra comments",
              "  \"fluency_analysis\": {",
              "    \"hesitation_rate\": string,           // one of: \"low\", \"medium\", \"high\"",
              "    \"filler_words_per_min\": number,     // approximate numeric count per minute, based on User's speech",
              "    \"average_pause_seconds\": number,    // approximate average pause length in seconds between User phrases",
              "    \"self_corrections\": number,         // approximate count of times the User restarts or clearly corrects themselves",
              "    \"fluency_comment\": string           // short English summary of the User's fluency (hesitations, fillers, rhythm)",
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
        console.error('❌ Failed to parse transcription JSON, falling back to raw text:', e);
        return {
          transcript: (response.text || '').trim(),
        };
      }

      const transcript = (parsed?.transcript ?? '').toString().trim();
      const fluency_analysis = parsed?.fluency_analysis && typeof parsed.fluency_analysis === 'object'
        ? parsed.fluency_analysis
        : undefined;

      return {
        transcript,
        fluency_analysis,
      };
    } catch (error: any) {
      console.error('❌ Error transcribing audio:', error);
      throw error;
    }
  },

  async connectLive(
    callbacks: any, 
    task: TEFTask, 
    part: 'A' | 'B', 
    ocrFacts?: string[],
    options?: {
      responseTimeout?: number; // Timeout for waiting for AI response (ms)
      turnDetectionTimeout?: number; // Timeout for detecting user turn end (ms)
    }
  ) {
    // Use the new prompt system
    const systemInstruction = makeExamInstructions(task, part, ocrFacts);

    const config: any = {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
      },
      systemInstruction,
      outputAudioTranscription: {}, // Model's speech transcription
      inputAudioTranscription: {}, // User's speech transcription
    };

    // Add timeout configs if provided (if the SDK supports them)
    // Note: These may not be directly supported by the SDK, but we can handle them client-side
    // Use default from LIVE_API_CONFIG if not provided
    const turnDetectionTimeout = options?.turnDetectionTimeout ?? LIVE_API_CONFIG.turnDetectionTimeout;
    const responseTimeout = options?.responseTimeout ?? LIVE_API_CONFIG.responseWaitTime;
    
    if (responseTimeout) {
      // Store in config for potential SDK support or client-side handling
      config.responseTimeout = responseTimeout;
    }
    if (turnDetectionTimeout) {
      config.turnDetectionTimeout = turnDetectionTimeout;
    }

    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks,
      config,
    });
  },

  async generateScenario(section: TEFSection): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-09-2025",
      contents: `Generate a TEF Canada ${section} task in JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.INTEGER }
                }
              }
            }
          }
        }
      }
    });
    return response.text;
  },

  async evaluateResponse(
    section: TEFSection, 
    prompt: string, 
    userContent: string,
    scenarioId?: number,
    timeLimitSec?: number,
    estimatedQuestionsCount?: number,
    mode?: string,
    taskPartA?: any,
    taskPartB?: any,
    eo2RemainingSeconds?: number,
    fluencyAnalysis?: any
  ): Promise<EvaluationResult> {
    const isFullExam = mode === 'full' && taskPartA && taskPartB;
    const systemPrompt = buildRubricSystemPrompt(section, isFullExam);
    const userMessage = buildEvaluationUserMessage(
      section,
      scenarioId || 0,
      timeLimitSec || 0,
      prompt,
      userContent,
      estimatedQuestionsCount,
      isFullExam,
      taskPartA,
      taskPartB,
      eo2RemainingSeconds,
      fluencyAnalysis
    );

    // Use gemini-2.5-flash for better quota availability (free tier friendly)
    // Retry logic for rate limits
    const maxRetries = 3;
    let lastError: any = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Build dynamic criteria schema based on section type
        const criteriaProperties: any = {
          taskFulfillment: { 
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              comment: { type: Type.STRING }
            },
            required: ["score", "comment"]
          },
          coherence: { 
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              comment: { type: Type.STRING }
            },
            required: ["score", "comment"]
          },
          lexicalRange: { 
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              comment: { type: Type.STRING }
            },
            required: ["score", "comment"]
          },
          grammarControl: { 
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              comment: { type: Type.STRING }
            },
            required: ["score", "comment"]
          }
        };

        // Add section-specific criteria
        const criteriaRequired = ["taskFulfillment", "coherence", "lexicalRange", "grammarControl"];
        if (section === 'OralExpression') {
          criteriaProperties.fluency = {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              comment: { type: Type.STRING }
            },
            required: ["score", "comment"]
          };
          criteriaProperties.interaction = {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              comment: { type: Type.STRING }
            },
            required: ["score", "comment"]
          };
          criteriaRequired.push("fluency", "interaction");
        } else if (section === 'WrittenExpression') {
          criteriaProperties.clarityDevelopment = {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              comment: { type: Type.STRING }
            },
            required: ["score", "comment"]
          };
          criteriaProperties.argumentationQuality = {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              comment: { type: Type.STRING }
            },
            required: ["score", "comment"]
          };
          criteriaRequired.push("clarityDevelopment", "argumentationQuality");
        }

        // Use low temperature only for WrittenExpression to ensure consistent evaluations
        // OralExpression keeps default temperature for more natural variation
        const config: any = {
          responseMimeType: "application/json",
          responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },        // Overall TEF score (0-699)
            clbLevel: { type: Type.STRING },     // Single CLB level (e.g., "CLB 7")
            cecrLevel: { type: Type.STRING },    // Single CECR level (A1, A2, B1, B2, C1, or C2)
            feedback: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            grammarNotes: { type: Type.STRING },
            vocabularyNotes: { type: Type.STRING },
            overall_comment: { type: Type.STRING },
            criteria: { 
              type: Type.OBJECT,
              properties: criteriaProperties,
              required: criteriaRequired
            },
            top_improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            upgraded_sentences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  weak: { type: Type.STRING },
                  better: { type: Type.STRING },
                  why: { type: Type.STRING }
                },
                required: ["weak", "better", "why"]
              }
            },
            model_answer: { type: Type.STRING },
            // OralExpression EO1 specific - AI-counted questions
            actual_questions_count: { type: Type.NUMBER },
            // WrittenExpression specific - AI-counted words
            actual_word_count_sectionA: { type: Type.NUMBER },
            actual_word_count_sectionB: { type: Type.NUMBER },
            // Written Expression specific fields (optional)
            model_answer_sectionA: { type: Type.STRING },
            model_answer_sectionB: { type: Type.STRING },
            corrections_sectionA: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  weak: { type: Type.STRING },
                  better: { type: Type.STRING },
                  why: { type: Type.STRING }
                },
                required: ["weak", "better", "why"]
              }
            },
            corrections_sectionB: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  weak: { type: Type.STRING },
                  better: { type: Type.STRING },
                  why: { type: Type.STRING }
                },
                required: ["weak", "better", "why"]
              }
            }
            // REMOVED: overall_band_estimate, cecr_level, clb_equivalence, approximate_tef_band
          },
          required: [
            "score", 
            "clbLevel",
            "cecrLevel",
            "feedback", 
            "strengths", 
            "weaknesses", 
            "grammarNotes", 
            "vocabularyNotes",
            "overall_comment",
            "criteria",
            "top_improvements",
            "upgraded_sentences",
            "model_answer"
          ]
        }
      };

        // Add low temperature only for WrittenExpression to ensure consistent evaluations
        // OralExpression keeps default temperature for more natural variation
        if (section === 'WrittenExpression') {
          config.temperature = 0.1;
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            { parts: [{ text: systemPrompt }] },
            { parts: [{ text: userMessage }] }
          ],
          config
        });
    // Parse and normalize the result to ensure all fields are present
    const rawResult = JSON.parse(response.text);
    return normalizeEvaluationResult(rawResult, section, mode, taskPartA, taskPartB);
      } catch (error: any) {
        lastError = error;
        // Check if it's a rate limit error (429)
        if (error?.error?.code === 429 || error?.status === 'RESOURCE_EXHAUSTED') {
          const retryDelay = error?.error?.details?.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo')?.retryDelay;
          const delayMs = retryDelay ? parseInt(retryDelay.replace('s', '')) * 1000 : (attempt + 1) * 2000; // Default: 2s, 4s, 6s
          
          if (attempt < maxRetries - 1) {
            console.log(`Rate limit hit, retrying in ${delayMs}ms... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            continue;
          }
        }
        // If not a rate limit error or out of retries, throw
        throw error;
      }
    }
    
    // If we exhausted all retries, throw the last error
    throw lastError;
  }
};
