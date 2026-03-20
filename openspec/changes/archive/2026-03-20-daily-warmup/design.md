## Context

The app already has a full Gemini Live audio pipeline in `OralExpressionLive.tsx` (~1539 lines) that handles WebSocket sessions, AudioContext/AudioWorklet setup, VAD, real-time transcription, and MediaRecorder. The warm-up session component will fork and strip this pipeline — keeping the audio infrastructure, removing all exam logic (tasks, scoring, evaluation jobs, S3 upload).

The existing BullMQ/Redis infrastructure (used for evaluation and email jobs) will host the new `warmup-profile` queue. MongoDB is already the primary store; no new database or external memory service is needed.

## Goals / Non-Goals

**Goals:**
- Daily French speaking ritual: casual, coach-like, low-pressure
- Keyword chips shown before and during session (pre-generated, static per session)
- AI transcription shown live on screen; user transcription not shown
- Post-session coach card: encouraging feedback, streak, level estimate
- Evolving per-user profile in MongoDB (level, strengths, weaknesses)
- Background profile update so coach card appears instantly

**Non-Goals:**
- No user self-reported level — AI infers entirely from conversation
- No audio recording or S3 upload
- No evaluation score or grade
- No per-tier usage limits (deferred)
- No real-time keyword updates during session (keywords are pre-generated)

## Decisions

### 1. Reuse existing audio pipeline via forked component

**Decision**: `WarmupSession.tsx` copies the audio/WebSocket setup from `OralExpressionLive.tsx` and removes exam-specific logic.

**Why**: The pipeline is complex (~400 lines of audio code). Abstracting it into a shared hook risks breaking the existing exam flow. A clean fork is safer and keeps concerns separated.

**Alternative considered**: Extract shared audio hook. Rejected — too much refactor risk to a working, revenue-critical feature.

---

### 2. MongoDB-native user profile (no mem0 or vector store)

**Decision**: One `warmupUserProfile` document per user, updated by a background Gemini analysis after each session.

**Why**: The profile is structured (level, strengths[], weaknesses[], topicsExplored[]) and queried by userId — a perfect fit for MongoDB. mem0 adds an external dependency, API cost, and operational complexity for no meaningful benefit over a well-structured Mongo doc.

**Alternative considered**: mem0 API. Rejected — overkill, external dependency, graceful-degradation complexity.

---

### 3. Background job for profile update, synchronous for feedback

**Decision**: `POST /api/warmup/session/complete` makes one synchronous Gemini call for user-visible feedback (wentWell, practiceTip, levelNote), then enqueues a `warmup-profile` BullMQ job for the profile update.

**Why**: Feedback is user-facing and time-sensitive (user is staring at a loading state). Profile update is invisible to the user and only needed for the next session (tomorrow). Making the user wait for a second Gemini call they never see is wasteful. If the profile job fails, it can retry without affecting the delivered feedback.

**Alternative considered**: Single synchronous request with both calls. Rejected — unnecessary latency on the completion screen.

---

### 4. Keywords pre-generated at session start, static during session

**Decision**: When the user hits "Start", the backend generates topic + keywords via a fast Gemini text call and returns them. Keywords are shown in the pre-session preview and remain visible (fading as used) during the session. No real-time keyword updates.

**Why**: Real-time keyword updates during a live WebSocket audio session add significant complexity (a second WebSocket or polling channel). The pre-session preview moment ("here's what you'll talk about") is already excellent UX. Static keywords that stay on screen are a reliable reference, not a distraction.

**Alternative considered**: Live keyword updates mid-session. Deferred — could be a future enhancement.

---

### 5. Only AI transcription shown on screen

**Decision**: During the session, only Gemini's text output (AI speech) is shown in the transcript panel. User speech is not transcribed on screen.

**Why**: Seeing your own words transcribed in real-time while speaking is cognitively distracting and often inaccurate enough to be discouraging. The AI side acts as a conversation history the user can glance at. This also simplifies the component — no Web Speech API needed for display, only Gemini's `outputAudioTranscription` events needed for showing AI text.

