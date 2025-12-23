/**
 * Script to generate instruction audio files and save as WAV format
 * Run with: npm run generate-instructions
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { GoogleGenAI, Modality } from "@google/genai";
import { pcmToWav } from '../utils/audio';
import 'dotenv/config';

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is missing!');
  console.error('Please set GEMINI_API_KEY in your .env file');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

/**
 * Generate audio using Gemini TTS and save as WAV file
 * @param text - Text to convert to speech
 * @param outputPath - Path where to save the WAV file
 * @param voiceName - Voice to use (default: 'Kore')
 */
async function generateAndSaveAudio(
  text: string, 
  outputPath: string, 
  voiceName: string = 'Kore'
): Promise<void> {
  console.log(`🎤 Generating audio for: ${text.substring(0, 50)}...`);
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
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
      throw new Error('No audio data returned from API');
    }

    // Decode base64 to buffer (this is raw PCM data)
    const pcmBuffer = Buffer.from(audioBase64, 'base64');
    
    // Convert PCM to WAV format using utility function
    const wavBuffer = pcmToWav(pcmBuffer, 24000, 1);
    
    // Save as WAV file
    await writeFile(outputPath, wavBuffer);
    
    console.log(`✅ Saved audio to ${outputPath} (${(wavBuffer.length / 1024).toFixed(2)} KB)`);
  } catch (error) {
    console.error(`❌ Error generating audio for ${outputPath}:`, error);
    throw error;
  }
}

async function main() {
  const publicDir = join(process.cwd(), 'public');
  
  const partAText = "Bonjour. Vous allez maintenant passer la section A de l'expression orale. Votre tâche est de poser des questions pertinentes pour obtenir des informations. Vous avez 4 minutes. Commencez quand vous êtes prêt.";
  const partBText = "Bonjour. Vous allez maintenant passer la section B de l'expression orale. Votre tâche est de présenter un argument et de répondre aux objections. Vous avez 8 minutes. Commencez quand vous êtes prêt.";

  console.log('🚀 Starting audio generation...\n');

  try {
    await generateAndSaveAudio(partAText, join(publicDir, 'instructions_part_a.wav'));
    await generateAndSaveAudio(partBText, join(publicDir, 'instructions_part_b.wav'));
    
    console.log('\n✅ All audio files generated successfully!');
    console.log('📁 Files saved to public/ directory as WAV format');
  } catch (error) {
    console.error('\n❌ Failed to generate audio files:', error);
    process.exit(1);
  }
}

main();

