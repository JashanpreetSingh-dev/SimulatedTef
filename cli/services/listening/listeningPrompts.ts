/**
 * Prompt management for listening question generation
 * Handles master prompt creation and enhancement with assignment-specific content
 */

/**
 * Master prompt for TEF Canada listening comprehension question generation
 */
export function getMasterPrompt(): string {
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

CRITICAL - DIALOGUE FORMATTING RULES (MUST FOLLOW EXACTLY):
For Sections 2, 3, and 4 that contain conversations or dialogues:
- Format MUST be: "SpeakerName: dialogue text" with each speaker on a NEW LINE
- Use consistent, simple speaker names (e.g., "Employé", "Client", "Réceptionniste", "Marc", "Sophie")
- DO NOT use generic labels like "Agent:", "Voix feminin:", "Personne A:", "Speaker 1:"
- Each speaker's dialogue MUST be on a separate line
- Format example (CORRECT):
  "Employé: Bonjour, je voudrais réserver une table pour deux personnes.
  Client: Bien sûr, pour quelle date ?
  Employé: Pour ce samedi soir, vers 19 heures."
- Format example (WRONG - DO NOT USE):
  "Agent: Bonjour...
  Voix feminin: Bien sûr..."
  "Personne A: Bonjour...
  Personne B: Bien sûr..."

For Section 1 (single speaker descriptions):
- Use plain text WITHOUT any speaker indicators or labels
- Just the spoken text directly

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
 * Enhance the base prompt with assignment-specific content and question count requirements
 */
export function enhancePrompt(
  basePrompt: string,
  targetQuestionCount: number,
  taskPrompt?: string
): string {
  let enhancedPrompt = basePrompt;
  
  // Add assignment-specific prompt if provided
  if (taskPrompt && taskPrompt.trim()) {
    enhancedPrompt = basePrompt + `\n\n═══════════════════════════════════════════════════════════════════════════════
ASSIGNMENT-SPECIFIC CONTENT GUIDANCE
═══════════════════════════════════════════════════════════════════════════════

The following prompt/theme should guide the content and topics for this assignment:

${taskPrompt}

IMPORTANT: Use this prompt as guidance for the themes, topics, and situations in your audio scripts and questions. 
The content should align with this theme while still following the TEF Canada format and structure.
All audio scripts, questions, and options should be relevant to this theme when possible.

═══════════════════════════════════════════════════════════════════════════════
`;
  }
  
  // Add question count instruction
  if (targetQuestionCount < 40) {
    // For practice assignments with fewer questions, use a simplified instruction
    enhancedPrompt = enhancedPrompt + `\n\n⚠️ CRITICAL FOR PRACTICE ASSIGNMENT:
- You MUST generate exactly ${targetQuestionCount} questions total (NOT 40)
- Distribute questions across sections proportionally if possible, but prioritize quality over strict section distribution
- You can use fewer sections if needed (e.g., just Sections 1-2 for 5-10 questions)
- Count your questions before returning - you must have exactly ${targetQuestionCount} questions
- The validation will reject your response if you don't have exactly ${targetQuestionCount} questions`;
  } else {
    // For full mock exams, use the standard 40-question structure
    enhancedPrompt = enhancedPrompt + `\n\n⚠️ CRITICAL: You MUST generate exactly ${targetQuestionCount} questions total. Count them before returning. The validation will reject your response if you don't have exactly ${targetQuestionCount} questions.`;
  }

  return enhancedPrompt;
}
