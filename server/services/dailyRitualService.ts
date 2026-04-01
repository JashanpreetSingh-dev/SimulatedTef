/**
 * TEF-focused daily revision deck generation via Gemini (structured JSON).
 * Bilingual FR/EN one-liners; enforces exact requested card count via top-up calls.
 */

import { randomUUID } from 'crypto';
import { GoogleGenAI, Type, type Schema } from '@google/genai';
import type {
  DailyRitualCard,
  DailyRitualGrammarCard,
  DailyRitualVocabCard,
} from '../../types';

const apiKey = (process.env.API_KEY || process.env.GEMINI_API_KEY || '').trim();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

type CardWithoutId = Omit<DailyRitualVocabCard, 'id'> | Omit<DailyRitualGrammarCard, 'id'>;

const MAX_LINE_LEN = 240;

function oneLine(s: string): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= MAX_LINE_LEN) return t;
  return `${t.slice(0, MAX_LINE_LEN - 1)}…`;
}

function asTrimmedString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v.trim();
  return String(v).trim();
}

/** Normalize one AI item — Gemini often drifts (casing, empty strings, examples as string). */
function normalizeDeckItem(item: unknown): CardWithoutId | null {
  if (!item || typeof item !== 'object') return null;
  const o = item as Record<string, unknown>;
  const typeRaw = asTrimmedString(o.type).toLowerCase();
  const type = typeRaw === 'vocabulary' ? 'vocab' : typeRaw;

  if (type === 'vocab') {
    const lemma = oneLine(asTrimmedString(o.lemma));
    const englishLine = oneLine(
      asTrimmedString(o.englishLine || o.english || o.englishGloss || o.glossEn || o.meaningEn)
    );
    const contextSentence = oneLine(asTrimmedString(o.contextSentence || o.context));
    const explanation = oneLine(asTrimmedString(o.explanation));
    const registerNote = asTrimmedString(o.registerNote);
    if (!lemma || !englishLine || !contextSentence || !explanation) return null;
    return {
      type: 'vocab',
      lemma,
      englishLine,
      contextSentence,
      explanation,
      ...(registerNote ? { registerNote: oneLine(registerNote) } : {}),
    };
  }

  if (type === 'grammar') {
    const title = oneLine(asTrimmedString(o.title));
    const englishLine = oneLine(
      asTrimmedString(o.englishLine || o.english || o.ruleEnglish || o.summaryEn)
    );
    const ruleSummary = oneLine(asTrimmedString(o.ruleSummary || o.summary || o.rule));
    let examples: string[] = [];
    if (Array.isArray(o.examples)) {
      examples = o.examples.map((x) => oneLine(asTrimmedString(x))).filter(Boolean);
    } else if (typeof o.examples === 'string') {
      examples = o.examples
        .split(/\n+|(?:\s*;\s*)/)
        .map((s) => oneLine(s.trim()))
        .filter(Boolean);
    }
    if (examples.length === 0) {
      const one = oneLine(asTrimmedString(o.example));
      if (one) examples = [one];
    }
    const commonPitfall = asTrimmedString(o.commonPitfall || o.pitfall);
    if (!title || !englishLine || !ruleSummary || examples.length === 0) return null;
    return {
      type: 'grammar',
      title,
      englishLine,
      ruleSummary,
      examples: examples.slice(0, 2),
      ...(commonPitfall ? { commonPitfall: oneLine(commonPitfall) } : {}),
    };
  }

  return null;
}

function extractCardsArray(parsed: unknown): unknown[] {
  if (!parsed || typeof parsed !== 'object') return [];
  const cards = (parsed as { cards?: unknown }).cards;
  return Array.isArray(cards) ? cards : [];
}

function cardKey(c: CardWithoutId): string {
  if (c.type === 'vocab') return `v:${c.lemma.toLowerCase()}`;
  return `g:${c.title.toLowerCase()}`;
}

function mergeDedupe(existing: CardWithoutId[], incoming: CardWithoutId[]): CardWithoutId[] {
  const keys = new Set(existing.map(cardKey));
  const out = [...existing];
  for (const c of incoming) {
    const k = cardKey(c);
    if (keys.has(k)) continue;
    keys.add(k);
    out.push(c);
  }
  return out;
}

export type DailyRitualFocus = 'vocab' | 'grammar' | 'mixed';
export type DailyRitualCefrHint = 'B2' | 'C1';

