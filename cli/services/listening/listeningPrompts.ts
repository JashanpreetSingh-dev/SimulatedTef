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

⚠️⚠️⚠️ CRITICAL - DIALOGUE FORMATTING RULES (MUST FOLLOW EXACTLY) ⚠️⚠️⚠️

For Sections 2, 3, and 4 that contain conversations between 2+ people:
- YOU MUST USE "SpeakerName:" LABELS at the START of EACH speaker's turn
- Each speaker's line MUST be on a SEPARATE LINE (use actual newlines in the string)
- Use consistent names (e.g., "Marc", "Sophie", "Client", "Employé", "Réceptionniste")
- WITHOUT LABELS, THE AUDIO WILL USE ONLY ONE VOICE FOR ALL SPEAKERS!

✅ CORRECT FORMAT (different voices for each speaker):
"Marc: Bonjour Sophie. Comment vas-tu?
Sophie: Bien, merci Marc. Je suis un peu fatiguée.
Marc: Moi aussi. Je prends le bus à huit heures.
Sophie: Ah, moi je conduis ma voiture."

❌ WRONG FORMAT (will use ONLY ONE VOICE - DO NOT DO THIS):
"Bonjour Sophie. Comment vas-tu? Bien, merci Marc. Je suis un peu fatiguée. Moi aussi. Je prends le bus à huit heures."

❌ ALSO WRONG (no newlines between speakers):
"Marc: Bonjour Sophie. Sophie: Bien, merci."

