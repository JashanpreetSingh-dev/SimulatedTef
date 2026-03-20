## MODIFIED Requirements

### Requirement: System records one session document per completed warm-up
The system SHALL store a `warmupSession` document in MongoDB for each completed session. The userId + date uniqueness constraint is removed — multiple sessions per user per day are permitted.

#### Scenario: Session document created on start
- **WHEN** `POST /api/warmup/session/start` is called
- **THEN** the system SHALL insert a new warmupSession document with status: "active" for today's date (no longer idempotent — each call creates a new session document)

#### Scenario: Session document completed with corrections
- **WHEN** `POST /api/warmup/session/complete` is called
- **THEN** the system SHALL update the session document with status: "completed", durationSeconds, topicsCovered[], levelAtSession, feedback `{ wentWell, practiceTip, levelNote }`, and `corrections[]`
