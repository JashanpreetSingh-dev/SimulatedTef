/**
 * TTS Provider Abstraction
 * Supports multiple TTS providers:
 * - Google Cloud Text-to-Speech API (recommended for better rate limits)
 * - Google Gemini API (fallback, has lower RPD limits)
 */

import { GoogleGenAI, Modality } from "@google/genai";
import { TextToSpeechClient, protos } from "@google-cloud/text-to-speech";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import os from "os";
import { pcmToWav } from "../../utils/audio";

// Get project root directory for resolving relative paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

/**
 * TTS Service Interface
 * All TTS providers must implement this interface
 */
export interface TTSService {
  generateAudio(text: string, voiceName: string): Promise<Buffer>;
}

/**
 * Google Cloud Text-to-Speech Provider
 * Uses Google Cloud Text-to-Speech API (better rate limits than Gemini TTS)
 * Requires service account authentication via GOOGLE_APPLICATION_CREDENTIALS
 */
class GoogleCloudTTSProvider implements TTSService {
  private client: TextToSpeechClient;
  private voiceMap: Map<string, { name: string; ssmlGender: protos.google.cloud.texttospeech.v1.SsmlVoiceGender }>;

  constructor() {
    // Google Cloud TTS requires service account authentication
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS is required for Google Cloud TTS provider');
    }

    let credentialsValue = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    // Handle .env file formatting: remove surrounding quotes if present
    credentialsValue = credentialsValue.trim();
    if ((credentialsValue.startsWith('"') && credentialsValue.endsWith('"')) ||
        (credentialsValue.startsWith("'") && credentialsValue.endsWith("'"))) {
      credentialsValue = credentialsValue.slice(1, -1);
      // Unescape any escaped quotes
      credentialsValue = credentialsValue.replace(/\\"/g, '"').replace(/\\'/g, "'");
    }

    // Check if it's JSON content (starts with '{') or a file path
    if (credentialsValue.startsWith('{')) {
      // JSON content provided directly as environment variable (from .env or deployment platform)
      // Write it to a temporary file for the Google Cloud client
      const tempFilePath = path.join(os.tmpdir(), `gcp-credentials-${Date.now()}.json`);
      
      try {
        // Parse and validate JSON
        const parsedJson = JSON.parse(credentialsValue);
        // Write the parsed JSON back as formatted JSON to ensure it's valid
        fs.writeFileSync(tempFilePath, JSON.stringify(parsedJson), 'utf8');
        process.env.GOOGLE_APPLICATION_CREDENTIALS = tempFilePath;
      } catch (error: any) {
        // Provide helpful error message
        const preview = credentialsValue.substring(0, 100);
        throw new Error(
          `Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS: ${error.message}\n` +
          `Preview: ${preview}...\n` +
          `Make sure:\n` +
          `1. The entire JSON content is on a single line in .env\n` +
          `2. All double quotes inside the JSON are properly escaped\n` +
          `3. Or use a file path instead: GOOGLE_APPLICATION_CREDENTIALS=service-account-key.json`
        );
      }
    } else {
      // File path provided (for local development)
      // Resolve relative paths to absolute paths (relative to project root)
      const absoluteCredentialsPath = path.isAbsolute(credentialsValue) 
        ? credentialsValue 
        : path.resolve(projectRoot, credentialsValue);

      // Verify file exists
      if (!fs.existsSync(absoluteCredentialsPath)) {
        throw new Error(`Service account key file not found: ${absoluteCredentialsPath}`);
      }

      // Set the resolved path for the client
      process.env.GOOGLE_APPLICATION_CREDENTIALS = absoluteCredentialsPath;
    }

    this.client = new TextToSpeechClient();
    
    // Map Gemini voice names to Google Cloud TTS French voices
    // Charon = male, Aoede = female, Kore = neutral/female
    this.voiceMap = new Map([
      ['Charon', { name: 'fr-FR-Standard-B', ssmlGender: protos.google.cloud.texttospeech.v1.SsmlVoiceGender.MALE }], // Male French voice
      ['Aoede', { name: 'fr-FR-Standard-A', ssmlGender: protos.google.cloud.texttospeech.v1.SsmlVoiceGender.FEMALE }], // Female French voice
      ['Kore', { name: 'fr-FR-Standard-A', ssmlGender: protos.google.cloud.texttospeech.v1.SsmlVoiceGender.FEMALE }], // Default to female
    ]);

