## Why

The daily warm-up currently assigns a random topic from a list of 7 generic options, giving users no agency, and its feedback is limited to three short encouraging sentences with no concrete language corrections. TEF Canada candidates need to practice specific topics deliberately and understand exactly what they said wrong — not just receive general encouragement.

## What Changes

- Replace auto-selected "topic of the day" with a curated topic library (~30 topics, easy → medium difficulty) that the user browses and selects from
- Remove the one-session-per-day gate — users can practice any topic, any time
- Add a **corrections section** to the post-session results: 2–3 real sentences the user said, each rewritten with a short explanation of why the original was off
- Streak model is preserved — it tracks whether the user practiced today, independent of which topic they chose

## Capabilities

### New Capabilities

- `warmup-topic-library`: A curated static list of ~30 TEF-relevant topics organized by difficulty (easy/medium), displayed as a browsable picker on the warm-up dashboard
- `warmup-corrections`: Post-session analysis that extracts 2–3 sentences from the user's transcript and rewrites them with a concise grammatical or lexical explanation

### Modified Capabilities

- `warmup-session`: Session initiation now receives a user-selected topic instead of a server-assigned one — the config endpoint no longer auto-selects a topic
- `warmup-history`: Session history records now include the corrections array alongside existing feedback fields

## Impact

- `server/services/warmupService.ts` — `selectTopic()` removed; `getConfig` no longer picks a topic; new `generateCorrections()` method added
- `server/routes/warmup.ts` — config endpoint stops generating a topic; session completion endpoint stores corrections
- `server/models/WarmupSession.ts` — add `corrections` field to session model
- `components/warmup/WarmupDashboard.tsx` — replaced with topic picker grid UI
- `components/warmup/WarmupComplete.tsx` — corrections section added below existing feedback rows
- `services/warmupService.ts` (frontend) — topic no longer fetched from config; selected topic passed to session start
