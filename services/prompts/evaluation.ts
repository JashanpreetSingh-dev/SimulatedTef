import { TEFSection } from '../../types';

/**
 * Builds the evaluation system prompt with CCI Paris framework
 */
export function buildRubricSystemPrompt(section: TEFSection, isFullExam: boolean = false): string {
  const sectionFocus = section === 'OralExpression'
    ? `- EO1 focus: interactional competence, asking relevant questions, clarity, register, turn-taking, reactivity.
- EO2 focus: persuasion, argument structure, handling counter-arguments, coherence, examples, nuance.`
    : `- Section A (Fait divers) focus: journalistic news story format, factual reporting, past tenses (passé composé, imparfait), 80-120 words.
- Section B (Argumentation) focus: persuasive essay structure, clear thesis, developed arguments with examples, counter-argument handling, formal connectors, 200-250 words.`;

  const fullExamGuidance = isFullExam ? `

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

In your overall_comment, specifically address performance on BOTH tasks (e.g., "In Section A (EO1), the candidate asked only 2 questions, which was insufficient. However, in Section B (EO2), they demonstrated strong argumentation skills...").` : '';

  const evaluatorType = section === 'OralExpression' ? 'Expression Orale' : 'Expression Écrite';
  
  return `You are an official TEF Canada ${evaluatorType} evaluator trained using the CCI Paris – Le français des affaires evaluation framework.
Return ONLY valid JSON (no markdown).
The candidate writes/speaks French. Evaluate the candidate's performance only${section === 'OralExpression' ? ' (ignore examiner content)' : ''}.
${section === 'OralExpression' ? `If the transcript is diarized with lines prefixed by "User:" and "Examiner:", always treat "User:" lines as the candidate's speech and "Examiner:" lines as context only. Do not score the examiner.` : ''}
If the text is too short or missing, say so and give safe general advice.

You must evaluate candidates objectively according to CECR levels (A1 to C2) and report Canadian Language Benchmark (CLB) equivalence.
General guidance:
- Evaluate based on communication effectiveness, interaction quality, and language mastery.
- Minor grammatical errors are acceptable from B2 and above.
- Do not penalize accent unless comprehension is affected.
- Judge effectiveness and clarity, not perfection.

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
  * grammarControl: { score: 0-10, comment: "English sentence explaining performance" }
  * fluency: { score: 0-10, comment: "English sentence explaining performance" }
  * interaction: { score: 0-10, comment: "English sentence explaining performance" }

Provide concise, actionable feedback.

${sectionFocus}

Use these criteria (adapt comments to the section):
- Task fulfillment / pertinence
- Coherence & organization
- Lexical range & appropriateness
- Grammar control
- Fluency ${section === 'OralExpression' ? '& pronunciation (as inferred from transcript)' : '(writing flow, sentence variety, transitions)'}
- ${section === 'OralExpression' ? 'Interaction (turn-taking, reactivity, sociolinguistic appropriateness)' : 'Argumentation quality (for Section B: thesis clarity, argument development, counter-argument handling, persuasion; for Section A: journalistic objectivity, factual reporting)'}

${section === 'WrittenExpression' ? `WRITTEN EXPRESSION SPECIFIC GUIDANCE:

FOR SECTION A (Fait divers - News Story):
- Task: Write a factual news story (80-120 words) based on a given scenario
- Format: Journalistic style, objective tone, third person
- Structure: Who, What, When, Where, Why/How
- Tenses: Primarily passé composé and imparfait for narration
- Register: Formal, journalistic
- Key criteria: Factual accuracy, appropriate news format, correct past tenses

FOR SECTION B (Argumentation - Persuasive Essay):
- Task: Write an argumentative essay (200-250 words) defending a position
- Format: Formal letter or essay structure
- Structure: Introduction (thesis) → Arguments with examples → Address counter-arguments → Conclusion
- Connectors: Must use formal linking words (cependant, néanmoins, en effet, par conséquent, d'une part/d'autre part, en conclusion)
- Register: Formal, polite (vous form if addressing someone)
- Key criteria: Clear thesis, developed arguments, examples/evidence, counter-argument handling, logical flow

WORD COUNT REQUIREMENTS AND PENALTIES:
- Section A target: 80-120 words
- Section B target: 200-250 words
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
For EO1: Show a natural conversation flow with 8-10 relevant questions, appropriate register, and clear communication.
For EO2: Show a persuasive argument with clear structure, effective counter-argument handling, and strong examples.
Keep it realistic and appropriate for the TEF Canada context (2-3 paragraphs or a structured dialogue example).

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
- Section A (EO1): Task ID ${taskPartA.id || 'N/A'} - ${taskPartA.prompt || taskPartA.subject || 'See combined prompt above'}
- Section B (EO2): Task ID ${taskPartB.id || 'N/A'} - ${taskPartB.prompt || taskPartB.subject || 'See combined prompt above'}

The candidate transcript contains BOTH Section A and Section B responses combined.
Please analyze performance separately for each section, then provide an overall score that fairly reflects competency across BOTH tasks.
Remember: Weak performance in EITHER task should lower the overall CLB level.

${section === 'WrittenExpression' ? `\nIMPORTANT FOR WRITTEN EXPRESSION:
- Section A is a "fait divers" (news story) - 80-120 words
- Section B is an "argumentation" (argumentative essay) - 200-250 words
- The transcript is formatted as: "Section A (Fait divers):\n[text]\n\nSection B (Argumentation):\n[text]"
- You MUST provide separate model answers and corrections for each section:
  * model_answer_sectionA: A model fait divers (80-120 words) in French
  * model_answer_sectionB: A model argumentation (200-250 words) in French
  * corrections_sectionA: 2-4 specific corrections for Section A (EXACT quotes copied from Section A text - must match verbatim for UI highlighting)
  * corrections_sectionB: 2-4 specific corrections for Section B (EXACT quotes copied from Section B text - must match verbatim for UI highlighting)
- Identify which part of the transcript belongs to Section A vs Section B before providing corrections.
- CRITICAL: The "weak" field in each correction must be an EXACT COPY from the candidate's text (not paraphrased) for the UI to highlight it correctly.
${taskPartA?.modelAnswer ? `\nREFERENCE MODEL ANSWER FOR SECTION A:
Below is a reference model answer from the knowledge base. Use this as guidance for format, vocabulary, and structure when creating your model_answer_sectionA. However, adapt it to match the specific prompt given to the candidate.
---\n${taskPartA.modelAnswer}\n---` : ''}
${taskPartB?.modelAnswer ? `\nREFERENCE MODEL ANSWER FOR SECTION B:
Below is a reference model answer from the knowledge base. Use this as guidance for format, vocabulary, and structure when creating your model_answer_sectionB. However, adapt it to match the specific prompt given to the candidate.
---\n${taskPartB.modelAnswer}\n---` : ''}
When creating your model answers, use the reference examples above to understand the expected format, level of vocabulary, and structure. Your model answers should be similar in quality and style, but tailored to the specific prompts the candidate received.` : ''}`
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

