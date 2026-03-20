## Requirements

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

### Requirement: Live session shows keyword chips only — no AI transcript
During the active session, the system SHALL show keyword chips for reference and a mic indicator. The AI's spoken words SHALL NOT be transcribed on screen. Both sides of the conversation are collected in the background for post-session analysis.

#### Scenario: Keyword chips during session
- **WHEN** the session is active
- **THEN** keyword chips SHALL remain visible on screen as a reference panel throughout the session

#### Scenario: Transcription collected silently
- **WHEN** the session ends
- **THEN** the system SHALL have a complete interleaved transcript of both user and AI turns for post-session feedback

---

### Requirement: Session has a fixed 5-minute timer
The system SHALL run the session for a fixed duration of 5 minutes with a visible countdown. The AI SHALL be notified 60 seconds before the end to wrap up naturally.

#### Scenario: Timer countdown visible
- **WHEN** the session is active
- **THEN** the system SHALL display remaining time as a countdown timer

#### Scenario: One-minute warning sent to AI
- **WHEN** 60 seconds remain in the session
- **THEN** the system SHALL send an internal note to Gemini: "[Note interne: Il reste une minute, commence à conclure doucement.]"

#### Scenario: Session ends at timer expiry
- **WHEN** the countdown reaches zero
- **THEN** the system SHALL close the Gemini Live session and navigate to the completion screen

---

### Requirement: User can end the session early
The system SHALL allow the user to stop the session before the timer expires.

#### Scenario: User clicks Stop
- **WHEN** the user clicks the Stop button during an active session
- **THEN** the system SHALL close the Gemini Live session and proceed to session completion

---

### Requirement: Session completion returns coach feedback and corrections
The system SHALL call `POST /api/warmup/session/complete` at session end using authenticated fetch (Bearer token) and return simplified coach-style feedback and a corrections array synchronously.

#### Scenario: Feedback and corrections returned after session
- **WHEN** `/api/warmup/session/complete` is called with the transcript
- **THEN** the system SHALL return `{ streak, feedback: { wentWell, practiceTip, levelNote }, topicsCovered[], levelAtSession, corrections[] }` — feedback and corrections calls run in parallel

#### Scenario: Completion screen displays feedback and corrections
- **WHEN** the completion screen loads
- **THEN** the system SHALL display streak, the three feedback rows (wentWell, practiceTip, levelNote), and the corrections section (if non-empty) — with no score and no grade
