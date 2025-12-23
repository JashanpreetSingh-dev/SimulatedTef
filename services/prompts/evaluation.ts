import { TEFSection } from '../../types';

/**
 * Builds the evaluation system prompt with CCI Paris framework
 */
export function buildRubricSystemPrompt(section: TEFSection, isFullExam: boolean = false): string {
  const sectionFocus = section === 'OralExpression'
    ? `- EO1 focus: interactional competence, asking relevant questions, clarity, register, turn-taking, reactivity.
- EO2 focus: persuasion, argument structure, handling counter-arguments, coherence, examples, nuance.`
    : `- Focus on written expression quality, structure, coherence, and language mastery.`;

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

  return `You are an official TEF Canada Expression Orale evaluator trained using the CCI Paris – Le français des affaires evaluation framework.
Return ONLY valid JSON (no markdown).
The candidate speaks French. Evaluate the candidate's performance only (ignore examiner content).
If the transcript is diarized with lines prefixed by "User:" and "Examiner:", always treat "User:" lines as the candidate's speech and "Examiner:" lines as context only. Do not score the examiner.
If transcript is too short or missing, say so and give safe general advice.

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
- Fluency & pronunciation (as inferred from transcript)
- Interaction (turn-taking, reactivity, sociolinguistic appropriateness)

OUTPUT FORMAT:
Required keys: score, clbLevel, cecrLevel, overall_comment, criteria, strengths, weaknesses, top_improvements, upgraded_sentences, model_answer

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

IMPORTANT (UI requirement): upgraded_sentences must be an array of 3–5 objects, each with EXACT keys:
- weak: a short quote from the candidate (French) that can be improved
- better: your improved version (French), natural and TEF-appropriate
- why: 1 short sentence in English explaining the improvement
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
    ? `\nEO1 metric — estimated questions asked: ${estimatedQuestionsCount} (target 9–10).
Metric method: heuristic.
When scoring Task fulfillment / pertinence and Interaction, account for whether enough relevant questions were asked.`
    : '';

  const fullExamContext = isFullExam && taskPartA && taskPartB
    ? `\n\n=== FULL EXAM CONTEXT ===
This is a COMPLETE exam evaluation (mode: full) that includes BOTH tasks:
- Section A (EO1): Task ID ${taskPartA.id || 'N/A'} - ${taskPartA.prompt || 'See combined prompt above'}
- Section B (EO2): Task ID ${taskPartB.id || 'N/A'} - ${taskPartB.prompt || 'See combined prompt above'}

The candidate transcript contains BOTH Section A and Section B responses combined.
Please analyze performance separately for each section, then provide an overall score that fairly reflects competency across BOTH tasks.
Remember: Weak performance in EITHER task should lower the overall CLB level.`
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
Prompt (French): ${prompt}${eo1Metrics}${fullExamContext}${eo2TimeContext}${fluencyContext}

Candidate transcript (French):
${candidateText || "(empty)"}`;
}

