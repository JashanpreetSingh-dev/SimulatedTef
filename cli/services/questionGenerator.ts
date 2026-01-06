/**
 * AI-powered question generation service for TEF Canada reading comprehension
 * Uses Gemini API to generate questions following the official TEF format
 */

import { GoogleGenAI, Type } from "@google/genai";
import { ReadingListeningQuestion } from "../../types";
import { createQuestion } from "../../server/models/Question";

// Get API key
const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY is missing!');
  console.error('Please set GEMINI_API_KEY in your environment variables.');
}

const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

/**
 * Master prompt for TEF Canada reading comprehension question generation
 */
function getMasterPrompt(theme?: string): string {
  const themeSection = theme 
    ? `\n\nOPTIONAL THEME: If you wish, you may incorporate the theme "${theme}" into SOME questions, but you MUST maintain topic diversity. Do NOT use this theme for all questions.`
    : '';

  return `Act as a Senior French Language Expert specialized in the TEF Canada (Test d'Évaluation de Français). 
You are constructing a Compréhension Écrite (Reading Comprehension) module that follows the official TEF Canada format.

═══════════════════════════════════════════════════════════════════════════════
EXAM STRUCTURE OVERVIEW
═══════════════════════════════════════════════════════════════════════════════

The TEF Canada Reading Comprehension exam consists of exactly 40 questions distributed across 7 sections (A through G).
Total time: 60 minutes. Each section tests different reading skills and increases in difficulty from A1 (Section A) to C1 (Section G).

═══════════════════════════════════════════════════════════════════════════════
DETAILED SECTION BREAKDOWN
═══════════════════════════════════════════════════════════════════════════════

SECTION A - Document Identification (7 questions, CEFR A1-A2)
───────────────────────────────────────────────────────────────────────────────
Purpose: Test ability to identify document type and purpose from short everyday documents.

Format:
- Each question presents a SHORT document (30-80 words maximum)
- Questions ask: "What is this document?" or "Why was this document written?"
- Document types: classified ads, weather alerts, public notices, announcements, 
  short messages, signs, labels, simple instructions

Question Structure:
- questionText: Contains the complete short document
- question: "Quel est le type de ce document?" or "Quel est l'objectif de ce document?"
- options: 4 short options (1-2 sentences each) describing document type or purpose
- Difficulty: Basic vocabulary, simple sentence structures

Topics: MUST be RANDOM and DIVERSE - use different topics for each of the 7 questions:
  Examples: job offers, weather warnings, event announcements, store hours, 
           transportation schedules, apartment rentals, course advertisements, etc.

───────────────────────────────────────────────────────────────────────────────

SECTION B - Sentence Completion (6 questions, CEFR A2-B1)
───────────────────────────────────────────────────────────────────────────────
Purpose: Test logical coherence, vocabulary, and grammar in context.

Format:
- Each question presents a sentence with a missing segment marked as [...]
- Student must choose the correct completion from 4 options
- Sentences are standalone (not part of a larger text)

Question Structure:
- question: The sentence with [...] indicating the blank
- questionText: Can be omitted (the sentence itself is the reference)
- options: 4 completions (phrases or clauses) that could fill the blank
- Difficulty: Tests vocabulary precision, grammatical structures, logical flow

Topics: MUST be RANDOM and DIVERSE - each sentence should cover different topics:
  Examples: work, travel, education, health, technology, environment, culture, 
           relationships, hobbies, current events, etc.

───────────────────────────────────────────────────────────────────────────────

SECTION C - Text Cohesion (2 questions, CEFR B1-B2)
───────────────────────────────────────────────────────────────────────────────
Purpose: Test ability to follow logical narrative and understand structural links.

Format:
- Each question presents a short story or article (100-150 words) with:
  - Missing sentences that need to be inserted, OR
  - Sentences that are out of order and need to be reordered
- Questions ask: "Which sentence should go in position X?" or "What is the correct order?"

Question Structure:
- questionText: Contains the story/article with gaps or marked positions
- question: Asks about sentence placement or ordering
- options: 4 different sentences or sentence sequences
- Difficulty: Requires understanding narrative flow, cause-effect, chronological order

Topics: MUST be RANDOM and DIVERSE - two completely different stories/articles:
  Examples: personal narratives, news stories, historical accounts, fictional scenarios, etc.

───────────────────────────────────────────────────────────────────────────────

SECTION D - Detailed Scanning (4 questions, CEFR B1-B2)
───────────────────────────────────────────────────────────────────────────────
Purpose: Test ability to quickly scan for specific information.

Format:
- Each question presents a detailed text (product description, service information, 
  informational text, 80-120 words)
- Questions ask about specific details: prices, dates, conditions, features, etc.
- Requires finding precise information quickly

Question Structure:
- questionText: Contains the full product description or informational text
- question: Asks about a specific detail from the text
- options: 4 specific answers (dates, numbers, features, conditions)
- Difficulty: Tests scanning skills and attention to detail

Topics: MUST be RANDOM and DIVERSE - four different types of texts:
  Examples: product specifications, service terms, event details, course descriptions,
           membership benefits, travel packages, insurance policies, etc.

───────────────────────────────────────────────────────────────────────────────

SECTION E - Visual Interpretation (Variable questions, CEFR B2)
───────────────────────────────────────────────────────────────────────────────
Purpose: Test ability to interpret data, graphs, diagrams, or visual instructions.

Format:
- Each question describes a graph, chart, diagram, or visual representation
- Questions ask about trends, comparisons, data points, or visual instructions
- The visual is described in text form (since we're generating text-based questions)

Question Structure:
- questionText: Contains detailed description of the visual (graph data, chart values, 
                diagram elements, visual layout)
- question: Asks about interpretation: "What trend is shown?" "Which statement is true?"
- options: 4 interpretations or statements about the visual
- Difficulty: Requires data analysis and visual comprehension

Topics: MUST be RANDOM and DIVERSE - different types of visuals:
  Examples: sales charts, population graphs, process diagrams, maps, schedules,
           organizational charts, statistical data, etc.

───────────────────────────────────────────────────────────────────────────────

SECTIONS F & G - Deep Analysis (Remaining questions, CEFR B2-C1)
───────────────────────────────────────────────────────────────────────────────
Purpose: Test ability to detect nuances, author's tone, underlying arguments, and 
         deep comprehension of complex texts.

Format:
- Each question presents a long, complex text (150-200 words)
- Texts are: press articles, opinion pieces, administrative reports, academic texts,
            editorials, analysis articles
- Questions test: author's tone (irony, concern, approval, criticism), main arguments,
                  implicit meanings, text structure, writer's intention

Question Structure:
- questionText: Contains the full article/report (150-200 words)
- question: Asks about tone, argument, implication, or interpretation
- options: 
  * For some questions: 4 short options (1-2 sentences)
  * For "which option describes" questions: 4 paragraph-long options (2-4 sentences each)
    describing different scenarios, interpretations, or characterizations
- Difficulty: Advanced vocabulary, complex sentence structures, nuanced meanings

Question Types to Include:
1. "Quel est le ton de l'auteur?" (What is the author's tone?)
2. "Quelle est l'intention de l'auteur?" (What is the author's intention?)
3. "Quelle option décrit le mieux [situation/personnage/résultat]?" 
   (Which option best describes...?) - USE PARAGRAPH-LONG OPTIONS
4. "Quel argument sous-tend ce texte?" (What argument underlies this text?)
5. "Que suggère implicitement l'auteur?" (What does the author implicitly suggest?)

Topics: MUST be RANDOM and DIVERSE - each article should cover different topics:
  Examples: politics, economics, environment, education, technology, health, culture,
           social issues, business, science, current events, etc.
  Use professional "français des affaires" vocabulary for business-related articles.

═══════════════════════════════════════════════════════════════════════════════
CRITICAL REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

1. TOPIC DIVERSITY (MANDATORY):
   - You MUST use RANDOM, DIVERSE topics across all 40 questions
   - Do NOT repeat the same topic or theme multiple times
   - Each question should cover a different subject area
   - Variety is essential: mix everyday life, professional, academic, cultural topics
${themeSection}

2. REFERENCE TEXT REQUIREMENT:
   - Questions MUST NOT test general knowledge
   - All questions (except Section B fill-in-the-blank) MUST have reference text in "questionText"
   - CRITICAL: Each of the 40 questions must have UNIQUE, DIFFERENT reference text
   - Do NOT reuse the same document, passage, or text for multiple questions
   - Every question needs its own distinct reference material

3. DISTRACTORS (4 options per question):
   - One correct answer
   - One 'near-miss' (plausible but logically incorrect)
   - One opposite
   - One irrelevant

4. LANGUAGE REQUIREMENTS:
   - Use Standard French (no slang, no regionalisms)
   - Section F: Include professional "français des affaires" vocabulary
   - Difficulty comes from language complexity, NOT trick questions
   - Authentic French as used in Canada

5. QUESTION DISTRIBUTION:
   - Section A: 7 questions
   - Section B: 6 questions  
   - Section C: 2 questions
   - Section D: 4 questions
   - Section E: Variable (typically 5-7 questions)
   - Sections F & G: Remaining questions to total 40

CRITICAL: All 40 questions must have COMPLETELY DIFFERENT reference texts and topics. 
No two questions should share the same document, passage, sentence, or subject matter.

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY valid JSON with this structure:

{
  "questions": [
    {
      "section": "A",
      "questionNumber": 1,
      "question": "Quel est l'objectif de ce document?",
      "questionText": "Le texte de référence complet ici...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explication de la bonne réponse..."
    }
  ]
}

FIELD DESCRIPTIONS:
- section: One of "A", "B", "C", "D", "E", "F", or "G"
- questionNumber: Sequential number from 1 to 40 (must be in order)
- question: The question text in French
- questionText: REQUIRED for sections A, C, D, E, F, G (the reference text/document/passage)
- options: Array of exactly 4 answer choices in French
- correctAnswer: Index of correct option (0, 1, 2, or 3)
- explanation: French explanation of why the answer is correct

FIELD REQUIREMENTS BY SECTION:

Section A (Document Identification):
- questionText: REQUIRED - Complete short document (30-80 words)
- question: "Quel est le type de ce document?" or "Quel est l'objectif de ce document?"
- options: 4 short descriptions (1-2 sentences each)

Section B (Sentence Completion):
- questionText: OPTIONAL (can be omitted - the sentence in "question" serves as reference)
- question: Complete sentence with [...] indicating the blank
- options: 4 phrase/clause completions

Section C (Text Cohesion):
- questionText: REQUIRED - Complete story/article (100-150 words) with gaps or marked positions
- question: About sentence placement or ordering
- options: 4 different sentences or sequences

Section D (Detailed Scanning):
- questionText: REQUIRED - Complete product description or informational text (80-120 words)
- question: About specific details (prices, dates, features, etc.)
- options: 4 specific answers

Section E (Visual Interpretation):
- questionText: REQUIRED - Detailed description of the visual (graph, chart, diagram data)
- question: About interpretation or trends
- options: 4 interpretations

Sections F & G (Deep Analysis):
- questionText: REQUIRED - Complete article/report (150-200 words)
- question: About tone, argument, implication, or interpretation
- options: 
  * Standard questions: 4 short options (1-2 sentences)
  * "Which option describes" questions: 4 paragraph-long options (2-4 sentences each)

CRITICAL REMINDERS:
- Each question must have a UNIQUE topic and reference text
- Use RANDOM, DIVERSE topics across all 40 questions
- All text must be in French
- Maintain authentic TEF Canada format and difficulty progression`;
}