/** Strict per-type schemas so Gemini must fill all fields (union via anyOf for mixed). */
const VOCAB_CARD_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['vocab'] },
    lemma: { type: Type.STRING, description: 'French headword or expression' },
    englishLine: { type: Type.STRING, description: 'One English line: gloss or meaning' },
    contextSentence: { type: Type.STRING, description: 'One French sentence with the term' },
    explanation: { type: Type.STRING, description: 'One French line: nuance' },
    registerNote: { type: Type.STRING, description: 'Optional one short line' },
  },
  required: ['type', 'lemma', 'englishLine', 'contextSentence', 'explanation'],
  propertyOrdering: ['type', 'lemma', 'englishLine', 'contextSentence', 'explanation', 'registerNote'],
};

const GRAMMAR_CARD_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['grammar'] },
    title: { type: Type.STRING, description: 'Short French label for the rule' },
    englishLine: { type: Type.STRING, description: 'One English line: same rule in English' },
    ruleSummary: { type: Type.STRING, description: 'One French line: the rule' },
    examples: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      minItems: '1',
      maxItems: '3',
      description: '1–2 short French example lines',
    },
    commonPitfall: { type: Type.STRING, description: 'Optional one short line (French)' },
  },
  required: ['type', 'title', 'englishLine', 'ruleSummary', 'examples'],
  propertyOrdering: ['type', 'title', 'englishLine', 'ruleSummary', 'examples', 'commonPitfall'],
};

function buildDeckResponseSchema(focus: DailyRitualFocus, minCards: number): Schema {
  const items: Schema =
    focus === 'vocab'
      ? VOCAB_CARD_SCHEMA
      : focus === 'grammar'
        ? GRAMMAR_CARD_SCHEMA
        : { anyOf: [VOCAB_CARD_SCHEMA, GRAMMAR_CARD_SCHEMA] };

  return {
    type: Type.OBJECT,
    description: `TEF daily revision flashcard deck with a "cards" array of at least ${minCards} items`,
    properties: {
      cards: {
        type: Type.ARRAY,
        items,
        description: `Array of flashcards; must contain at least ${minCards} elements`,
      },
    },
    required: ['cards'],
    propertyOrdering: ['cards'],
  };
}

function buildPrompt(params: {
  focus: DailyRitualFocus;
  cardCount: number;
  cefrHint: DailyRitualCefrHint;
  weakCardsSummary: string | null;
}): string {
  const { focus, cardCount, cefrHint, weakCardsSummary } = params;
  const focusLine =
    focus === 'vocab'
      ? 'Produce ONLY vocabulary cards (type exactly "vocab").'
      : focus === 'grammar'
        ? 'Produce ONLY grammar/tense/structure cards (type exactly "grammar").'
        : 'Mix vocabulary and grammar cards; include both types in roughly equal numbers.';

  return `You are a senior French linguist specializing in TEF Canada preparation at CEFR ${cefrHint}.

CRITICAL: The "cards" array MUST contain EXACTLY ${cardCount} separate objects — ${cardCount} distinct flashcards, not fewer. Each object is ONE card (front/back is handled by the app; do not merge pairs).

Style: almost everything is ONE short line per field (no paragraphs, no multiple sentences per field unless unavoidable).

${focusLine}

Vocabulary cards (type "vocab") — each field one line when possible:
- lemma: French headword or expression
- englishLine: English — one line (gloss or what it means)
- contextSentence: one French sentence using the term in context
- explanation: one French line — nuance or usage
- registerNote: optional one short line (French or English)

Grammar cards (type "grammar"):
- title: one short French label for the rule
- englishLine: one English line — the same rule explained in English
- ruleSummary: one French line — the rule
- examples: array of 1 or 2 very short French example lines only
- commonPitfall: optional one short line (French)

Topics must be diverse (immigration, travail, santé, environnement, éducation, culture, technologie, etc.).

${weakCardsSummary ? `\nLean on or vary these weak areas (rephrase; do not copy):\n${weakCardsSummary}\n` : ''}

Return JSON only with a "cards" array of exactly ${cardCount} items.`;
}

function buildTopUpPrompt(params: {
  need: number;
  focus: DailyRitualFocus;
  cefrHint: DailyRitualCefrHint;
  exclude: CardWithoutId[];
}): string {
  const { need, focus, cefrHint, exclude } = params;
  const excludeLines = exclude
    .slice(-40)
    .map((c) => (c.type === 'vocab' ? `vocab: ${c.lemma}` : `grammar: ${c.title}`))
    .join('\n');

  const focusLine =
    focus === 'vocab'
      ? 'Only type "vocab" cards.'
      : focus === 'grammar'
        ? 'Only type "grammar" cards.'
        : 'Mix "vocab" and "grammar" like before.';

  return `TEF Canada revision, CEFR ${cefrHint}. Generate EXACTLY ${need} NEW cards (the "cards" array length must be ${need}). ${focusLine}
Do NOT repeat any of these (new lemmas/titles only):
${excludeLines || '(none)'}

Same bilingual one-line format as before: every card must include englishLine. Vocab: lemma, englishLine, contextSentence, explanation. Grammar: title, englishLine, ruleSummary, examples (1-2 short French lines).

Return JSON only with property "cards" array of exactly ${need} items.`;
}