---

### 6. Transcript built from Gemini events, not Web Speech API

**Decision**: Full conversation transcript (both sides) is built from Gemini's own transcription events (`inputAudioTranscription` for user speech, `outputAudioTranscription` for AI speech) and passed to `/session/complete`. Web Speech API is not used.

**Why**: Gemini's transcription is more accurate than the browser Web Speech API. Since we're not displaying user transcription live anyway, Web Speech API has no remaining purpose.

**Critical implementation note**: Both `inputAudioTranscription: {}` and `outputAudioTranscription: {}` are **commented out** in the existing `connectLive` function in `services/gemini.ts` (lines 428–429). The new `connectLiveWithPrompt` function **must** explicitly enable both in its Gemini config — this is not optional. Without them, no transcription events arrive and both the AI transcript display and the post-session analysis break entirely.

---

### 7. Daily config cached on the session document

**Decision**: `GET /api/warmup/config` checks if today's `warmupSession` already has `topic` and `keywords[]` stored. If yes, return them directly. If not, generate via Gemini, store on the session doc (upsert), and return.

**Why**: Without caching, every dashboard visit triggers a Gemini call and could return a different topic each time — wasteful and confusing UX. Storing config on the session document is the simplest cache with no additional infrastructure.

**Alternative considered**: Separate daily config cache in Redis. Rejected — unnecessary complexity; the session document is already the natural home for per-day state.

---

### 8. Date stored in user's local timezone, not server UTC

**Decision**: The client sends its local date (YYYY-MM-DD) on `POST /session/start`. The server trusts this value for the session's `date` field and streak computation.

**Why**: If the server derives the date from UTC, a user completing a session at 11pm local time (e.g. Vancouver = UTC-7) would have their session recorded as the next day in UTC — breaking their streak. The user's local date is the correct semantic unit for "did I practice today?"

**Alternative considered**: Store UTC and convert server-side using a stored timezone preference. Rejected — adds user preference complexity; client-sent date is simpler and correct for this use case.

---

### 9. Abandoned session cleanup on dashboard load

**Decision**: `GET /api/warmup/config` checks if today's session exists with `status: "active"` and was created more than 30 minutes ago. If so, it marks it `"abandoned"` and allows a fresh session to start.

**Why**: If a user closes the browser mid-session, the session doc stays `"active"` forever. Without cleanup, the next visit would show a broken state (active session that can't be resumed). 30 minutes is a safe threshold — longer than any warm-up session could run.

## Risks / Trade-offs

- **Risk**: Forked audio pipeline diverges from OralExpressionLive over time → **Mitigation**: Document the fork clearly; if audio pipeline needs major changes in future, extract shared hook at that point
- **Risk**: Profile update job fails silently, leaving stale level estimate → **Mitigation**: BullMQ retry policy (3 attempts); log failures; profile gracefully falls back to last known state
- **Risk**: Gemini text calls (keyword gen + feedback) add latency to session start and end → **Mitigation**: Config is cached per-day on session doc after first generation; feedback call is one fast text call (~1–2s acceptable on a post-session screen)
- **Risk**: warmupUserProfile not yet created on first session → **Mitigation**: `upsert: true` on profile write; default level A2 if no profile exists
- **Risk**: Client-sent date could be spoofed to manipulate streaks → **Mitigation**: Acceptable for a non-competitive feature; server validates date is within ±1 day of server UTC as a sanity check

## Migration Plan

- No database migration required — new collections (`warmupSessions`, `warmupUserProfiles`) are created on first write
- Add indexes on first deploy via `server/db/indexes.ts`
- Feature is additive — no existing routes or models modified except wiring (routes/index.ts, server.ts, DashboardLayout, ProtectedRoutes, Dashboard)
- Rollback: remove `/warmup` route from ProtectedRoutes and nav item from DashboardLayout — feature becomes unreachable without data loss

## Open Questions

- None blocking implementation. Usage limits (free vs. paid tier) deferred to a follow-up change.
