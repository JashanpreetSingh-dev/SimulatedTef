## Context

The daily warm-up feature (`feat/daily-convo`) was implemented with a profile memory system (MongoDB), BullMQ background jobs, and a 3-screen UI flow (dashboard → session → complete). The feature works but carries unnecessary complexity: a dead `mem0Service.ts` file that was never wired into the worker, a frontend history fetch that only served calendar dots we're removing, an 8-minute session with a live transcript panel the user doesn't need while speaking, and a post-session screen with three separate feedback cards.

The worker (Gemini → MongoDB profile delta) is solid and stays untouched. All simplification is in the UI layer and dead code removal.

## Goals / Non-Goals

**Goals:**
- Strip the dashboard to: topic, 4–5 keywords, streak, start button
- Remove live AI transcript from session; keep keyword chips + timer + mic indicator
- Collapse post-session feedback into one coach message + one tip
- Fix the `completeSession` CORS bug in `WarmupView.tsx` (raw fetch → service call)
- Delete `mem0Service.ts` and `mem0ai` dependency
- Reduce session duration to 5 minutes

**Non-Goals:**
- Changing the BullMQ worker or MongoDB profile update logic
- Redesigning the profile/level system
- Adding new features (onboarding, notifications, etc.)
- Changing backend API contracts (routes stay the same)

## Decisions

**1. Remove live AI transcript entirely (not toggle/hide)**
The transcript was meant to show the AI is "listening," but during a speaking warm-up it pulls the user's attention to reading. Removing it entirely is cleaner than making it optional — option fatigue is its own form of density. The `outputTranscription` events are still collected into `aiLinesRef` for post-session feedback (the backend still gets the full transcript); they're just not rendered.

**2. Keep the BullMQ worker as-is**
The profile update job (Gemini call → MongoDB delta) is correct, well-structured, and invisible to the user. It's not part of the UX problem. No changes needed.

**3. Single coach message on completion, not separate feedback fields**
Three cards (`wentWell`, `practiceTip`, `levelNote`) came from how the backend structures feedback. Rather than changing the backend response shape, the frontend will render these as a flowing coach message by combining `wentWell` and `levelNote` into one paragraph, and showing `practiceTip` separately as "Pour demain →". No backend change required.

**4. Remove `getHistory()` call from dashboard load**
The history endpoint was only used for calendar dots. Removing the calendar dots means `WarmupDashboard` now makes one API call (`getConfig`) instead of two. The `/api/warmup/history` route stays on the server — it may be useful later.

**5. Delete `mem0Service.ts` outright**
The file exists but nothing imports it. The worker never called it. `mem0ai` was installed as a dependency but serves no purpose. Safe to delete with no migration needed.

## Risks / Trade-offs

- **Removing AI transcript reduces "proof of life"** — Users won't see text appearing, so the session feels more like talking into a void. The mic animation and keyword chips need to clearly signal the session is active. → Mitigation: ensure the mic indicator is visually prominent when recording.

- **5-minute cap may feel abrupt for engaged users** — Some users may want to go longer once they're in flow. → Accepted trade-off for now; a future "extend" button could be added. Not in scope here.

- **Feedback collapse loses granularity** — Combining three fields into one coach message loses some structure. → The backend still stores all three fields; only the display changes. No data is lost.

## Migration Plan

No data migrations required. All changes are frontend code + dead code removal. Deploy is a standard frontend build. The `/api/warmup/history` endpoint remains available if needed later.
