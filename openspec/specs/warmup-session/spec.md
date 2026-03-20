## ADDED Requirements

### Requirement: User can start a daily warm-up session
The system SHALL provide a `/warmup` route that shows a pre-session dashboard with today's topic, 4–5 keyword chips, streak counter, and a Start button. Level badges, calendar dots, and instructional explainers SHALL NOT be shown.

#### Scenario: First-time user visits warmup
- **WHEN** a user visits `/warmup` for the first time (no warmupUserProfile exists)
- **THEN** the system SHALL create a default profile (level: A2) and show the dashboard with a topic and keywords

#### Scenario: Returning user visits warmup
- **WHEN** a user visits `/warmup` and has a warmupUserProfile
- **THEN** the system SHALL show their streak and a topic not recently covered

#### Scenario: User has already completed today's session
- **WHEN** a user visits `/warmup` and has a completed session for today's date
- **THEN** the system SHALL disable the Start button

---

### Requirement: System generates topic and keyword chips before session starts
The system SHALL call the Gemini API when the user requests session config to generate a topic and 4–5 keyword chips relevant to that topic and the user's level.

#### Scenario: Keyword generation succeeds
- **WHEN** `GET /api/warmup/config` is called
- **THEN** the system SHALL return `{ topic, keywords[], userLevel, streak, systemPrompt }` with 4–5 keywords

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

### Requirement: Session completion returns coach feedback immediately
The system SHALL call `POST /api/warmup/session/complete` at session end using authenticated fetch (Bearer token) and return simplified coach-style feedback synchronously.

#### Scenario: Feedback returned after session
- **WHEN** `/api/warmup/session/complete` is called with the transcript
- **THEN** the system SHALL return `{ streak, feedback: { wentWell, practiceTip, levelNote }, topicsCovered[], levelAtSession }` within one Gemini text call

#### Scenario: Feedback displayed as single coach message
- **WHEN** the completion screen loads
- **THEN** the system SHALL display streak, a combined coach message (wentWell + levelNote), and a single practice tip (practiceTip) — with no score, no grade, and no topicsCovered tags
