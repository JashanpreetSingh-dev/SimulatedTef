# AI Cost Tracking Exploration (Owner Dashboard)

Date: 2026-05-02
Author: Codex (with repository evidence)
Scope: Owner dashboard AI cost tracking, formulas, timeline, coverage, and recommendations.

## Executive Summary

The owner dashboard currently reports AI cost from three sources:

1. Live speaking conversations (`conversationLogs.metrics.totalCost`)
2. Oral evaluation jobs (`results.aiCost` where `module = oralExpression`)
3. Written evaluation jobs (`results.aiCost` where `module = writtenExpression`)

The "evaluation cost" tracking (saving `aiTokens` and `aiCost` on `Result`) started in commit:

- `6a5d948` on `2026-05-02 15:23:52 -0700`
- Message: `feat(owner): analytics dashboard - date range picker, user cost table, mobile responsive, oral eval cost fix`

Before that commit, conversation cost tracking existed, but per-evaluation `aiCost`/`aiTokens` did not.

---

## 1) Timeline: When Eval Cost Tracking Started

### Confirmed start point

- `git log -S "aiCost"` across:
  - `server/workers/evaluationWorker.ts`
  - `types.ts`
  - `server/routes/owner.ts`
- First matching commit: `6a5d948` (2026-05-02)

### What changed in that commit

- Added evaluation token capture + cost computation in `server/workers/evaluationWorker.ts`
- Added `aiCost` and `aiTokens` fields in `types.ts` (`SavedResult`)
- Added owner route aggregation using `results.aiCost` in `server/routes/owner.ts`
- Added owner dashboard UI and APIs

---

## 2) Current AI Cost Model (What is Included)

## 2.1 Live Speaking Cost (Conversation Logs)

Source:

- `server/services/conversationLogService.ts`
- Stored in `conversationLogs.metrics.totalCost`

Per-turn pricing logic (Gemini live model path):

- Input (audio): `promptTokenCount * 0.000003` (=$3.00 / 1M tokens)
- Output (audio): `candidatesTokenCount * 0.000012` (=$12.00 / 1M tokens)
- Session total is cumulative sum across turns.

Notes:

- `promptTokenCount` is the full context billed each turn.
- Both token and cost counters are incremented in `metrics`.

## 2.2 Evaluation Job Cost (Oral + Written)

Source:

- `server/workers/evaluationWorker.ts`
- Stored on `results` documents as:
  - `aiTokens: { transcriptionPrompt, evalPrompt, completion }`
  - `aiCost: number`

Pricing logic in worker:

- Transcription audio input:
  - `transcriptionPromptTokens * 0.000001` (=$1.00 / 1M)
- Evaluation text input:
  - `evalPromptTokens * 0.00000030` (=$0.30 / 1M)
- Completion output:
  - `completionTokens * 0.00000250` (=$2.50 / 1M)

Total:

- `aiCost = transcriptionCost + evalInputCost + outputCost`

---

## 3) How Owner Dashboard Aggregates Cost

Primary aggregation route:

- `server/routes/owner.ts`

Three dashboard buckets:

1. `speaking`
   - Sum of `conversationLogs.metrics.totalCost`
2. `oralEval`
   - Sum of `results.aiCost` filtered by `module = oralExpression`
3. `writtenEval`
   - Sum of `results.aiCost` filtered by `module = writtenExpression`

Dashboard total:

- `total = speaking + oralEval + writtenEval`

This same split is used in:

- stats endpoints
- cost breakdown chart endpoints
- user cost table endpoint

---

## 4) What is NOT Included (Important)

Even though the dashboard is useful, it is not guaranteed to represent "all Gemini spend" yet.

Potentially untracked in owner totals:

- AI calls in other services not writing cost records into:
  - `conversationLogs.metrics.totalCost`, or
  - `results.aiCost`

Examples of AI usage paths found in repo:

- `server/services/assignmentService.ts` (AI-generated assignment title)
- `server/services/dailyRitualService.ts` (card generation)
- Other Gemini calls outside evaluation/live conversation paths

These currently appear outside the owner dashboard cost rollups unless explicitly instrumented.

---

## 5) Historical Data Caveat

For evaluations created before `6a5d948`:

- `results.aiCost` is missing
- Aggregations use `$ifNull: ['$aiCost', 0]`
- Therefore historical evaluation cost is under-reported

**Product decision:** Do **not** backfill historical evals. Pre-tracking rows stay at `$ifNull` cost `0`; dashboards remain forward-accurate only for eval cost from `6a5d948` onward.

---

## 6) Session health token aggregation (fixed)

Previously, `GET /api/owner/session-health` averaged tokens using non-canonical field names (`totalInputTokens` / `totalOutputTokens`). It now uses the same fields as `conversationLogService` and `recent-sessions`:

- `metrics.totalBilledPromptTokens`
- `metrics.totalCompletionTokens`

---

## 7) Recommended Next Improvements (Prioritized)

**Closed / decided**

- ~~Backfill historical eval costs~~ — **declined** (no backfill)
- ~~Fix session health token field mapping~~ — **done** (canonical `totalBilledPromptTokens` + `totalCompletionTokens`)

**Remaining (in suggested order)**

1. Add global AI spend events — track AI cost for non-dashboard paths (assignment titles, daily ritual, etc.)
2. Centralize price table/config — one pricing registry to prevent drift across services
3. Add reconciliation view — "tracked vs provider bill" per month
4. Add alerts — daily/weekly threshold alerts for spikes by feature

---

## 8) Practical Interpretation for Product/Operations

If leadership asks "What are we spending AI on?" today:

- The dashboard is accurate for:
  - live speaking sessions
  - evaluation jobs after 2026-05-02
- The dashboard is incomplete for:
  - pre-2026-05-02 eval history
  - any Gemini usage path not wired into the tracked cost fields

So current numbers are best read as:

- "tracked AI cost in major learner flows"

not yet:

- "full platform AI bill"

---

## 9) Evidence Pointers

Key files:

- `server/services/conversationLogService.ts`
- `server/workers/evaluationWorker.ts`
- `server/routes/owner.ts`
- `types.ts`
- `docs/design/design-20260501-owner-dashboard.md`

Key commit:

- `6a5d948` (eval cost tracking introduction)

