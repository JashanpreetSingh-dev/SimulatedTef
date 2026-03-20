## Why

Users preparing for TEF Canada need daily French speaking practice, but the existing Expression Orale sections are exam-focused and high-pressure. A lightweight, coach-like daily warm-up ritual will build speaking habits without the anxiety of formal evaluation.

## What Changes

- New `/warmup` route and page accessible from the dashboard and nav
- Pre-session screen showing AI-generated keyword chips for the day's topic before the mic opens
- Live session using Gemini Live (reusing the existing audio pipeline) — AI transcription displayed on screen, keyword chips visible throughout
- Post-session coach card: encouraging feedback, streak counter, level estimate — no scores
- One global user profile document in MongoDB per user that evolves over sessions (level estimate, strengths, weaknesses, topics explored)
- Per-session history records (for streak, calendar view, past feedback)
- Background BullMQ job to update user profile after each session (uses existing warmup-profile queue on existing Redis/BullMQ infrastructure)

## Capabilities

### New Capabilities

- `warmup-session`: Live French conversation warm-up session — topic selection, keyword generation, Gemini Live audio, AI transcript display, session completion
- `warmup-profile`: Per-user evolving memory profile — level estimate, strengths, weaknesses, topics explored; updated via background job after each session
- `warmup-history`: Per-session records — streak tracking, calendar view, past feedback

### Modified Capabilities

<!-- None — no existing spec-level requirements are changing -->

## Impact

- **New frontend**: `pages/WarmupView.tsx`, `components/warmup/` (WarmupDashboard, WarmupSession, WarmupComplete), `components/dashboard/WarmupCard.tsx`
- **Modified frontend**: `routes/ProtectedRoutes.tsx`, `layouts/DashboardLayout.tsx`, `pages/Dashboard.tsx`
- **New backend**: `server/models/WarmupSession.ts`, `server/models/WarmupUserProfile.ts`, `server/services/warmupService.ts`, `server/routes/warmup.ts`, `server/jobs/warmupQueue.ts`, `server/workers/warmupWorker.ts`
- **Modified backend**: `server/routes/index.ts`, `server/server.ts`, `server/db/indexes.ts`, `server/jobs/jobTypes.ts`
- **Modified frontend services**: `services/gemini.ts` (expose `connectLiveWithPrompt`), new `services/warmupService.ts`, `services/prompts/warmup.ts`
- **No new dependencies** — uses existing Gemini, BullMQ, Redis, MongoDB, Clerk
