
import { GoogleGenAI, Type, Modality, Blob } from "@google/genai";
import { TEFSection, EvaluationResult, TEFTask } from "../types";
import { makeExamInstructions } from "./prompts/examiner";
import { buildRubricSystemPrompt, buildEvaluationUserMessage } from "./prompts/evaluation";

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
  async generateAudio(text: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-09-2025",
      contents: [{ parts: [{ text: `Veuillez lire ce texte : ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
  },

  async transcribeAudio(audioBlob: globalThis.Blob): Promise<string> {
    try {
      // Convert blob to base64
      const base64 = await blobToBase64(audioBlob);
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-09-2025",
        contents: [{
          parts: [{
            inlineData: {
              mimeType: "audio/wav",
              data: base64
            }
          }, {
            text: "Transcribe this audio recording. Include only the candidate's speech (ignore the examiner's voice). Return only the transcript text, no explanations."
          }]
        }]
      });
      
      return response.text.trim();
    } catch (error: any) {
      console.error('❌ Error transcribing audio:', error);
      throw error;
    }
  },

  async connectLive(callbacks: any, task: TEFTask, part: 'A' | 'B', ocrFacts?: string[]) {
    // Use the new prompt system
    const systemInstruction = makeExamInstructions(task, part, ocrFacts);

    return ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
        },
        systemInstruction,
        outputAudioTranscription: {}, // Model's speech transcription
        inputAudioTranscription: {}, // User's speech transcription
      },
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
    estimatedQuestionsCount?: number
  ): Promise<EvaluationResult> {
    const systemPrompt = buildRubricSystemPrompt(section);
    const userMessage = buildEvaluationUserMessage(
      section,
      scenarioId || 0,
      timeLimitSec || 0,
      prompt,
      userContent,
      estimatedQuestionsCount
    );

    // Use gemini-2.5-flash for better quota availability (free tier friendly)
    // Retry logic for rate limits
    const maxRetries = 3;
    let lastError: any = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-09-2025",
          contents: [
            { parts: [{ text: systemPrompt }] },
            { parts: [{ text: userMessage }] }
          ],
          config: {
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
              properties: {
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
                },
                fluency: { 
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    comment: { type: Type.STRING }
                  },
                  required: ["score", "comment"]
                },
                interaction: { 
                  type: Type.OBJECT,
                  properties: {
                    score: { type: Type.NUMBER },
                    comment: { type: Type.STRING }
                  },
                  required: ["score", "comment"]
                }
              }
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
            model_answer: { type: Type.STRING }
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
            "vocabularyNotes"
          ]
        }
      }
    });
    return JSON.parse(response.text);
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
