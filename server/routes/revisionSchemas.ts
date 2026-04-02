import { z } from 'zod';

const dailyRitualCardDiscriminated = z.discriminatedUnion('type', [
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
    ruleSummaryEnglish: z.string().min(1),
    examples: z
      .array(
        z.object({
          french: z.string().min(1),
          english: z.string().min(1),
        })
      )
      .min(1)
      .max(2),
    commonPitfall: z.string().optional(),
    commonPitfallEnglish: z.string().optional(),
  }),
]);

/** Body validation for weak-card queue (matches API card shape including id) */
export const dailyRitualCardSchema = dailyRitualCardDiscriminated.superRefine((val, ctx) => {
  if (val.type !== 'grammar') return;
  if (val.commonPitfall?.trim() && !val.commonPitfallEnglish?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'commonPitfallEnglish is required when commonPitfall is set',
      path: ['commonPitfallEnglish'],
    });
  }
});