/**
 * Get simplified prompt for practice assignments (fewer than 40 questions)
 */
function getPracticePrompt(numberOfQuestions: number, theme?: string): string {
  const themeSection = theme 
    ? `\nCONTENT THEME: "${theme}" - Use this theme to guide the topics of your questions and passages.`
    : '';

  return `Act as a Senior French Language Expert specialized in the TEF Canada (Test d'Évaluation de Français). 
You are creating a PRACTICE reading comprehension exercise (NOT a full mock exam).

═══════════════════════════════════════════════════════════════════════════════
PRACTICE ASSIGNMENT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Generate exactly ${numberOfQuestions} reading comprehension questions.
${themeSection}

SIMPLIFIED STRUCTURE (no sections required):
- Each question should be standalone with its own reference text
- Mix of question types: document identification, sentence completion, detail scanning, text interpretation (based on what the user asks for)
- Consistent difficulty level as the user asks for

CONTENT GUIDELINES:
- Use DIVERSE topics across all ${numberOfQuestions} questions, based on what the user asks for
- Focus on practical, everyday French situations
- Each question needs its own UNIQUE reference text in "questionText"
- Do NOT reuse the same document for multiple questions
- Use Standard French (no slang, no regionalisms)
- Authentic French as used in Canada

DISTRACTORS (4 options per question):
- One correct answer
- One 'near-miss' (plausible but incorrect)
- One opposite meaning
- One irrelevant option

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY valid JSON with this structure:

{
  "questions": [
    {
      "section": "A",
      "questionNumber": 1,
      "question": "Quel est l'objectif de ce document?",
      "questionText": "Le texte de référence complet ici...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explication de la bonne réponse..."
    }
  ]
}

FIELD DESCRIPTIONS:
- section: Always "A" for practice assignments
- questionNumber: Sequential number from 1 to ${numberOfQuestions}
- question: The question text in French
- questionText: REQUIRED - the reference text/document/passage (each must be unique)
- options: Array of exactly 4 answer choices in French
- correctAnswer: Index of correct option (0, 1, 2, or 3)
- explanation: French explanation of why the answer is correct

CRITICAL: 
- Generate EXACTLY ${numberOfQuestions} questions (not 40)
- Each question must have unique questionText
- Count your questions before returning`;
}