    console.log(`   Using Google Cloud Text-to-Speech API (better rate limits)`);
  }

  async generateAudio(text: string, voiceName: string): Promise<Buffer> {
    try {
      const voiceConfig = this.voiceMap.get(voiceName) || this.voiceMap.get('Kore')!;
      
      const request: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
        input: { text: text.trim() },
        voice: {
          languageCode: 'fr-FR',
          name: voiceConfig.name,
          ssmlGender: voiceConfig.ssmlGender,
        },
        audioConfig: {
          audioEncoding: protos.google.cloud.texttospeech.v1.AudioEncoding.LINEAR16, // PCM
          sampleRateHertz: 24000,
        },
      };

      const [response] = await this.client.synthesizeSpeech(request);
      
      if (!response.audioContent) {
        throw new Error('No audio data returned from Google Cloud TTS API');
      }

      // response.audioContent is a Buffer or Uint8Array
      const audioBuffer = Buffer.from(response.audioContent);
      
      // Convert PCM to WAV (Google Cloud TTS returns PCM, we need to add WAV header)
      return pcmToWav(audioBuffer, 24000, 1);
    } catch (error: any) {
      console.error(`Google Cloud TTS Error:`, error.message);
      throw error;
    }
  }
}

/**
 * Gemini TTS Provider
 * Uses Google Gemini API for text-to-speech
 * Supports both direct API key and Vertex AI (via service account) authentication
 * Note: Has lower RPD (Requests Per Day) limits compared to Google Cloud TTS
 */
class GeminiTTSProvider implements TTSService {
  private ai: GoogleGenAI;
  private useVertexAI: boolean;

  constructor() {
    // Check if Vertex AI should be used (via service account)
    // Only use Vertex AI if explicitly enabled, not just because GOOGLE_APPLICATION_CREDENTIALS exists
    // (GOOGLE_APPLICATION_CREDENTIALS might be set for Google Cloud TTS, not Vertex AI)
    const useVertexAI = process.env.USE_VERTEX_AI === 'true';
    this.useVertexAI = useVertexAI;

    if (useVertexAI) {
      // Vertex AI uses service account authentication via GOOGLE_APPLICATION_CREDENTIALS
      // The @google/genai SDK automatically uses Application Default Credentials (ADC)
      // when GOOGLE_APPLICATION_CREDENTIALS is set
      const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
      const location = process.env.GCP_LOCATION || 'us-central1';
      
      if (!projectId) {
        throw new Error('GCP_PROJECT_ID is required when using Vertex AI');
      }

      // For Vertex AI, we still use @google/genai but it will authenticate via ADC
      // The SDK handles Vertex AI endpoints when configured properly
      this.ai = new GoogleGenAI({ 
        // When GOOGLE_APPLICATION_CREDENTIALS is set, SDK uses service account
        // No API key needed for Vertex AI
      });
      
      console.log(`   Using Vertex AI authentication (service account)`);
      console.log(`   Project: ${projectId}, Location: ${location}`);
    } else {
      // Direct Gemini API with API key
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
      
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is required for Gemini TTS provider (or set USE_VERTEX_AI=true with GOOGLE_APPLICATION_CREDENTIALS)');
      }

      this.ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      console.log(`   Using Gemini API key authentication`);
    }
  }

  async generateAudio(text: string, voiceName: string): Promise<Buffer> {
    try {
      const modelName = this.useVertexAI 
        ? `projects/${process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT}/locations/${process.env.GCP_LOCATION || 'us-central1'}/publishers/google/models/gemini-2.5-flash-preview-tts`
        : "gemini-2.5-flash-preview-tts";

      const response = await this.ai.models.generateContent({
        model: modelName,
        contents: [{ parts: [{ text: `Veuillez lire ce texte : ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
        },
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioBase64) {
        throw new Error('No audio data returned from Gemini API');
      }

      const pcmBuffer = Buffer.from(audioBase64, 'base64');
      return pcmToWav(pcmBuffer, 24000, 1);
    } catch (error: any) {
      console.error(`Gemini TTS Error:`, error.message);
      throw error;
    }
  }
}

/**
 * Get the TTS provider based on environment configuration
 * Priority:
 * 1. Google Cloud TTS (if TTS_PROVIDER=gcp or GOOGLE_APPLICATION_CREDENTIALS is set and TTS_PROVIDER is not explicitly 'gemini')
 * 2. Gemini TTS (fallback or if TTS_PROVIDER=gemini)
 * @returns TTSService instance
 */
export function getTTSProvider(): TTSService {
  const provider = (process.env.TTS_PROVIDER || '').toLowerCase().trim();
  const hasServiceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS !== undefined;

  // Use Google Cloud TTS if:
  // - TTS_PROVIDER is explicitly set to 'gcp' or 'google-cloud'
  // - OR service account is configured and provider is not explicitly 'gemini'
  if (provider === 'gcp' || provider === 'google-cloud' || (hasServiceAccount && provider !== 'gemini')) {
    try {
      return new GoogleCloudTTSProvider();
    } catch (error: any) {
      console.warn(`Failed to initialize Google Cloud TTS provider: ${error.message}`);
      console.warn(`   Falling back to Gemini TTS provider`);
      return new GeminiTTSProvider();
    }
  }

  // Default to Gemini TTS
  return new GeminiTTSProvider();
}
