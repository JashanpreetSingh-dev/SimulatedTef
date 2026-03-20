## ADDED Requirements

### Requirement: User can start a daily warm-up session
The system SHALL provide a `/warmup` route that shows a pre-session dashboard with today's topic, keyword chips, streak counter, and a Start button.

#### Scenario: First-time user visits warmup
- **WHEN** a user visits `/warmup` for the first time (no warmupUserProfile exists)
- **THEN** the system SHALL create a default profile (level: A2) and show the dashboard with a topic and keywords

#### Scenario: Returning user visits warmup
- **WHEN** a user visits `/warmup` and has a warmupUserProfile
- **THEN** the system SHALL show their current level, streak, and a topic not recently covered

#### Scenario: User has already completed today's session
- **WHEN** a user visits `/warmup` and has a completed session for today's date
- **THEN** the system SHALL show the completed state with today's feedback and streak, and disable the Start button

---

### Requirement: System generates topic and keyword chips before session starts
The system SHALL call the Gemini API when the user requests session config to generate a topic and 6–10 keyword chips relevant to that topic and the user's level.

#### Scenario: Keyword generation succeeds
- **WHEN** `GET /api/warmup/config` is called
- **THEN** the system SHALL return `{ topic, keywords[], userLevel, streak, systemPrompt }`

#### Scenario: Keyword generation fails
- **WHEN** the Gemini keyword generation call fails
- **THEN** the system SHALL fall back to a curated static keyword set for the topic and not block session start

---

### Requirement: User sees a pre-session preview before the mic opens
The system SHALL display a preview screen showing the topic and keyword chips before the Gemini Live session connects.

#### Scenario: Preview screen shown
- **WHEN** the user clicks Start
- **THEN** the system SHALL show the topic and keyword chips for 3–5 seconds (or until user confirms) before opening the microphone

---

### Requirement: Live session displays AI transcription and keyword chips
During the active session, the system SHALL display the AI's spoken words as text and show the keyword chips for reference. User speech SHALL NOT be transcribed on screen.

#### Scenario: AI speaks during session
- **WHEN** Gemini returns model text output during the live session
- **THEN** the system SHALL append that text to the on-screen transcript panel

#### Scenario: User speaks during session
- **WHEN** the user speaks
- **THEN** the system SHALL NOT display the user's words on screen (audio is sent to Gemini but not shown)

#### Scenario: Keyword chips during session
- **WHEN** the session is active
- **THEN** keyword chips SHALL remain visible on screen as a reference panel throughout the session

---

### Requirement: Session has a configurable timer (5–10 minutes)
The system SHALL run the session for a fixed duration (default 8 minutes) with a visible countdown. The AI SHALL be notified 60 seconds before the end to wrap up naturally.

#### Scenario: Timer countdown visible
- **WHEN** the session is active
- **THEN** the system SHALL display remaining time as a progress indicator

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

### Requirement: System builds a full conversation transcript from Gemini events
The system SHALL collect both sides of the conversation using Gemini's transcription events (inputTranscription for user audio, model text output for AI) to build a transcript for post-session analysis.

#### Scenario: Transcript built during session
- **WHEN** the session ends (timer or user stop)
- **THEN** the system SHALL have a complete interleaved transcript of both user and AI turns

---

### Requirement: Session completion returns coach feedback immediately
The system SHALL call `POST /api/warmup/session/complete` at session end and return coach-style feedback synchronously.

#### Scenario: Feedback returned after session
- **WHEN** `/api/warmup/session/complete` is called with the transcript
- **THEN** the system SHALL return `{ streak, feedback: { wentWell, practiceTip, levelNote }, topicsCovered[], levelAtSession }` within one Gemini text call

#### Scenario: Feedback displayed on coach card
- **WHEN** the completion screen loads
- **THEN** the system SHALL display streak, wentWell, practiceTip, levelNote, topics covered, and duration — with no score or grade
