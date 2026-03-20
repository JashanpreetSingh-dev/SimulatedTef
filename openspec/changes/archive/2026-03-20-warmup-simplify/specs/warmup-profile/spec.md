## REMOVED Requirements

### Requirement: mem0 integration for cross-session memory
**Reason**: The `mem0Service.ts` wrapper was never integrated into the warmup worker. The worker already handles all profile memory directly via Gemini analysis and MongoDB updates. The `mem0ai` package dependency is unused dead code.
**Migration**: Delete `server/services/mem0Service.ts`. Remove `mem0ai` from `package.json`. No behaviour changes — the MongoDB-backed profile system (`warmupUserProfiles` collection + BullMQ worker) continues to operate as before.

## MODIFIED Requirements

### Requirement: Session completion returns coach feedback immediately
The system SHALL call `POST /api/warmup/session/complete` at session end using authenticated fetch (Bearer token) and return simplified coach-style feedback synchronously.

#### Scenario: Feedback returned after session
- **WHEN** `/api/warmup/session/complete` is called with the transcript
- **THEN** the system SHALL return `{ streak, feedback: { wentWell, practiceTip, levelNote }, topicsCovered[], levelAtSession }` within one Gemini text call

#### Scenario: Feedback displayed as single coach message
- **WHEN** the completion screen loads
- **THEN** the system SHALL display streak, a combined coach message (wentWell + levelNote), and a single practice tip (practiceTip) — with no score, no grade, and no topicsCovered tags
