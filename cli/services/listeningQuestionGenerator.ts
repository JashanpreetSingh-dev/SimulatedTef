/**
 * AI-powered question generation service for TEF Canada listening comprehension
 * Uses Gemini API to generate questions following the official TEF format
 */

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ReadingListeningQuestion } from "../../types";
import { createQuestion } from "../../server/models/Question";
import { createAudioItem } from "../../server/models/AudioItem";

// Get API key
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is missing!');
  console.error('Please set GEMINI_API_KEY in your environment variables.');
}

const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

/**
 * Master prompt for TEF Canada listening comprehension question generation
 */
function getMasterPrompt(): string {
  return `Act as a Senior French Language Expert specialized in the TEF Canada (Test d'Évaluation de Français). 
You are constructing a Compréhension Orale (Listening Comprehension) module that follows the official TEF Canada format.

═══════════════════════════════════════════════════════════════════════════════
EXAM STRUCTURE OVERVIEW
═══════════════════════════════════════════════════════════════════════════════

The TEF Canada Listening Comprehension exam consists of exactly 40 questions distributed across 4 sections.
Total time: 40 minutes. All questions are single-answer multiple choice with options A, B, C, D.
All audio is spoken French. All questions and options are written French.
Difficulty must increase progressively from everyday, concrete situations to fast, abstract, and argumentative speech.
Do NOT mention proficiency levels in the output.

═══════════════════════════════════════════════════════════════════════════════
DETAILED SECTION BREAKDOWN
═══════════════════════════════════════════════════════════════════════════════

SECTION 1 - Images (4 questions)
───────────────────────────────────────────────────────────────────────────────
Purpose: Very short audio describing one simple situation linked to images.
Audio Length: Very short (1–2 sentences).
Repeatable: Yes (audio MAY be replayed in training mode).
Mapping: Usually 1 audio = 1 question.
Question Pattern: "Quel dessin correspond à la situation ?"
Skills: Identify main idea in a very short statement, match simple description to a visual scene.

───────────────────────────────────────────────────────────────────────────────

SECTION 2 - Short dialogues and announcements (6 questions)
───────────────────────────────────────────────────────────────────────────────
Purpose: Short practical situations: phone calls, service counters, simple announcements.
Audio Length: Short.
Repeatable: Yes (audio MAY be replayed in training mode).
Mapping: Some audios may have 2 questions each.
Skills: Main idea, specific detail (time, place, price, date, quantity), speaker intention in simple contexts.

───────────────────────────────────────────────────────────────────────────────

SECTION 3 - Medium conversations (10 questions)
───────────────────────────────────────────────────────────────────────────────
Purpose: Two speakers in medium-length conversations (work, studies, daily life problems, organization).
Audio Length: Medium.
Repeatable: No (audio is played ONCE only).
Mapping: 1 audio = 1 question.
Skills: Main idea of the conversation, specific details about actions, decisions or constraints, paraphrasing of key information.

───────────────────────────────────────────────────────────────────────────────

SECTION 4 - Interviews, reports and advanced listening (20 questions)
───────────────────────────────────────────────────────────────────────────────
Purpose: Long radio interviews, reports, and faster, more abstract or argumentative speech.
Audio Length: 
  - Questions 21-22 and 31-40: Medium to long (30-45 seconds when spoken)
  - Questions 23-30 (2 questions per audio): MUST be 60-90 seconds when spoken - these audios need substantial content to support 2 distinct questions
Repeatable: No (audio is played ONCE only).
Mapping: Questions 21-22 and 31-40 have 1 audio = 1 question. Questions 23-30 have 1 audio = 2 questions (4 audios for these 8 questions).
Skills: Main idea and structure of the text, speaker opinion and attitude, cause and consequence, implicit meaning and conclusions, paraphrasing (answers must NOT repeat audio wording).

───────────────────────────────────────────────────────────────────────────────

QUESTION TYPES TO INCLUDE
───────────────────────────────────────────────────────────────────────────────

1. Main idea / idée générale
2. Specific detail (time, place, numbers, conditions, restrictions)
3. Speaker intention (what the speaker wants to do, obtain, or communicate)
4. Opinion / attitude (agreement, disagreement, doubt, enthusiasm, criticism, etc.)
5. Cause and consequence (why something happens, what results from it)
6. Implicit meaning and inferred conclusions (advanced sections only)
7. Paraphrasing (correct option must reformulate, not copy, the audio)

═══════════════════════════════════════════════════════════════════════════════
CRITICAL REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

1. QUESTION DISTRIBUTION (MANDATORY):
   - Section 1: 4 questions
   - Section 2: 6 questions
   - Section 3: 10 questions
   - Section 4: 20 questions
   - Total: Exactly 40 questions

2. AUDIO MAPPING (STRICT REQUIREMENTS):
   - Section 1: 1 audio = 1 question (exactly 4 audios for 4 questions: questions 1-4)
   - Section 2: 1 audio = 1 question (exactly 6 audios for 6 questions: questions 5-10)
   - Section 3: 1 audio = 1 question (exactly 10 audios for 10 questions: questions 11-20)
   - Section 4: 
     * Questions 21-22 (questions 21-22 overall): 1 audio = 1 question each (2 audios)
     * Questions 23-30 (questions 23-30 overall): 1 audio = 2 questions each (4 audios for 8 questions)
       ** AUDIO LENGTH REQUIREMENT: Each audio for questions 23-30 MUST have audio_script that is 60-90 seconds when spoken (approximately 150-250 words). The content must be substantial enough to support 2 distinct questions with sufficient detail.
     * Questions 31-40 (questions 31-40 overall): 1 audio = 1 question each (10 audios)
     * Total Section 4: 16 audios for 20 questions (2 + 4 + 10 = 16 audios)
   
   CRITICAL: Only questions 23-30 should have 2 questions per audio. All other questions (1-22 and 31-40) must have exactly 1 question per audio.

3. DISTRACTORS (4 options per question):
   - One correct answer
   - Distractors must reuse vocabulary and expressions from the audio (same topics, key words, or phrases)
   - Distractors must be plausible but semantically incorrect, incomplete, or misleading
   - Avoid obviously wrong or absurd answers - all options must look reasonably possible before listening
   - Incorrect options can be partial quotes from the audio combined with wrong details (wrong time, wrong person, wrong consequence, etc.)

4. PARAPHRASING REQUIREMENT:
   - In Section 4 especially, correct options must reformulate the audio, not copy wording directly
   - Answers should demonstrate comprehension, not just recognition

5. LANGUAGE REQUIREMENTS:
   - Use Standard French (no slang, no regionalisms)
   - Authentic French as used in Canada
   - Difficulty comes from language complexity and speed, NOT trick questions

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY valid JSON matching this exact schema:

{
  "section": "Compréhension Orale",
  "audio_items": [
    {
      "audio_id": "A1",
      "section_id": 1,
      "repeatable": true,
      "audio_script": "Full French transcript of the audio to be spoken.",
      "questions": [
        {
          "question_id": 1,
          "question": "French question text.",
          "options": {
            "A": "Option A text.",
            "B": "Option B text.",
            "C": "Option C text.",
            "D": "Option D text."
          },
          "correct_answer": "C"
        }
      ]
    }
  ]
}

FIELD REQUIREMENTS:

- audio_id: Unique identifier like "A1", "A2", "B1", etc. (sequential within section)
- section_id: Number 1, 2, 3, or 4
- repeatable: Boolean (true for sections 1-2, false for sections 3-4)
- audio_script: Complete French transcript of what will be spoken (natural, authentic French)
  * CRITICAL LENGTH REQUIREMENT: For questions 23-30 (2 questions per audio), the audio_script MUST be 60-90 seconds when spoken (approximately 150-250 words). These scripts need substantial content to support 2 distinct questions.
  * For all other questions, audio_script length should be appropriate to the section (short for Section 1, medium for others).
- questions: Array of questions for this audio (1-3 questions per audio depending on section)
  - question_id: Sequential number 1-40 across all sections
  - question: French question text
  - options: Object with keys "A", "B", "C", "D" and French option text values
  - correct_answer: "A", "B", "C", or "D"

IMPORTANT - DIALOGUE FORMATTING:
For Sections 2, 3, and 4 that contain conversations or dialogues:
- Format the audio_script with clear speaker indicators
- Use format: "Personne A: dialogue text" or "Speaker 1: dialogue text"
- Each speaker's line should be on a new line
- Example format:
  "Personne A: Bonjour, je voudrais réserver une table pour deux personnes.
  Personne B: Bien sûr, pour quelle date ?
  Personne A: Pour ce samedi soir, vers 19 heures."

For Section 1 (single speaker descriptions):
- Use plain text without speaker indicators

CRITICAL CONSTRAINTS (MUST FOLLOW):
- Total number of questions across all audio_items MUST be exactly 40 (not 20, not 30, exactly 40)
- Section 1: MUST have exactly 4 questions
- Section 2: MUST have exactly 6 questions  
- Section 3: MUST have exactly 10 questions
- Section 4: MUST have exactly 20 questions
- Respect the mapping rules: some audios carry 2–3 questions
- Do NOT include any explanation, key, rubric, or commentary outside this JSON structure
- Ensure question_id values are sequential from 1 to 40
- COUNT YOUR QUESTIONS: Before returning, verify you have exactly 40 questions total`;

}