For Section 1 (single speaker - announcements, descriptions):
- Use plain text WITHOUT any speaker labels
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
  
  // Add question count instruction
  if (targetQuestionCount < 40) {
    // For practice assignments, prioritize user prompt
    if (taskPrompt && taskPrompt.trim()) {
      enhancedPrompt = basePrompt + `\n\n═══════════════════════════════════════════════════════════════════════════════
USER'S ASSIGNMENT PROMPT (PRIMARY GUIDE)
═══════════════════════════════════════════════════════════════════════════════

"${taskPrompt}"

PRIMARY PRINCIPLE: This user prompt is your MAIN guide. Interpret it intelligently to determine:
- What topics, themes, and situations to focus on in your audio scripts
- What vocabulary and expressions to include
- What types of conversations or announcements would best serve this learning goal
- What difficulty level and format is appropriate
- What section_id (1, 2, 3, or 4) would be most pedagogically effective:
  * section_id: 1 = Single-speaker announcements/descriptions (best for simple vocabulary, basic comprehension)
  * section_id: 2 = Short dialogues (best for practical situations, everyday conversations)
  * section_id: 3 = Medium conversations (best for work/studies/daily life, more complex interactions)
  * section_id: 4 = Advanced listening (best for interviews, reports, argumentative content, advanced topics)

CRITICAL REQUIREMENTS:
- The MAJORITY of your audio content (scripts, questions, options) MUST be directly related to this prompt
- Do NOT just use this as "optional guidance" - it should be the PRIMARY focus of your content
- All audio scripts should be relevant to the themes and topics in the user's prompt
- Questions should test comprehension of content that relates to the user's prompt
- Options should use vocabulary and concepts from the prompt's theme
- Choose section_id (1, 2, 3, or 4) based on what would best serve the learning objectives in the user's prompt

The TEF Canada format structure (sections, question types, etc.) should be followed, but the CONTENT and section_id selection should be primarily driven by the user's prompt above.

═══════════════════════════════════════════════════════════════════════════════
`;
    }
    // For practice assignments with fewer questions, use simplified structure (no sections required)
    // Note: If taskPrompt was provided, it's already been added above
    enhancedPrompt = enhancedPrompt + `\n\n⚠️ CRITICAL FOR PRACTICE ASSIGNMENT:
IGNORE the section structure above. This is a PRACTICE assignment, not a full mock exam.

SIMPLIFIED REQUIREMENTS:
- Generate exactly ${targetQuestionCount} questions total
- Each audio should have 1-2 questions maximum
- All audio items should be short, medium or long length (15-90 seconds when spoken)
- All audio can be repeatable (set repeatable: true)
- Choose section_id (1, 2, 3, or 4) based on what best serves the user's prompt and learning objectives:
  * section_id: 1 = Single-speaker announcements/descriptions (best for simple vocabulary, basic comprehension)
  * section_id: 2 = Short dialogues (best for practical situations, everyday conversations)
  * section_id: 3 = Medium conversations (best for work/studies/daily life, more complex interactions)
  * section_id: 4 = Advanced listening (best for interviews, reports, argumentative content, advanced topics)
- Question IDs should be sequential from 1 to ${targetQuestionCount}

CONTENT GUIDELINES:
- Mix of question types: main idea, specific details, speaker intention
- Progressive difficulty is NOT required - keep difficulty consistent
- Focus on practical, everyday French situations
- Distractors should still be plausible and use vocabulary from the audio

⚠️⚠️⚠️ CRITICAL - AUDIO SCRIPT FORMAT (OVERRIDES SECTION RULES ABOVE) ⚠️⚠️⚠️

For SINGLE speaker (section_id: 1) - announcements, descriptions:
- Just write plain text: "Bienvenue à tous. Le magasin ferme dans dix minutes."
- NO speaker labels needed

For MULTI-SPEAKER dialogues (section_id: 2, 3, or 4) - conversations between 2+ people:
- YOU MUST USE "SpeakerName:" LABELS at the start of EACH speaker's turn
- Each speaker's line MUST be on a SEPARATE LINE (use actual newlines)
- WITHOUT labels, the audio will use only ONE voice for everyone!

✅ CORRECT FORMAT for dialogue (section_id: 2, 3, or 4):
"Marc: Bonjour Sophie. Comment vas-tu?
Sophie: Bien, merci Marc. Je suis un peu fatiguée.
Marc: Moi aussi. Je prends le bus à huit heures.
Sophie: Ah, moi je conduis ma voiture."

❌ WRONG FORMAT (will use only ONE voice):
"Bonjour Sophie. Comment vas-tu? Bien, merci Marc. Je suis un peu fatiguée..."

Speaker label examples: "Client:", "Agent:", "Marc:", "Sophie:", "Homme:", "Femme:", "Employé:", "Réceptionniste:"

OUTPUT FORMAT remains the same JSON structure, but simplified:
- section_id: 1 for single-speaker, 2/3/4 for multi-speaker dialogues (choose based on complexity/length)
- All repeatable values should be true
- Generate enough audio items to cover ${targetQuestionCount} questions (1-2 questions per audio)

COUNT YOUR QUESTIONS: You must have exactly ${targetQuestionCount} questions total.
The validation will REJECT your response if you don't have exactly ${targetQuestionCount} questions.`;
  } else {
    // For full mock exams (40 questions), add taskPrompt as optional theme if provided
    // Mock exams should maintain format structure, but can incorporate theme as secondary guidance
    if (taskPrompt && taskPrompt.trim()) {
      enhancedPrompt = enhancedPrompt + `\n\n═══════════════════════════════════════════════════════════════════════════════
OPTIONAL THEME (FOR MOCK EXAM)
═══════════════════════════════════════════════════════════════════════════════

The following theme may be incorporated into SOME questions, but you MUST maintain topic diversity across all 40 questions:

${taskPrompt}

IMPORTANT: This is a FULL MOCK EXAM. The TEF Canada format structure is PRIMARY. 
You may incorporate this theme into some questions, but do NOT use it for all questions.
Maintain the required topic diversity across all sections.

═══════════════════════════════════════════════════════════════════════════════
`;
    }
    // For full mock exams, use the standard 40-question structure
    enhancedPrompt = enhancedPrompt + `\n\n⚠️ CRITICAL: You MUST generate exactly ${targetQuestionCount} questions total. Count them before returning. The validation will reject your response if you don't have exactly ${targetQuestionCount} questions.`;
  }

  return enhancedPrompt;
}
