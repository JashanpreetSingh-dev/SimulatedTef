## Context

The warm-up feature currently has a server-driven topic selection model: `getConfig` calls `selectTopic()` which picks from 7 hardcoded topics avoiding recent ones, then calls Gemini to generate keywords. The session model has no corrections field. The dashboard component shows the server-assigned topic with no user choice.

The change moves topic ownership to the client (static curated list), adds a post-session Gemini call for corrections, and extends the session model to persist them.

## Goals / Non-Goals

**Goals:**
- User selects topic from a static curated list before starting a session
- Post-session corrections: 2–3 real user sentences rewritten with explanation
- Corrections stored on the session document and displayed on the completion screen
- Streak logic unchanged — daily practice still tracked regardless of topic chosen

**Non-Goals:**
- Per-topic progress tracking / stats (future)
- Personalized topic recommendations based on history (future)
- Real-time in-session corrections (out of scope — after only)
- Scoring or grading of any kind

## Decisions

**Topic list lives on the client as a static constant, not the database or server.**

The list changes rarely and needs no personalization at this stage. Putting it in a `WARMUP_TOPICS` constant in the frontend avoids a round-trip and a maintenance surface. The server `selectTopic()` function is removed; the config endpoint no longer returns a topic. The client sends `topicId` and `topicLabel` when starting a session.

*Alternative considered*: Server-side topic list with a `/warmup/topics` endpoint. Rejected — adds API surface and latency for no benefit at this stage.

---

**Topic structure: `{ id, label, difficulty, theme }`**

Each topic has:
- `id`: kebab-case slug (e.g., `se-presenter`, `logement-canada`)
- `label`: display string in French (e.g., "Se présenter")
- `difficulty`: `'easy'` | `'medium'`
- `theme`: grouping label (e.g., "Vie quotidienne", "Travail & Études")

Difficulty drives visual grouping in the picker — easy topics first, then medium. Theme is for display only (no filtering needed initially).

---

**Corrections generated as a separate post-session Gemini call.**

The existing `generateSessionFeedback()` already makes a Gemini call after the session. Corrections are a second call with the same transcript, asking specifically for sentence-level rewrites. Kept separate so the two concerns don't entangle and either can fail independently.

Prompt asks for a JSON array of `{ original, corrected, explanation }` objects, max 3 items, only if the user actually spoke (empty transcript → empty array, no Gemini call).

---

**Corrections stored on `WarmupSession` as `corrections: Correction[]`.**

Adds an optional field to the existing model. Non-breaking — old sessions simply have no corrections. The completion endpoint already updates the session document with feedback; corrections are added in the same update.

---

**`WarmupDashboard` becomes a topic picker grid.**

Replace the single topic card with a two-section grid (Easy / Medium). Each topic is a card — clicking it sets `selectedTopic` local state. A "Start" button appears once a topic is selected. The streak badge moves to the top of the page. Keywords are still generated server-side via the existing `generateKeywords()` call — they just use the user-selected topic label instead of a server-selected one.

## Risks / Trade-offs

**Corrections Gemini call adds ~2–3s to post-session latency.**
→ Run it in parallel with `generateSessionFeedback()` — both kick off at session end simultaneously. The completion screen skeleton already masks this.

**Empty or very short transcripts produce useless corrections.**
→ Guard: if user spoke fewer than 10 words total, skip the corrections call and return an empty array. Display nothing in that case rather than a placeholder.

**Static topic list gets stale.**
→ Acceptable for now. When topics need updating, it's a one-line code change. No database migration required.

**User picks a topic they've done many times — no variety nudge.**
→ Known limitation, acceptable at this stage. Per-topic history and recommendations are explicitly deferred to a future change.

## Migration Plan

No database migration required — `corrections` field is optional on `WarmupSession`. Old sessions read fine without it. Deploy is a standard release.

## Open Questions

- Should the topic picker remember the last-selected topic across page loads? (Nice-to-have — defer)
- How many topics exactly? Aiming for ~30 but the exact list should be reviewed before implementation.
