import { z } from 'zod';

/** Body validation for weak-card queue (matches API card shape including id) */
export const dailyRitualCardSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1),
    type: z.literal('vocab'),
    lemma: z.string().min(1),
    englishLine: z.string().min(1),
    contextSentence: z.string().min(1),
    explanation: z.string().min(1),
    registerNote: z.string().optional(),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal('grammar'),
    title: z.string().min(1),
    englishLine: z.string().min(1),
    ruleSummary: z.string().min(1),
    examples: z.array(z.string().min(1)).min(1),
    commonPitfall: z.string().optional(),
  }),
]);
