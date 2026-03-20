## Context

`Dashboard.tsx` follows a consistent pattern: `useEffect → fetch → setState → pass as props`. `WarmupCard` already accepts `streak` and `levelEstimate` props but they're never passed — the component falls back to 0 / A2. The `GET /api/warmup/history` endpoint exists and returns per-session data but is never called from the frontend.

`WarmupDashboard` has an `activeTab: 'easy' | 'medium'` state and renders a tab bar — adding `'history'` is a natural extension.

## Goals / Non-Goals

**Goals:**
- WarmupCard shows real streak and level on every dashboard visit
- Users can review past sessions in a third tab without leaving the warm-up flow
- History loads lazily (only on first tab click, not on dashboard mount)

**Non-Goals:**
- Pagination of history (last 30 sessions is enough for now)
- Corrections review in history (post-session screen is the right place for that)
- Push notifications or streak reminders

## Decisions

### 1. New `/api/warmup/summary` endpoint rather than reusing `/history`

**Decision:** Add a dedicated `GET /api/warmup/summary` returning `{ streak, levelEstimate }`.

**Rationale:** The dashboard card needs exactly two fields. Calling `/history` for 30 sessions on every dashboard load to extract the first row's level is wasteful. A summary endpoint is a single lightweight DB read (`getOrCreateProfile` + `computeStreak`), both already implemented in `warmupService.ts`.

**Alternative:** Enrich the existing `/history` response to include `levelEstimate`. Rejected — mixes concerns and adds overhead to the history call.

### 2. Dashboard fetches summary unconditionally on mount

**Decision:** Add `loadWarmupSummary()` in `Dashboard.tsx` with no guard condition (unlike `loadBatch` which only runs for B2B students).

**Rationale:** The warm-up feature is available to all user types. The endpoint is cheap. Matching the existing `loadSubscription` / `loadBatch` pattern keeps the component consistent.

### 3. History fetched lazily inside WarmupDashboard, not in WarmupView

**Decision:** `WarmupDashboard` calls `warmupService.getHistory(getToken)` on first `'history'` tab activation, caching the result in local state. `WarmupView` doesn't need to know about it.

**Rationale:** `WarmupDashboard` already has `useAuth()`. Keeping the fetch inside the component that needs it avoids prop drilling and doesn't load history data when the user goes straight to a session. A `hasFetchedRef` prevents re-fetching on tab switches.

### 4. History rows show stored topic label, not AI-derived topicsCovered

**Decision:** Each row shows `session.topic` (the label the user selected, e.g. "Mon logement"), not `session.topicsCovered` (AI-extracted themes).

**Rationale:** The user-selected label is deterministic and recognizable. `topicsCovered` is an array of AI-generated strings that may be empty or imprecise.

## Risks / Trade-offs

- **Summary endpoint cold start** — `getOrCreateProfile` creates a profile document on first call if none exists. On dashboard load for a brand-new user this triggers a write. Acceptable — it's idempotent and small.
- **History tab empty state** — new users will see the history tab immediately with an empty state. This is fine; the empty state message guides them toward their first session.
- **Level displayed on card may lag** — `levelEstimate` in the profile is updated by the background BullMQ job after session completion, not in real-time. The card may show yesterday's level until the job runs. Acceptable for now.
