## 1. Topic Library — Data & Constants

- [x] 1.1 Create `constants/warmupTopics.ts` with `WARMUP_TOPICS` array (~30 topics, each with `id`, `label`, `difficulty: 'easy'|'medium'`, `theme`)
- [x] 1.2 Remove `selectTopic()` from `server/services/warmupService.ts`
- [x] 1.3 Update `buildSystemPrompt()` to accept topic as a plain string parameter (no change needed if it already does — verify)

## 2. Config Endpoint — Remove Server-Side Topic Selection

- [x] 2.1 Update `GET /api/warmup/config` to no longer call `selectTopic()` — remove topic from the response payload
- [x] 2.2 Update `generateKeywords()` call in the config route to accept topic from the request query param instead of server-selected topic
- [x] 2.3 Update frontend `warmupService.getConfig()` to accept `topicLabel` as a parameter and pass it to the config request

## 3. Session Start — Accept User-Selected Topic

- [x] 3.1 Update `POST /api/warmup/session/start` to accept `topicId` and `topicLabel` in the request body
- [x] 3.2 Remove the one-session-per-day idempotency check — `session/start` inserts a new document each time (no upsert on userId+date)
- [x] 3.3 Store `topicId` and `topicLabel` on the `WarmupSession` model/document

## 4. Corrections — Backend

- [x] 4.1 Add `corrections` field to `WarmupSession` model: `corrections?: { original: string; corrected: string; explanation: string }[]`
- [x] 4.2 Add `generateCorrections(userTranscript: string, level: string)` to `warmupService.ts` — Gemini call returning up to 3 correction objects; returns `[]` if transcript < 10 words
- [x] 4.3 Update `POST /api/warmup/session/complete` to run `generateCorrections` and `generateSessionFeedback` in parallel (`Promise.all`)
- [x] 4.4 Persist `corrections` array on the session document update
- [x] 4.5 Include `corrections` in the `/session/complete` response payload

## 5. Topic Picker UI — WarmupDashboard

- [x] 5.1 Replace the single topic card in `WarmupDashboard.tsx` with a two-section grid (Easy / Medium) rendering all `WARMUP_TOPICS`
- [x] 5.2 Add `selectedTopic` local state; clicking a topic card sets it and visually highlights it
- [x] 5.3 Disable the Start button when `selectedTopic` is null; enable when a topic is selected
- [x] 5.4 Pass `selectedTopic.label` to `warmupService.getConfig()` and `selectedTopic.id`/`label` to `warmupService.startSession()`
- [x] 5.5 Remove streak disable logic (Start button no longer disabled when session already completed today)

## 6. Corrections UI — WarmupComplete

- [x] 6.1 Add `corrections` prop to `WarmupComplete` component: `corrections: { original: string; corrected: string; explanation: string }[]`
- [x] 6.2 Render corrections section below feedback rows — each item shows original (muted/strikethrough), corrected (highlighted), and explanation text
- [x] 6.3 Hide the corrections section entirely when `corrections` is empty
- [x] 6.4 Update `WarmupView.tsx` to pass `corrections` from the session complete API response to `WarmupComplete`

## 7. i18n

- [x] 7.1 Add translation keys for corrections section heading and empty state to `LanguageContext.tsx` (FR + EN)
