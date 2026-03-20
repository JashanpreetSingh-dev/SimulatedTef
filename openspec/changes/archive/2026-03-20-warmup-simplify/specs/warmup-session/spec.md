## MODIFIED Requirements

### Requirement: Session has a configurable timer (5 minutes)
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

### Requirement: System generates topic and keyword chips before session starts
The system SHALL call the Gemini API when the user requests session config to generate a topic and 4–5 keyword chips relevant to that topic and the user's level.

#### Scenario: Keyword generation succeeds
- **WHEN** `GET /api/warmup/config` is called
- **THEN** the system SHALL return `{ topic, keywords[], userLevel, streak, systemPrompt }` with 4–5 keywords

#### Scenario: Keyword generation fails
- **WHEN** the Gemini keyword generation call fails
- **THEN** the system SHALL fall back to a curated static keyword set of 4–5 keywords and not block session start

### Requirement: Dashboard shows topic and keywords only — no level badge or calendar
The system SHALL show a simplified pre-session dashboard with today's topic, 4–5 keyword chips, the current streak, and a Start button. Level badges, calendar dots, and instructional explainers SHALL NOT be shown.

#### Scenario: Dashboard loads for any user
- **WHEN** a user visits `/warmup`
- **THEN** the system SHALL display today's topic, keyword chips, streak counter, and Start button only

#### Scenario: Completed session disables Start
- **WHEN** a user visits `/warmup` and has already completed today's session
- **THEN** the Start button SHALL be disabled

## REMOVED Requirements

### Requirement: Live session displays AI transcription and keyword chips
**Reason**: Displaying AI text while the user speaks creates distraction and cognitive load during a speaking warm-up. The transcript is still collected in the background for post-session feedback; it is simply not rendered on screen.
**Migration**: Remove the AI transcript panel from `WarmupSession.tsx`. The `outputTranscription` events are still captured into `aiLinesRef` for transcript assembly — only the `setAiTranscript` state update and transcript panel JSX are removed.

### Requirement: User sees a pre-session preview before the mic opens
**Reason**: The topic is already visible on the dashboard before clicking Start. A separate preview step adds friction without value.
**Migration**: Clicking Start opens the mic directly. No intermediate preview screen.