function assignIds(cards: CardWithoutId[]): DailyRitualCard[] {
  return cards.map((c): DailyRitualCard => {
    const id = randomUUID();
    if (c.type === 'vocab') {
      return {
        id,
        type: 'vocab',
        lemma: c.lemma,
        englishLine: c.englishLine,
        contextSentence: c.contextSentence,
        explanation: c.explanation,
        ...(c.registerNote ? { registerNote: c.registerNote } : {}),
      };
    }
    return {
      id,
      type: 'grammar',
      title: c.title,
      englishLine: c.englishLine,
      ruleSummary: c.ruleSummary,
      examples: c.examples,
      ...(c.commonPitfall ? { commonPitfall: c.commonPitfall } : {}),
    };
  });
}

function getResponseText(response: unknown): string {
  const r = response as {
    text?: string;
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  if (typeof r.text === 'string' && r.text.trim()) return r.text;
  const parts = r.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const joined = parts
      .map((p) => (typeof p?.text === 'string' ? p.text : ''))
      .join('')
      .trim();
    if (joined) return joined;
  }
  return '';
}

function stripJsonFences(raw: string): string {
  let t = raw.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  }
  return t.trim();
}

async function callGeminiForCards(
  prompt: string,
  options: { minCards: number; focus: DailyRitualFocus }
): Promise<unknown[]> {
  if (!ai) throw new Error('GEMINI_API_KEY is not configured');

  const responseSchema = buildDeckResponseSchema(options.focus, options.minCards);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.4,
      systemInstruction:
        'You are a JSON generator. Output MUST be a single JSON object matching the response schema exactly. ' +
        'No markdown, no code fences, no commentary before or after the JSON. ' +
        'Use the exact property names from the schema. For each card, include every required field.',
    },
  });

  const text = stripJsonFences(getResponseText(response));
  if (!text) {
    const hint =
      process.env.NODE_ENV === 'development'
        ? ` (candidates=${JSON.stringify((response as any)?.candidates?.length ?? 0)})`
        : '';
    throw new Error(`Empty response from AI model${hint}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const snippet = text.slice(0, 500);
    throw new Error(
      `Failed to parse AI deck JSON: ${e instanceof Error ? e.message : String(e)}. Snippet: ${snippet}`
    );
  }

  return extractCardsArray(parsed);
}

function normalizeAll(raw: unknown[]): CardWithoutId[] {
  const out: CardWithoutId[] = [];
  for (const item of raw) {
    const card = normalizeDeckItem(item);
    if (card) out.push(card);
  }
  return out;
}

const MIN_CARDS = 8;
const MAX_TOPUP_ROUNDS = 4;

export async function generateDailyDeck(params: {
  focus: DailyRitualFocus;
  cardCount: number;
  cefrHint: DailyRitualCefrHint;
  weakCardsSummary: string | null;
}): Promise<DailyRitualCard[]> {
  const { focus, cardCount, cefrHint, weakCardsSummary } = params;

  if (cardCount < MIN_CARDS) {
    throw new Error(`cardCount must be at least ${MIN_CARDS}`);
  }

  const mainPrompt = buildPrompt({ focus, cardCount, cefrHint, weakCardsSummary });
  let raw = await callGeminiForCards(mainPrompt, { minCards: cardCount, focus });
  let merged = mergeDedupe([], normalizeAll(raw));

  let rounds = 0;
  while (merged.length < cardCount && rounds < MAX_TOPUP_ROUNDS) {
    const need = cardCount - merged.length;
    const topUpPrompt = buildTopUpPrompt({
      need,
      focus,
      cefrHint,
      exclude: merged,
    });
    raw = await callGeminiForCards(topUpPrompt, { minCards: need, focus });
    merged = mergeDedupe(merged, normalizeAll(raw));
    rounds += 1;
  }

  if (merged.length < cardCount) {
    const preview =
      process.env.NODE_ENV === 'development'
        ? ` have=${merged.length} want=${cardCount} lastRawLen=${raw.length}`
        : '';
    throw new Error(`Could not generate enough distinct valid cards (${merged.length}/${cardCount}).${preview}`);
  }

  return assignIds(merged.slice(0, cardCount));
}