/**
 * Generate questions for a reading task using AI
 */
export async function generateQuestions(
  taskId: string,
  options: {
    theme?: string;
    sections?: string[]; // e.g., ['A', 'B', 'C']
    numberOfQuestions?: number; // For practice assignments
  } = {}
): Promise<ReadingListeningQuestion[]> {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Please set it in your environment variables.');
  }

  const { theme, sections, numberOfQuestions } = options;
  const isPracticeMode = numberOfQuestions !== undefined && numberOfQuestions < 40;
  const sectionsToGenerate = sections && sections.length > 0 ? sections : ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  console.log(`\n🤖 Generating questions for task ${taskId}...`);
  if (theme) {
    console.log(`   Theme: ${theme}`);
  }
  if (isPracticeMode) {
    console.log(`   Mode: Practice (${numberOfQuestions} questions)`);
  } else {
    console.log(`   Mode: Full mock exam (40 questions)`);
    console.log(`   Sections: ${sectionsToGenerate.join(', ')}`);
  }

  try {
    // Use simplified prompt for practice mode
    const prompt = isPracticeMode 
      ? getPracticePrompt(numberOfQuestions!, theme)
      : getMasterPrompt(theme);
    
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
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  section: { type: Type.STRING },
                  questionNumber: { type: Type.NUMBER },
                  question: { type: Type.STRING },
                  questionText: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswer: { type: Type.NUMBER },
                  explanation: { type: Type.STRING }
                },
                required: ["section", "questionNumber", "question", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["questions"]
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

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid response format: missing questions array');
    }

    // Filter by requested sections if specified
    let questions = parsed.questions;
    if (sections && sections.length > 0) {
      questions = questions.filter((q: any) => sectionsToGenerate.includes(q.section.toUpperCase()));
    }

    // Validate we have questions
    if (questions.length === 0) {
      throw new Error('No questions generated for the specified sections');
    }

    // Convert to ReadingListeningQuestion format
    const formattedQuestions: ReadingListeningQuestion[] = questions.map((q: any, index: number) => {
      // Ensure questionNumber is sequential (1-40)
      const questionNumber = index + 1;
      
      return createQuestion(
        `${taskId}_q${questionNumber}`,
        taskId,
        'reading',
        questionNumber,
        q.question,
        q.options,
        q.correctAnswer,
        q.explanation,
        true,
        q.questionText
      );
    });

    console.log(`✅ Generated ${formattedQuestions.length} questions`);
    
    return formattedQuestions;
  } catch (error: any) {
    console.error('❌ Error generating questions:', error.message);
    throw error;
  }
}

/**
 * Validate generated questions structure
 */
export function validateGeneratedQuestions(
  questions: ReadingListeningQuestion[],
  expectedCount: number = 40
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (questions.length === 0) {
    errors.push('No questions generated');
    return { valid: false, errors };
  }

  if (questions.length !== expectedCount) {
    errors.push(`Expected ${expectedCount} questions, got ${questions.length}`);
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
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
