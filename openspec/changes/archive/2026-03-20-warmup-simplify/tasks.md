## 1. Dead Code Removal

- [x] 1.1 Delete `server/services/mem0Service.ts`
- [x] 1.2 Remove `mem0ai` from `package.json` dependencies and run `npm install`

## 2. Backend — Keyword Count

- [x] 2.1 Update `generateKeywords` prompt in `server/services/warmupService.ts` to request 4–5 keywords instead of 6–10

## 3. Frontend Services

- [x] 3.1 Remove `getHistory()` method from `services/warmupService.ts`

## 4. WarmupDashboard Simplification

- [x] 4.1 Remove `warmupService.getHistory()` call and `history` state
- [x] 4.2 Remove `last7Days` computed logic
- [x] 4.3 Remove level badge display
- [x] 4.4 Remove "How it works" explainer panel
- [x] 4.5 Remove 7-day calendar dots JSX

## 5. WarmupSession Simplification

- [x] 5.1 Change session duration constant from `8 * 60` to `5 * 60`
- [x] 5.2 Remove `aiTranscript` state and `setAiTranscript` calls
- [x] 5.3 Remove `isModelSpeaking` state (no longer needed without transcript display)
- [x] 5.4 Remove `outputTranscription` handler in `onmessage` (keep `inputTranscription` for transcript assembly)
- [x] 5.5 Remove AI transcript panel JSX from render

## 6. WarmupComplete Simplification

- [x] 6.1 Replace 3-card layout with a single coach message combining `wentWell` and `levelNote`
- [x] 6.2 Show `practiceTip` as a single "Pour demain →" line below the coach message
- [x] 6.3 Remove `topicsCovered` tags display
- [x] 6.4 Keep streak and duration pills

## 7. WarmupView Bug Fix

- [x] 7.1 Replace raw `fetch('/api/warmup/session/complete', ...)` with `warmupService.completeSession()` using `getToken` from `useAuth()`

## 8. Verification

- [x] 8.1 Dashboard loads with topic, 4–5 keywords, streak, and Start button only
- [x] 8.2 Session starts immediately on click (no intermediate preview), runs for 5 minutes
- [x] 8.3 No AI transcript panel visible during session; keyword chips and timer are shown
- [x] 8.4 Session completes and shows single coach message + one tip
- [x] 8.5 `completeSession` call succeeds with Bearer token (no CORS error)
- [x] 8.6 `mem0ai` no longer in `node_modules` after npm install
