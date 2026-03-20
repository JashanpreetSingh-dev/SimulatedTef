## MODIFIED Requirements

### Requirement: User can start a warm-up session
The system SHALL provide a `/warmup` route that shows a topic picker grid with all available topics grouped by difficulty, a streak counter, and a Start button that activates once a topic is selected. Level badges, calendar dots, and instructional explainers SHALL NOT be shown. The one-session-per-day gate is removed — the Start button SHALL NOT be disabled if the user has already practiced today.

#### Scenario: First-time user visits warmup
- **WHEN** a user visits `/warmup` for the first time (no warmupUserProfile exists)
- **THEN** the system SHALL create a default profile (level: A2) and show the topic picker grid

#### Scenario: Returning user visits warmup
- **WHEN** a user visits `/warmup` and has a warmupUserProfile
- **THEN** the system SHALL show their streak and the full topic library grid

#### Scenario: User has already completed a session today
- **WHEN** a user visits `/warmup` and has a completed session for today's date
- **THEN** the Start button SHALL remain enabled — the user MAY practice again

---

### Requirement: Server generates keyword chips for the user-selected topic
The system SHALL call the Gemini API to generate 4–5 keyword chips for the topic the user selected, using their level. Topic selection is no longer performed server-side.

#### Scenario: Config endpoint returns keywords for user-provided topic
- **WHEN** `GET /api/warmup/config` is called (or keywords are fetched at session start)
- **THEN** the system SHALL return `{ keywords[], userLevel, streak, systemPrompt }` — topic is NOT included in the server response as it is owned by the client

#### Scenario: Keyword generation fails
- **WHEN** the Gemini keyword generation call fails
- **THEN** the system SHALL fall back to a curated static keyword set of 4–5 keywords and not block session start

---

### Requirement: Session completion returns coach feedback and corrections
The system SHALL call `POST /api/warmup/session/complete` at session end and return simplified coach-style feedback and a corrections array synchronously.

#### Scenario: Feedback and corrections returned after session
- **WHEN** `/api/warmup/session/complete` is called with the transcript
- **THEN** the system SHALL return `{ streak, feedback: { wentWell, practiceTip, levelNote }, topicsCovered[], levelAtSession, corrections[] }` — feedback and corrections calls run in parallel

#### Scenario: Completion screen displays feedback and corrections
- **WHEN** the completion screen loads
- **THEN** the system SHALL display streak, the three feedback rows (wentWell, practiceTip, levelNote), and the corrections section (if non-empty) — with no score and no grade