/**
 * Generate questions for a listening task using AI
 */
export async function generateListeningQuestions(
  taskId: string
): Promise<{
  audioItems: Array<Omit<any, '_id'>>;
  questions: ReadingListeningQuestion[];
}> {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Please set it in your environment variables.');
  }

  console.log(`\n🤖 Generating listening questions for task ${taskId}...`);

  const prompt = getMasterPrompt();
  // Add explicit instruction at the end of prompt
  const enhancedPrompt = prompt + `\n\n⚠️ CRITICAL: You MUST generate exactly 40 questions total. Count them before returning. The validation will reject your response if you don't have exactly 40 questions.`;

  // Retry mechanism - try up to 3 times if we don't get 40 questions
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`\n🔄 Retry attempt ${attempt}/3 (previous attempt did not generate 40 questions)...`);
      }

      const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        parts: [{
          text: enhancedPrompt
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

    let parsed: any;
    try {
      const responseText = response.text || '';
      parsed = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse AI response as JSON');
      console.error('Response:', response.text);
      throw new Error('Failed to parse AI response. The AI may not have returned valid JSON.');
    }

    if (!parsed.audio_items || !Array.isArray(parsed.audio_items)) {
      throw new Error('Invalid response format: missing audio_items array');
    }

    // Validate question count
    let totalQuestions = 0;
    parsed.audio_items.forEach((item: any) => {
      if (item.questions && Array.isArray(item.questions)) {
        totalQuestions += item.questions.length;
      }
    });

      console.log(`\n📊 Validation: Found ${totalQuestions} questions in AI response`);
      if (totalQuestions !== 40) {
        const errorMsg = `Expected 40 questions total, got ${totalQuestions}`;
        if (attempt < 3) {
          console.warn(`\n⚠️  ${errorMsg}. Retrying...`);
          lastError = new Error(errorMsg);
          continue; // Try again
        } else {
          console.error(`\n❌ ERROR: ${errorMsg} after ${attempt} attempts.`);
          console.error(`   This is a critical error. The AI must generate exactly 40 questions.`);
          console.error(`   Please try running the command again.`);
          throw new Error(`${errorMsg}. Please regenerate.`);
        }
      }

      // Convert to database format
      const audioItems: Array<Omit<any, '_id'>> = [];
      const questions: ReadingListeningQuestion[] = [];
      let globalQuestionNumber = 1;

    for (const audioItem of parsed.audio_items) {
      // Create AudioItem
      const audioItemDoc = createAudioItem(
        audioItem.audio_id,
        taskId,
        audioItem.section_id,
        audioItem.audio_script,
        audioItem.repeatable || false
      );
      audioItems.push(audioItemDoc);

      // Create Questions for this audio
      if (audioItem.questions && Array.isArray(audioItem.questions)) {
        for (const q of audioItem.questions) {
          // Convert correct_answer from "A"/"B"/"C"/"D" to 0/1/2/3
          const correctAnswerMap: { [key: string]: number } = {
            'A': 0,
            'B': 1,
            'C': 2,
            'D': 3
          };
          const correctAnswer = correctAnswerMap[q.correct_answer];
          if (correctAnswer === undefined) {
            throw new Error(`Invalid correct_answer: ${q.correct_answer}. Must be A, B, C, or D`);
          }

          // Convert options object to array
          const optionsArray = [
            q.options.A,
            q.options.B,
            q.options.C,
            q.options.D
          ];

          // Create question
          const questionDoc = createQuestion(
            `${taskId}_q${globalQuestionNumber}`,
            taskId,
            'listening',
            globalQuestionNumber,
            q.question,
            optionsArray,
            correctAnswer,
            `La réponse correcte est ${q.options[q.correct_answer]}.`, // Basic explanation
            true,
            undefined, // questionText not used for listening
            audioItem.audio_id // audioId reference
          );
          questions.push(questionDoc);
          globalQuestionNumber++;
        }
      }
    }

      console.log(`✅ Generated ${audioItems.length} audio items and ${questions.length} questions`);
      
      return { audioItems, questions };
    } catch (error: any) {
      // If it's a validation error and we have retries left, continue
      if (error.message.includes('Expected 40 questions') && attempt < 3) {
        lastError = error;
        continue;
      }
      // Otherwise, throw immediately
      console.error('❌ Error generating listening questions:', error.message);
      throw error;
    }
  }
  
  // If we get here, all retries failed
  if (lastError) {
    throw lastError;
  }
  
  throw new Error('Failed to generate questions after all retry attempts');
}

