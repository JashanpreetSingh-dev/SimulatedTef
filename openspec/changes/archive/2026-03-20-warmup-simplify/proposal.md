## Why

The daily warm-up feature was built with too much information density — a pre-session dashboard crowded with level badges, 7-day calendars, and explainers, an 8-minute session with a live AI transcript panel, and a post-session screen with three separate feedback cards. For a user sitting down intentionally to practice French, this creates friction and cognitive load at every step. The feature needs to be stripped back to its core value: speak French for a few minutes, get one useful insight, and feel good about it.

## What Changes

- **Remove** the level badge from the dashboard (the profile system stays in the background)
- **Remove** the "How it works" explainer from the dashboard
- **Remove** the 7-day calendar dots from the dashboard
- **Remove** the live AI transcript panel from the session screen
- **Remove** `topicsCovered` tags from the completion screen
- **Remove** the separate `wentWell`, `practiceTip`, and `levelNote` feedback cards — replaced by a single coach message + one tip
- **Change** session duration from 8 minutes to 5 minutes
- **Change** keyword count from 6–10 down to 4–5 (update Gemini prompt)
- **Remove** `mem0Service.ts` and `mem0ai` dependency (dead code — never integrated into the worker)
- **Fix** `WarmupView.tsx` using raw `fetch` with `credentials: 'include'` for `completeSession` — should use `warmupService.completeSession()` with Bearer token auth

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `warmup-session`: Session duration changes from 8 to 5 minutes; live AI transcript display removed; keywords reduced to 4–5
- `warmup-profile`: `mem0` integration removed; profile memory is purely MongoDB-backed (no behaviour change, just removes dead dependency)
- `warmup-history`: History endpoint and `getHistory()` frontend call removed from the warm-up dashboard flow (calendar dots cut); endpoint may remain but is no longer called on page load

## Impact

- `components/warmup/WarmupSession.tsx` — remove transcript state, outputTranscription handler, transcript panel JSX; roughly half the component
- `components/warmup/WarmupDashboard.tsx` — remove history fetch, calendar logic, level badge, explainer; one API call on load instead of two
- `components/warmup/WarmupComplete.tsx` — replace 3-card layout with single coach message + tip
- `pages/WarmupView.tsx` — fix raw `fetch` → `warmupService.completeSession()`
- `server/services/mem0Service.ts` — deleted
- `services/warmupService.ts` — remove `getHistory()` frontend method
- `server/services/warmupService.ts` — update `generateKeywords` prompt (4–5 keywords)
- `package.json` — remove `mem0ai` dependency
