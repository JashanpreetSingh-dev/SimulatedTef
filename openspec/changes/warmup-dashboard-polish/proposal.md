## Why

The WarmupCard on the dashboard always shows hardcoded defaults (streak 0, level A2) regardless of the user's actual progress, making it feel broken for returning users. Additionally, there is no way for users to review their past sessions — the history endpoint exists but is never surfaced in the UI.

## What Changes

- Add `GET /api/warmup/summary` endpoint returning `{ streak, levelEstimate }` for the authenticated user
- Fetch warmup summary in `Dashboard.tsx` on mount (following the existing `loadBatch` / `loadSubscription` pattern) and pass real data to `WarmupCard`
- Add a third **Historique** tab to `WarmupDashboard` alongside Easy and Medium
- History tab fetches `GET /api/warmup/history` lazily on first click and displays past sessions (date, topic label, level badge, duration)
- Add FR/EN translation keys for the history tab and empty state
- History rows show the user-selected topic label (stored on session) rather than AI-derived `topicsCovered`

## Capabilities

### New Capabilities
- `warmup-summary`: A lightweight summary endpoint and dashboard card data-loading — gives the card real streak and level data
- `warmup-history-ui`: Session history tab inside WarmupDashboard — lets users review past sessions without leaving the warm-up flow

### Modified Capabilities

(none)

## Impact

- `server/routes/warmup.ts`: New `GET /api/warmup/summary` route
- `pages/Dashboard.tsx`: Add `loadWarmupSummary()` effect, pass props to `WarmupCard`
- `components/dashboard/WarmupCard.tsx`: Already accepts `streak` and `levelEstimate` props — no interface change needed
- `services/warmupService.ts` (frontend): Add `getSummary()` method
- `components/warmup/WarmupDashboard.tsx`: Add `'history'` to `activeTab` type, history tab UI with lazy fetch
- `contexts/LanguageContext.tsx`: New keys `warmup.historyTab`, `warmup.noHistory`, `warmup.historyDuration`
