import { TEFSection } from '../../types';

/**
 * Builds the evaluation system prompt with CCI Paris framework
 */
export function buildRubricSystemPrompt(section: TEFSection, isFullExam: boolean = false): string {
  const sectionFocus = section === 'OralExpression'
    ? `- EO1 focus: interactional competence, asking relevant questions, clarity, register, turn-taking, reactivity.
- EO2 focus: persuasion, argument structure, handling counter-arguments, coherence, examples, nuance.`
    : `- Section A (Fait divers) focus: complete/continue a news article (rubrique faits-divers), continuation not starting from scratch, multiple paragraphs required, journalistic style, factual reporting, past tenses (passé composé, imparfait), 80 mots minimum.
- Section B (Argumentation) focus: letter to the journal format, express and justify a point of view, at least 3 arguments required to defend the position, development/nuance/clarification of arguments, formal register, 200 mots minimum.`;

  const fullExamGuidance = isFullExam ? (section === 'OralExpression' ? `

IMPORTANT - FULL EXAM EVALUATION (EO1 + EO2):
You are evaluating a COMPLETE exam that includes BOTH Section A (EO1) and Section B (EO2). The transcript contains both tasks.

EVALUATION APPROACH FOR FULL EXAM:
1. Analyze the candidate's performance SEPARATELY for EO1 and EO2 within the combined transcript.
2. Identify which parts of the transcript correspond to EO1 (Section A) and which correspond to EO2 (Section B).
3. Score each task individually, then synthesize an OVERALL score that reflects performance across BOTH tasks.

SCORING GUIDELINES FOR FULL EXAM:
- If performance is STRONGLY UNEVEN (e.g., strong EO2 but weak EO1 with only 2-3 questions), the overall CLB level should reflect this imbalance.
  * Example: Strong EO2 (CLB 8) but weak EO1 (CLB 5-6 due to insufficient questions) should result in overall CLB 6-7, NOT CLB 8.
- If both tasks are performed at similar levels, the overall score should align with that consistent level.
- The overall CLB level should be a balanced assessment that accounts for weaknesses in EITHER task, as the exam requires competency in BOTH interactional communication (EO1) AND argumentation (EO2).
- Task fulfillment scores should reflect performance on BOTH tasks, not just the stronger one.

CRITERIA EVALUATION FOR FULL EXAM:
- taskFulfillment: Evaluate fulfillment for BOTH EO1 (did they ask sufficient relevant questions?) AND EO2 (did they present a coherent argument and handle counter-arguments?).
- coherence: Assess coherence across both tasks, but also note any differences between the two sections.
- lexicalRange: Consider vocabulary used across both tasks.
- grammarControl: Evaluate grammar consistently across both tasks.
- fluency: Assess fluency across the entire performance.
- interaction: Evaluate interaction quality in EO1 AND argumentative skills in EO2.

In your overall_comment, specifically address performance on BOTH tasks (e.g., "In Section A (EO1), the candidate asked only 2 questions, which was insufficient. However, in Section B (EO2), they demonstrated strong argumentation skills...").` : section === 'WrittenExpression' ? `

IMPORTANT - FULL EXAM EVALUATION (Section A + Section B):
You are evaluating a COMPLETE exam that includes BOTH Section A (Fait divers) and Section B (Argumentation). The text contains both tasks.

EVALUATION APPROACH FOR FULL EXAM:
1. Analyze the candidate's performance SEPARATELY for Section A and Section B within the combined text.
2. Identify which parts of the text correspond to Section A (fait divers continuation) and which correspond to Section B (letter to journal).
3. Score each task individually, then synthesize an OVERALL score that reflects performance across BOTH tasks.

SCORING GUIDELINES FOR FULL EXAM:
- If performance is STRONGLY UNEVEN (e.g., strong Section B but weak Section A with insufficient words or missing multiple paragraphs), the overall CLB level should reflect this imbalance.
  * Example: Strong Section B (CLB 8) but weak Section A (CLB 5-6 due to insufficient words or poor continuation) should result in overall CLB 6-7, NOT CLB 8.
- If both tasks are performed at similar levels, the overall score should align with that consistent level.
- The overall CLB level should be a balanced assessment that accounts for weaknesses in EITHER task, as the exam requires competency in BOTH factual reporting (Section A) AND argumentation (Section B).
- Task fulfillment scores should reflect performance on BOTH tasks, not just the stronger one.

CRITERIA EVALUATION FOR FULL EXAM:
- taskFulfillment: Evaluate fulfillment for BOTH Section A (did they properly continue the article with sufficient detail and multiple paragraphs?) AND Section B (did they write a proper letter with at least 3 arguments?).
- coherence: Assess coherence across both tasks, but also note any differences between the two sections (factual reporting vs argumentation).
- lexicalRange: Consider vocabulary used across both tasks (journalistic vs argumentative vocabulary).
- grammarControl: Evaluate grammar, syntax, and spelling consistently across both tasks. Pay particular attention to spelling mastery in formal writing.
- clarityDevelopment: Assess clarity separately for Section A (news clarity) vs Section B (argumentation clarity), and evaluate development/nuance separately for each section.
- argumentationQuality: For Section B, evaluate argumentation quality. For Section A, evaluate factual reporting quality. Then synthesize an overall assessment.

In your overall_comment, specifically address performance on BOTH tasks (e.g., "In Section A, the candidate wrote only 60 words and did not use multiple paragraphs, which was insufficient. However, in Section B, they demonstrated strong argumentation skills with 3 well-developed arguments...").` : '') : '';

  const evaluatorType = section === 'OralExpression' ? 'Expression Orale' : 'Expression Écrite';
  
  return `You are an official TEF Canada ${evaluatorType} evaluator trained using the CCI Paris – Le français des affaires evaluation framework.
Return ONLY valid JSON (no markdown).
The candidate writes/speaks French. Evaluate the candidate's performance only${section === 'OralExpression' ? ' (ignore examiner content)' : ''}.
${section === 'OralExpression' ? `If the transcript is diarized with lines prefixed by "User:" and "Examiner:", always treat "User:" lines as the candidate's speech and "Examiner:" lines as context only. Do not score the examiner.` : ''}
If the text is too short or missing, say so and give safe general advice.

${section === 'WrittenExpression' ? `CRITICAL: EVALUATION CONSISTENCY REQUIREMENT (Written Expression Only)
Your evaluation MUST be consistent and reproducible. When evaluating the same text multiple times, you MUST produce the same or nearly identical CLB level (within ±1 level maximum). Use objective measures (word counts, argument counts, error counts) as primary anchors. Do NOT introduce random variations in scoring.` : ''}

You must evaluate candidates objectively according to CECR levels (A1 to C2) and report Canadian Language Benchmark (CLB) equivalence.
General guidance:
- Evaluate based on communication effectiveness, interaction quality, and language mastery.
- Minor grammatical errors are acceptable from B2 and above.
- Do not penalize accent unless comprehension is affected.
- Judge effectiveness and clarity, not perfection.
${section === 'WrittenExpression' ? '- USE OBJECTIVE MEASURES FIRST (word counts, error counts, argument counts) before applying subjective judgments.' : ''}

${section === 'WrittenExpression' ? `EVALUATION QUESTIONS TO GUIDE YOUR ASSESSMENT (based on official TEF framework):
When evaluating written expression, consider these questions to inform your scoring and feedback:

For text quality and effectiveness:
- Is the text clear, limpid, confused, or incoherent? (Le texte est-il clair, limpide, confus, incohérent ?)
- Are the information summary, vague, precise, or detailed? (Les informations sont-elles sommaires, vagues, précises, détaillées ?)

For language mastery:
- Are sentences simple, complex, or mastered? (Les phrases sont-elles simples, complexes, maîtrisées ?)
- Are tenses and modes correctly used? (Les temps et modes sont-ils correctement utilisés ?)
- Is usual spelling mastered? (L'orthographe usuelle est-elle maîtrisée ?)
- Is the vocabulary used correct, precise, adequate? (Le lexique employé est-il juste, précis, adéquat ?)

Use these questions to inform your evaluation across all criteria, ensuring your feedback addresses clarity, precision, detail level, sentence complexity, tense/mode accuracy, spelling mastery, and vocabulary adequacy.` : ''}

OPTIONAL FLUENCY ANALYSIS (if provided):
- You may receive an additional section labelled "FLUENCY ANALYSIS (from audio)" that contains objective metrics derived from the candidate's audio (hesitation_rate, filler_words_per_min, average_pause_seconds, self_corrections, fluency_comment).
- Use these metrics ONLY to inform the \"fluency\" and \"interaction\" criteria (scores and comments). They should NOT directly change grammar or vocabulary scores.
- If this section is missing, rely solely on the transcript to infer fluency.
${fullExamGuidance}

SCORING SYSTEM:
- Overall score (score field): Provide a TEF score from 0 to 699 (integer). This represents the candidate's overall performance on the TEF Canada scale.
- Criteria scores (criteria object): Each criterion must include BOTH a score (0-10 integer) AND a comment (English sentence explaining how the candidate performed). Format each criterion as an object with "score" (number) and "comment" (string):
  * taskFulfillment: { score: 0-10, comment: "English sentence explaining performance" }
  * coherence: { score: 0-10, comment: "English sentence explaining performance" }
  * lexicalRange: { score: 0-10, comment: "English sentence explaining performance" }
  * ${section === 'WrittenExpression' ? 'grammarControl' : 'grammarControl'}: { score: 0-10, comment: "English sentence explaining performance" }
  * ${section === 'WrittenExpression' ? 'clarityDevelopment' : section === 'OralExpression' ? 'fluency' : 'fluency'}: { score: 0-10, comment: "English sentence explaining performance" }
  * ${section === 'WrittenExpression' ? 'argumentationQuality' : section === 'OralExpression' ? 'interaction' : 'interaction'}: { score: 0-10, comment: "English sentence explaining performance" }

Provide concise, actionable feedback.

${sectionFocus}

Use these criteria (adapt comments to the section):
- Task fulfillment / pertinence - Respect for the situation and task completion
- Coherence & organization - General organization of the text, clarity, structure
- Lexical range & appropriateness - Vocabulary (lexique): correctness, precision, adequacy
- ${section === 'WrittenExpression' ? 'Grammar, syntax & spelling control' : 'Grammar control'} - ${section === 'WrittenExpression' ? 'Syntax mastery (simple/complex sentences), tenses/modes correctness, spelling mastery (orthographe)' : 'Grammar accuracy and control'}
- ${section === 'OralExpression' ? 'Fluency & pronunciation (as inferred from transcript)' : 'Clarity & development'} ${section === 'WrittenExpression' ? '- Clarity of information/argumentation, ability to develop, nuance, and clarify one\'s statements' : ''}
- ${section === 'OralExpression' ? 'Interaction (turn-taking, reactivity, sociolinguistic appropriateness)' : section === 'WrittenExpression' ? 'Argumentation quality (Section B) / Factual reporting quality (Section A) - Section-specific effectiveness' : 'Argumentation quality'}

${section === 'WrittenExpression' ? `WRITTEN EXPRESSION SPECIFIC GUIDANCE:

FOR SECTION A (Fait divers - News Article Continuation):
- Task: Complete/continue a news article (rubrique faits-divers) - continuation, NOT starting from scratch. The candidate is given the beginning of an article and must continue it.
- Objective: Write the continuation of the article (80 mots minimum)
- Duration: 25 minutes
- Format requirements:
  * Minimum 80 words (80 mots minimum - no maximum specified, but 80-120 words is reasonable for quality)
  * Multiple paragraphs required (en faisant plusieurs paragraphes)
  * Journalistic style, objective tone, third person
  * Past tenses primarily (passé composé and imparfait) for narration
- Content focus:
  * Factual reporting (fait divers)
  * Who, What, When, Where, Why/How structure
  * Objective, journalistic tone
- Evaluation points:
  * Respect for news article format: Is it a proper continuation of the given beginning in journalistic style?
  * Clarity: Is the information clear, precise, detailed, or vague/summary?
  * Organization: Proper journalistic structure with multiple paragraphs
  * Development: Ability to develop the news story with sufficient detail
  * Syntax: Are sentences simple, complex, or mastered?
  * Tenses/modes: Correct use of passé composé and imparfait
  * Spelling: Is usual spelling mastered?

FOR SECTION B (Argumentation - Letter to the Journal):
- Task: Write a letter to the journal (une phrase extraite d'un journal) expressing and justifying a point of view
- Objective: Express and justify a point of view (exprimer son point de vue et le justifier)
- Duration: 35 minutes
- Format requirements:
  * Minimum 200 words (200 mots minimum - no maximum specified, but 200-250 words is reasonable)
  * Letter format to the journal (Écrivez une lettre au journal)
  * Response to a statement/affirmation extracted from a journal article
- Content requirements:
  * At least 3 arguments required to defend the point of view (Développez au moins 3 arguments pour défendre votre point de vue)
  * Clear expression of opinion on the given statement
  * Development, nuance, and clarification of arguments (la capacité à développer, nuancer, préciser ses propos)
- Structure:
  * Formal letter structure (addressing the journal)
  * Introduction: Reference to the statement and clear position
  * Development: At least 3 arguments with examples/evidence
  * Conclusion: Restatement of position
  * Formal connectors appropriate for argumentative writing (cependant, néanmoins, en effet, par conséquent, d'une part/d'autre part, en conclusion)
- Register: Formal, polite (vous form if addressing someone)
- Evaluation points:
  * Respect for letter format and formal register: Is it a proper letter addressing the journal?
  * Clarity: Is the argumentation clear, limpid, or confused/incoherent?
  * Development: Are the arguments developed, nuanced, and clarified? Are at least 3 arguments present?
  * Precision: Are the information vague or precise/detailed?
  * Organization: Clear structure with introduction, development (at least 3 arguments), conclusion
  * Syntax: Are sentences simple, complex, or mastered? (Complex sentences expected for argumentation)
  * Tenses/modes: Correct use of appropriate tenses and modes
  * Spelling: Is usual spelling mastered? (Critical for formal writing)
  * Vocabulary: Is the vocabulary used correct, precise, adequate for formal argumentation?

WORD COUNT REQUIREMENTS AND PENALTIES:
- Section A target: 80-120 words (minimum 80 as per PDF)
- Section B target: 200-250 words (minimum 200 as per PDF)
- Apply graduated penalties for word count violations:
  * Within range: No penalty
  * 10-20% below minimum: Minor penalty (-1 on taskFulfillment)
  * 20-40% below minimum: Moderate penalty (-2 on taskFulfillment)
  * >40% below minimum: Severe penalty (-3 to -4 on taskFulfillment)
  * Significantly over maximum: Minor penalty if content becomes repetitive or loses focus` : ''}

OUTPUT FORMAT:
Required keys: score, clbLevel, cecrLevel, overall_comment, criteria, strengths, weaknesses, top_improvements, upgraded_sentences, model_answer

For OralExpression (EO1/Section A), also include:
- actual_questions_count: Integer count of relevant questions the candidate asked in Section A (target: 9-10). Count only questions that help gather information about the scenario.

For WrittenExpression, also include:
- actual_word_count_sectionA: Integer word count for Section A (target: 80-120 words)
- actual_word_count_sectionB: Integer word count for Section B (target: 200-250 words)

For WrittenExpression with two sections (Section A + Section B), also provide:
- model_answer_sectionA: Model answer for Section A (fait divers, 80-120 words)
- model_answer_sectionB: Model answer for Section B (argumentation, 200-250 words)
- corrections_sectionA: Array of 2-4 UpgradedSentence objects with corrections for Section A
- corrections_sectionB: Array of 2-4 UpgradedSentence objects with corrections for Section B

Level requirements:
- clbLevel: Canadian Language Benchmark (format: "CLB X" where X is a single number, e.g., "CLB 7", "CLB 5", "CLB 9")
  IMPORTANT: Use a single CLB level, NOT a range. Choose the level that best represents the candidate's performance.
- cecrLevel: CECR level (one of exactly: A1, A2, B1, B2, C1, C2)
  IMPORTANT: Use a single CECR level, NOT a range. Choose the level that best represents the candidate's performance.

${section === 'WrittenExpression' ? `DETERMINISTIC CLB SCORING GUIDELINES (for consistent evaluation - Written Expression only):
To ensure consistency across multiple evaluations of the same text, use these objective guidelines when determining CLB levels:

For Written Expression, base CLB assignment on objective measures:

CLB 4 (A2): 
- Task fulfillment: 40-60% (e.g., Section A: 50-70 words, Section B: 150-180 words; Section A: 1 paragraph, Section B: fewer than 3 arguments)
- Average criteria score: 4-5/10
- Many basic errors in grammar, spelling, vocabulary
- Limited coherence, minimal development

CLB 5 (B1):
- Task fulfillment: 60-75% (e.g., Section A: 70-90 words, Section B: 180-210 words; Section A: 2 paragraphs, Section B: 2-3 arguments but underdeveloped)
- Average criteria score: 5-6/10
- Frequent but not systematic errors
- Some coherence, basic development

CLB 6 (B2):
- Task fulfillment: 75-85% (e.g., Section A: 90-110 words, Section B: 210-240 words; Section A: 2+ paragraphs, Section B: 3+ arguments with some development)
- Average criteria score: 6-7/10
- Occasional errors, generally accurate
- Good coherence, adequate development

CLB 7 (B2-C1):
- Task fulfillment: 85-95% (e.g., Section A: 100-120 words with multiple paragraphs, Section B: 230-250 words with 3+ well-developed arguments)
- Average criteria score: 7-8/10
- Few errors, good accuracy
- Strong coherence, good development and nuance

CLB 8+ (C1-C2):
- Task fulfillment: 95-100% (all requirements met excellently)
- Average criteria score: 8-9/10
- Very few or no significant errors
- Excellent coherence, sophisticated development

IMPORTANT FOR CONSISTENCY:
- Calculate the average of all 6 criteria scores first
- Then map to CLB based on the average score ranges above
- If task fulfillment is significantly below thresholds (e.g., <80 words for Section A, <200 words for Section B, <3 arguments for Section B), cap CLB at 5-6 even if other criteria are strong
- Word count and argument count are OBJECTIVE measures - use them as anchors for taskFulfillment scoring
- Spelling errors should be counted objectively: 0-2 errors = 8-10, 3-5 errors = 6-7, 6-10 errors = 4-5, 10+ errors = 2-3` : ''}

${section === 'WrittenExpression' ? `CONSISTENCY REQUIREMENT (Written Expression Only):
When evaluating the same text multiple times, you MUST produce the same or very similar CLB level (within ±1 level). Use the objective measures above (word count, argument count, error counts) as anchors to ensure consistency.` : ''}

IMPORTANT: Do NOT use overall_band_estimate, cecr_level, clb_equivalence, or approximate_tef_band. 
Only use clbLevel and cecrLevel. Both must be single specific values, not ranges.

LANGUAGE REQUIREMENTS:
All evaluation feedback and commentary must be in English, except where French examples are required:

English (all feedback fields):
- feedback: English
- strengths: English (array of English strings) - "Points Forts" feedback
- weaknesses: English (array of English strings) - "Points à Améliorer" feedback
- grammarNotes: English
- vocabularyNotes: English
- overall_comment: English
- top_improvements: English (array of English strings) - "Priorités d'Amélioration" feedback
- criteria: English descriptions/feedback for each criterion (scores are numbers 0-10, but the feedback strings must be in English) - "Détail des Critères" feedback

French (examples only):
- model_answer: French (demonstrates a model French response for the candidate)
- upgraded_sentences.weak: French (original candidate quote in French)
- upgraded_sentences.better: French (improved French version)
- upgraded_sentences.why: English (explanation of why the improvement was made)

model_answer: Provide a model answer (in French) that demonstrates how a strong candidate (B2-C1 level) would approach this task.
${section === 'OralExpression' ? `For EO1: Show a natural conversation flow with 8-10 relevant questions, appropriate register, and clear communication.
For EO2: Show a persuasive argument with clear structure, effective counter-argument handling, and strong examples.
Keep it realistic and appropriate for the TEF Canada context (2-3 paragraphs or a structured dialogue example).` : section === 'WrittenExpression' ? `For Section A (fait divers): Show a proper continuation of the news article with multiple paragraphs, factual reporting style, correct use of past tenses (passé composé, imparfait), and sufficient detail (80-120 words). Demonstrate journalistic objectivity and clarity.
For Section B (argumentation): Show a proper letter to the journal with formal register, clear position statement, at least 3 well-developed arguments with examples, and effective use of formal connectors. Demonstrate ability to develop, nuance, and clarify arguments (200-250 words).` : ''}

FOR WRITTEN EXPRESSION WITH TWO SECTIONS (Section A + Section B):
If evaluating WrittenExpression with both Section A (fait divers) and Section B (argumentation), you MUST provide:
- model_answer_sectionA: A model fait divers (80-120 words) in French for Section A - REQUIRED, must be actual text, not a message
- model_answer_sectionB: A model argumentation (200-250 words) in French for Section B - REQUIRED, must be actual text, not a message
- corrections_sectionA: An array of 2-4 UpgradedSentence objects with corrections specific to Section A
- corrections_sectionB: An array of 2-4 UpgradedSentence objects with corrections specific to Section B

IMPORTANT: When providing model_answer_sectionA and model_answer_sectionB, DO NOT put messages like "Not applicable" or "Refer to..." in the model_answer field. Either omit model_answer entirely, or provide a brief combined example. The model_answer_sectionA and model_answer_sectionB fields MUST contain actual French text responses, not explanatory messages.

IMPORTANT (UI requirement): upgraded_sentences must be an array of 3–5 objects, each with EXACT keys:
- weak: MUST BE AN EXACT COPY-PASTE from the candidate's transcript (French). Do NOT paraphrase or modify. The UI highlights this text in the original, so it MUST match exactly (including spacing, punctuation). Copy the exact words as written by the candidate.
- better: your improved version (French), natural and TEF-appropriate
- why: 1 short sentence in English explaining the improvement

CRITICAL FOR HIGHLIGHTING TO WORK:
- The "weak" field must be found verbatim in the candidate's text
- Example: If candidate wrote "je suis allé a le magasin", use exactly "je suis allé a le magasin" (not "je suis allé au magasin" or "allé a le")
- Keep quotes short (5-15 words) for cleaner highlighting

If the transcript is too short to extract 3 examples, return as many as possible (>=1), otherwise [] if empty transcript.
Do not rename keys. Do not nest objects. Do not return strings for upgraded_sentences.

For EO1 (Section A): account for whether the candidate asked ~10 relevant questions (you may be given an estimated count).`;
}

/**
 * Builds the user message for evaluation
 */
export function buildEvaluationUserMessage(
  section: TEFSection,
  scenarioId: number,
  timeLimitSec: number,
  prompt: string,
  candidateText: string,
  estimatedQuestionsCount?: number,
  isFullExam: boolean = false,
  taskPartA?: any,
  taskPartB?: any,
  eo2RemainingSeconds?: number,
  fluencyAnalysis?: any
): string {
  const eo1Metrics = section === 'OralExpression' && estimatedQuestionsCount !== undefined
    ? `\nEO1 metric — estimated questions asked (heuristic): ${estimatedQuestionsCount} (target 9–10).
IMPORTANT: You must independently count the actual relevant questions the candidate asked in Section A (EO1).
Return this count in the "actual_questions_count" field.
A relevant question is one that helps gather information about the scenario (not rhetorical, not clarification requests).

GRADUATED SCORING BASED ON QUESTION COUNT:
The number of questions asked significantly impacts "Task fulfillment" and "Interaction" scores:
- 9-10 questions: Full marks possible (no penalty)
- 7-8 questions: Moderate penalty (-1 to -2 points on taskFulfillment and interaction)
- 5-6 questions: Significant penalty (-2 to -3 points)
- 3-4 questions: Severe penalty (-3 to -4 points)
- 1-2 questions: Very severe penalty (-4 to -5 points, max score ~5/10)
- 0 questions: Task not fulfilled (taskFulfillment and interaction max 2-3/10)

Apply this penalty proportionally. A candidate with 8 questions and excellent language should score higher than one with 4 questions and excellent language.
The question count is a CORE requirement of EO1 - it cannot be overlooked even if other aspects are strong.`
    : '';

  // Calculate word count for written expression
  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const writtenMetrics = section === 'WrittenExpression' && candidateText
    ? (() => {
        const totalWords = getWordCount(candidateText);
        // Try to split by section markers
        const sectionAMatch = candidateText.match(/Section A[^:]*:\s*([\s\S]*?)(?=Section B|$)/i);
        const sectionBMatch = candidateText.match(/Section B[^:]*:\s*([\s\S]*?)$/i);
        const sectionAWords = sectionAMatch ? getWordCount(sectionAMatch[1]) : null;
        const sectionBWords = sectionBMatch ? getWordCount(sectionBMatch[1]) : null;
        
        let metrics = `\n\nWRITTEN EXPRESSION WORD COUNT:
- Total words: ${totalWords}`;
        
        if (sectionAWords !== null) {
          metrics += `\n- Section A words: ${sectionAWords} (target: 80-120)`;
          if (sectionAWords < 80) metrics += ` ⚠️ BELOW MINIMUM`;
          else if (sectionAWords > 120) metrics += ` ⚠️ ABOVE MAXIMUM`;
        }
        
        if (sectionBWords !== null) {
          metrics += `\n- Section B words: ${sectionBWords} (target: 200-250)`;
          if (sectionBWords < 200) metrics += ` ⚠️ BELOW MINIMUM`;
          else if (sectionBWords > 250) metrics += ` ⚠️ ABOVE MAXIMUM`;
        }
        
        // For single section mode (partA or partB)
        if (sectionAWords === null && sectionBWords === null) {
          // Detect if it's likely Section A or B based on word count
          if (totalWords <= 150) {
            metrics += `\n- Detected as Section A (fait divers), target: 80-120 words`;
            if (totalWords < 80) metrics += ` ⚠️ BELOW MINIMUM`;
            else if (totalWords > 120) metrics += ` ⚠️ ABOVE MAXIMUM`;
          } else {
            metrics += `\n- Detected as Section B (argumentation), target: 200-250 words`;
            if (totalWords < 200) metrics += ` ⚠️ BELOW MINIMUM`;
            else if (totalWords > 250) metrics += ` ⚠️ ABOVE MAXIMUM`;
          }
        }
        
        metrics += `\n
IMPORTANT: Apply word count penalties to taskFulfillment score as described in the system prompt.
Count the actual words yourself to verify, then factor this into your evaluation.`;
        
        return metrics;
      })()
    : '';

  const fullExamContext = isFullExam && taskPartA && taskPartB
    ? `\n\n=== FULL EXAM CONTEXT ===
This is a COMPLETE exam evaluation (mode: full) that includes BOTH tasks:
- Section A${section === 'WrittenExpression' ? ' (Fait divers - news article continuation)' : ' (EO1)'}: Task ID ${taskPartA.id || 'N/A'} - ${taskPartA.prompt || taskPartA.subject || 'See combined prompt above'}
- Section B${section === 'WrittenExpression' ? ' (Argumentation - letter to journal)' : ' (EO2)'}: Task ID ${taskPartB.id || 'N/A'} - ${taskPartB.prompt || taskPartB.subject || 'See combined prompt above'}

The candidate ${section === 'WrittenExpression' ? 'text' : 'transcript'} contains BOTH Section A and Section B responses combined.
Please analyze performance separately for each section, then provide an overall score that fairly reflects competency across BOTH tasks.
Remember: Weak performance in EITHER task should lower the overall CLB level.

${section === 'WrittenExpression' ? `\nIMPORTANT FOR WRITTEN EXPRESSION:
- Section A is a "fait divers" (news article continuation) - minimum 80 words, multiple paragraphs required
- Section B is an "argumentation" (letter to journal) - minimum 200 words, at least 3 arguments required
- The text is formatted as: "Section A (Fait divers):\n[text]\n\nSection B (Argumentation):\n[text]"
- You MUST provide separate model answers and corrections for each section:
  * model_answer_sectionA: A model fait divers continuation (80-120 words, multiple paragraphs) in French
  * model_answer_sectionB: A model letter to journal (200-250 words, at least 3 arguments) in French
  * corrections_sectionA: 2-4 specific corrections for Section A (EXACT quotes copied from Section A text - must match verbatim for UI highlighting)
  * corrections_sectionB: 2-4 specific corrections for Section B (EXACT quotes copied from Section B text - must match verbatim for UI highlighting)
- Identify which part of the text belongs to Section A vs Section B before providing corrections.
- CRITICAL: The "weak" field in each correction must be an EXACT COPY from the candidate's text (not paraphrased) for the UI to highlight it correctly.
- Evaluate Section A for: proper continuation format, multiple paragraphs, factual reporting, clarity, detail level
- Evaluate Section B for: letter format, at least 3 arguments, development/nuance/clarification, formal register, clarity of argumentation
${taskPartA?.modelAnswer ? `\nREFERENCE MODEL ANSWER FOR SECTION A:
Below is a reference model answer from the knowledge base. Use this as guidance for format, vocabulary, and structure when creating your model_answer_sectionA. However, adapt it to match the specific prompt given to the candidate.
---\n${taskPartA.modelAnswer}\n---` : ''}
${taskPartB?.modelAnswer ? `\nREFERENCE MODEL ANSWER FOR SECTION B:
Below is a reference model answer from the knowledge base. Use this as guidance for format, vocabulary, and structure when creating your model_answer_sectionB. However, adapt it to match the specific prompt given to the candidate.
---\n${taskPartB.modelAnswer}\n---` : ''}
When creating your model answers, use the reference examples above to understand the expected format, level of vocabulary, and structure. Your model answers should be similar in quality and style, but tailored to the specific prompts the candidate received.` : section === 'OralExpression' ? `\nIMPORTANT FOR ORAL EXPRESSION:
- Section A (EO1) is an interactive telephone call - target 9-10 relevant questions
- Section B (EO2) is a persuasion task - handling counter-arguments and developing arguments` : ''}`
    : '';

  const eo2TimeContext =
    section === 'OralExpression' && typeof eo2RemainingSeconds === 'number'
      ? `\n\nEO2 TIME CONTEXT:
- Remaining seconds on the Section B (EO2) timer when the exam ended (from UI timer): ${eo2RemainingSeconds}.
- If this value is very low (<= 20), assume the conversation ended naturally at the time limit.
- If this value is high (>= 60), the candidate likely stopped the task significantly before the end of the allotted time.`
      : '';

  const fluencyContext =
    fluencyAnalysis && section === 'OralExpression'
      ? `\n\n=== FLUENCY ANALYSIS (from audio) ===
hesitation_rate: ${fluencyAnalysis.hesitation_rate ?? 'unknown'}
filler_words_per_min: ${typeof fluencyAnalysis.filler_words_per_min === 'number' ? fluencyAnalysis.filler_words_per_min : 'unknown'}
average_pause_seconds: ${typeof fluencyAnalysis.average_pause_seconds === 'number' ? fluencyAnalysis.average_pause_seconds : 'unknown'}
self_corrections: ${typeof fluencyAnalysis.self_corrections === 'number' ? fluencyAnalysis.self_corrections : 'unknown'}
fluency_comment: ${fluencyAnalysis.fluency_comment ?? 'N/A'}`
      : '';

  return `Section: ${section}
Scenario ID: ${scenarioId}
Time limit (sec): ${timeLimitSec}
Prompt (French): ${prompt}${eo1Metrics}${writtenMetrics}${fullExamContext}${eo2TimeContext}${fluencyContext}

Candidate ${section === 'WrittenExpression' ? 'text' : 'transcript'} (French):
${candidateText || "(empty)"}`;
}

