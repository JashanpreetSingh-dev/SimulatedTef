## 1. Summary endpoint

- [x] 1.1 Add `GET /api/warmup/summary` route to `server/routes/warmup.ts` — calls `getOrCreateProfile()` and `computeStreak()`, returns `{ streak, levelEstimate }`
- [x] 1.2 Add `getSummary(getToken)` method to `services/warmupService.ts` (frontend)

## 2. Dashboard card data

- [x] 2.1 Add `loadWarmupSummary()` async function in `pages/Dashboard.tsx` — fetches `/api/warmup/summary` using the existing `authenticatedFetchJSON` pattern
- [x] 2.2 Add `warmupSummary` state in `Dashboard.tsx` and call `loadWarmupSummary()` in a `useEffect` on mount
- [x] 2.3 Pass `streak={warmupSummary?.streak}` and `levelEstimate={warmupSummary?.levelEstimate}` to `<WarmupCard />`

## 3. Translation keys

- [x] 3.1 Add `warmup.historyTab` key in `contexts/LanguageContext.tsx` — FR: "Historique", EN: "History"
- [x] 3.2 Add `warmup.noHistory` key — FR: "Aucune séance pour l'instant", EN: "No sessions yet"
- [x] 3.3 Add `warmup.historyDuration` key — FR: "{count} min", EN: "{count} min"

## 4. History tab in WarmupDashboard

- [x] 4.1 Add `'history'` to the `activeTab` type union in `components/warmup/WarmupDashboard.tsx`
- [x] 4.2 Add history state: `sessions: null | HistorySession[]` and `historyLoading: boolean` and `hasFetchedHistory: useRef(false)`
- [x] 4.3 Add `HistorySession` interface matching the `/api/warmup/history` response shape: `{ date, status, durationSeconds, topic, topicsCovered, levelAtSession, streak }`
- [x] 4.4 Add `loadHistory()` function — fetches `warmupService.getHistory(getToken)`, sets `sessions` state; called when tab switches to `'history'` for the first time
- [x] 4.5 Add the Historique tab button to the tab bar alongside Easy/Medium
- [x] 4.6 Render history content when `activeTab === 'history'`: loading skeleton, empty state, or list of session rows
- [x] 4.7 Each session row: formatted date (e.g. "18 mar."), topic label (`session.topic`), level badge (`session.levelAtSession`), duration in minutes — styled consistently with the existing list rows
- [x] 4.8 Add `getHistory(getToken)` method to `services/warmupService.ts` (frontend) — `GET /api/warmup/history`
