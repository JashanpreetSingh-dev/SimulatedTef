## 1. Data Layer

- [x] 1.1 Create `server/models/WarmupSession.ts` — fields: userId, date (YYYY-MM-DD, client-supplied), status ('active'|'completed'|'abandoned'), durationSeconds, topic, keywords[], topicsCovered[], levelAtSession, streak, feedback { wentWell, practiceTip, levelNote }, createdAt
- [x] 1.2 Create `server/models/WarmupUserProfile.ts` — fields: userId, levelEstimate, levelHistory[], strengths[], weaknesses[], topicsExplored[], totalSessions, lastSessionDate, updatedAt
- [x] 1.3 Add warmupSessions indexes to `server/db/indexes.ts` — unique { userId, date }, { userId, createdAt: -1 }, sparse { status }
- [x] 1.4 Add warmupUserProfiles index to `server/db/indexes.ts` — unique { userId }
- [x] 1.5 Add `WarmupMemoryJobData { userId, sessionId, transcript, feedback, currentProfile }` to `server/jobs/jobTypes.ts`

## 2. Backend Services

- [x] 2.1 Create `server/services/warmupService.ts` — `getOrCreateProfile(userId)`, `computeStreak(userId, localDate)`, `buildSystemPrompt(profile, topic, keywords)`, `selectTopic(profile)`, `generateKeywords(topic, level)` (Gemini text call), `markAbandonedIfStale(userId, localDate)` (marks active sessions older than 30 min as abandoned)
- [x] 2.2 Add `generateSessionFeedback(transcript, levelEstimate)` to warmupService — synchronous Gemini text call returning `{ wentWell, practiceTip, levelNote, topicsCovered[], levelAtSession }`

## 3. Queue & Worker

- [x] 3.1 Create `server/jobs/warmupQueue.ts` — BullMQ Queue `warmup-profile` (mirrors emailQueue.ts pattern)
- [x] 3.2 Create `server/workers/warmupWorker.ts` — processes WarmupMemoryJobData: Gemini call to produce profile delta → update warmupUserProfile doc; retry 3x with backoff
- [x] 3.3 Wire `startWarmupWorker()` / `stopWarmupWorker()` into `server/server.ts`

## 4. API Routes

- [x] 4.1 Create `server/routes/warmup.ts` with 4 routes:
  - `GET /config?localDate=YYYY-MM-DD` — call markAbandonedIfStale, getOrCreateProfile; if today's session already has topic+keywords return cached; else selectTopic+generateKeywords, store on session doc, buildSystemPrompt → return `{ systemPrompt, topic, keywords[], userLevel, streak }`
  - `POST /session/start` — body: `{ localDate }` — validate date within ±1 day of server UTC; upsert today's warmupSession (idempotent), return `{ sessionId }`
  - `POST /session/complete` — body: `{ sessionId, transcript, durationSeconds }` — mark session complete, call generateSessionFeedback, computeStreak, enqueue warmup-profile job → return `{ streak, feedback, topicsCovered[], levelAtSession }`
  - `GET /history` — last 30 sessions for userId, sorted by date desc
- [x] 4.2 Register warmupRouter at `/api/warmup` in `server/routes/index.ts`

## 5. Frontend Services & Prompt

- [x] 5.1 Create `services/prompts/warmup.ts` — `makeWarmupSystemPrompt({ level, strengths, weaknesses, topic, keywords, recentTopics })` — friendly tutor persona, not examiner; includes weakness coaching hint
- [x] 5.2 Create `services/warmupService.ts` — `getConfig()`, `startSession()`, `completeSession(sessionId, transcript, durationSeconds)`, `getHistory()`
- [x] 5.3 Add `connectLiveWithPrompt(callbacks, systemInstruction)` to `services/gemini.ts` — this is **required** (not optional): the existing `connectLive` hardcodes `makeExamInstructions` internally and cannot accept a custom prompt. The new function must explicitly enable `inputAudioTranscription: {}` and `outputAudioTranscription: {}` in the Gemini config — both are currently commented out in `connectLive` and are essential for the warm-up's transcript display and post-session analysis.

## 6. WarmupSession Component (Audio)

- [x] 6.1 Create `components/warmup/WarmupSession.tsx` — fork of OralExpressionLive audio pipeline with exam logic removed:
  - Props: `{ systemPrompt, keywords[], sessionId, onComplete(transcript, durationSeconds) }`
  - Uses `connectLiveWithPrompt` (not `connectLive`)
  - 8-minute countdown (configurable) with progress indicator
  - Sends 60s internal note to Gemini at 1 minute remaining
  - Collects `outputAudioTranscription` events → `aiLines[]` for on-screen display
  - Collects `inputAudioTranscription` events → `userLines[]` for post-session transcript (not displayed)
  - Builds interleaved transcript from both at session end
  - Displays AI lines only in transcript panel
  - Keyword chips panel (static, from props)
  - Stop button to end early

## 7. Warmup UI Components

-- [x] 7.1 Create `components/warmup/WarmupDashboard.tsx` — pre-session screen:
  - Shows level badge, streak counter, 7-day calendar dots
  - Fetches config from `GET /api/warmup/config?localDate=YYYY-MM-DD` on mount (derives localDate from `new Date().toLocaleDateString('en-CA')` in the browser)
  - Displays topic card and keyword chips
  - Start button (disabled if today's session already completed; shows loading state while config fetches)
-- [x] 7.2 Create `components/warmup/WarmupComplete.tsx` — post-session coach card:
  - Streak with flame emoji
  - wentWell, practiceTip, levelNote sections
  - Topics covered, duration
  - "See you tomorrow" CTA — no score, no grade
-- [x] 7.3 Create `components/dashboard/WarmupCard.tsx` — dashboard card linking to `/warmup`:
  - Shows current streak and level
  - Amber/orange color scheme

## 8. Page & Navigation Wiring

- [x] 8.1 Create `pages/WarmupView.tsx` — container managing `view: 'dashboard' | 'session' | 'complete'` state; passes config data between views
- [x] 8.2 Add `/warmup` route to `routes/ProtectedRoutes.tsx`
- [x] 8.3 Add Warm-Up nav item to `layouts/DashboardLayout.tsx` (amber active color)
- [x] 8.4 Add `<WarmupCard />` to `pages/Dashboard.tsx`

## 9. Verification

- [x] 9.1 `/warmup` loads WarmupDashboard with level "A2" and a topic for a new user
- [x] 9.2 Start session → Gemini Live connects, AI transcript appears, keyword chips visible, timer counts down
- [x] 9.3 60s internal note visible in DevTools WebSocket frames at 1 minute remaining
- [x] 9.4 Session ends → WarmupComplete shows streak, wentWell, practiceTip, levelNote
- [x] 9.5 `warmupSessions` doc in MongoDB has status: "completed" with feedback populated
- [x] 9.6 BullMQ `warmup-profile` queue has a job after session complete
- [x] 9.7 Worker runs → `warmupUserProfile` doc updated with new level/strengths/weaknesses
- [x] 9.8 Day 2: streak = 2, profile memories visible in system prompt (check DevTools)
- [x] 9.9 Dashboard shows WarmupCard with streak and level
- [x] 9.10 7-day calendar dots reflect completed sessions correctly
- [x] 9.11 Simulate abandoned session: create active session > 30 min old → visit dashboard → session marked abandoned, Start button enabled
- [x] 9.12 Verify config is cached: visit dashboard twice → second visit returns same topic/keywords without a second Gemini call (check server logs)
- [x] 9.13 AI transcript appears on screen during session (confirms outputAudioTranscription is enabled in connectLiveWithPrompt)