/**
 * Validate generated listening questions structure
 */
export function validateGeneratedListeningQuestions(
  audioItems: any[],
  questions: ReadingListeningQuestion[]
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (questions.length === 0) {
    errors.push('No questions generated');
    return { valid: false, errors };
  }

  if (questions.length !== 40) {
    errors.push(`Expected 40 questions, got ${questions.length}`);
  }

  // Check section distribution
  const sectionCounts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0 };
  audioItems.forEach(item => {
    const itemQuestions = questions.filter(q => q.audioId === item.audioId);
    sectionCounts[item.sectionId] += itemQuestions.length;
  });

  if (sectionCounts[1] !== 4) {
    errors.push(`Section 1 should have 4 questions, got ${sectionCounts[1]}`);
  }
  if (sectionCounts[2] !== 6) {
    errors.push(`Section 2 should have 6 questions, got ${sectionCounts[2]}`);
  }
  if (sectionCounts[3] !== 10) {
    errors.push(`Section 3 should have 10 questions, got ${sectionCounts[3]}`);
  }
  if (sectionCounts[4] !== 20) {
    errors.push(`Section 4 should have 20 questions, got ${sectionCounts[4]}`);
  }

  // Check for duplicate question numbers
  const questionNumbers = questions.map(q => q.questionNumber);
  const duplicates = questionNumbers.filter((num, index) => questionNumbers.indexOf(num) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate question numbers found: ${duplicates.join(', ')}`);
  }

  // Validate each question
  questions.forEach((q, index) => {
    if (q.options.length !== 4) {
      errors.push(`Question ${index + 1}: Must have exactly 4 options, got ${q.options.length}`);
    }
    if (q.correctAnswer < 0 || q.correctAnswer > 3) {
      errors.push(`Question ${index + 1}: Correct answer must be 0-3, got ${q.correctAnswer}`);
    }
    if (!q.explanation || q.explanation.trim() === '') {
      errors.push(`Question ${index + 1}: Missing explanation`);
    }
    if (!q.audioId) {
      errors.push(`Question ${index + 1}: Missing audioId reference`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
