## Requirements

### Requirement: System records one session document per completed warm-up
The system SHALL store a `warmupSession` document in MongoDB for each completed session. The userId + date uniqueness constraint is removed — multiple sessions per user per day are permitted.

#### Scenario: Session document created on start
- **WHEN** `POST /api/warmup/session/start` is called
- **THEN** the system SHALL insert a new warmupSession document with status: "active" for today's date (no longer idempotent — each call creates a new session document)

#### Scenario: Session document completed with corrections
- **WHEN** `POST /api/warmup/session/complete` is called
- **THEN** the system SHALL update the session document with status: "completed", durationSeconds, topicsCovered[], levelAtSession, feedback `{ wentWell, practiceTip, levelNote }`, and `corrections[]`

---

### Requirement: System computes and returns the user's current streak
The system SHALL compute the consecutive-day streak at session completion and return it in the `/session/complete` response.

#### Scenario: Streak increments on daily completion
- **WHEN** a user completes a session on a day following a day they also completed a session
- **THEN** the streak SHALL increment by 1

#### Scenario: Streak resets on missed day
- **WHEN** a user completes a session after missing one or more days
- **THEN** the streak SHALL reset to 1

#### Scenario: Streak shown on completion screen
- **WHEN** the coach card is displayed
- **THEN** the system SHALL show the current streak value (e.g. "Day 5 🔥")

---

### Requirement: User can view their session history
The system SHALL provide `GET /api/warmup/history` returning the last 30 session records for the authenticated user.

#### Scenario: History returned
- **WHEN** `GET /api/warmup/history` is called
- **THEN** the system SHALL return an array of `{ date, status, durationSeconds, topicsCovered[], levelAtSession, streak }` for the last 30 sessions, sorted by date descending

#### Scenario: Empty history
- **WHEN** a user has no session history
- **THEN** the system SHALL return an empty array (not an error)
