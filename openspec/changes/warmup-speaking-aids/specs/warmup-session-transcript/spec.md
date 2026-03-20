## ADDED Requirements

### Requirement: AI speech is shown as text during active session
During an active warm-up session, the system SHALL display the AI's spoken words as text in a transcript panel so the user can follow along.

#### Scenario: AI transcript appears when AI speaks
- **WHEN** the AI produces speech during an active session
- **THEN** the system SHALL display the transcribed text in a panel below the keyword chips

#### Scenario: Transcript panel hidden when empty or session not active
- **WHEN** the session is idle or the AI has not yet spoken
- **THEN** the transcript panel SHALL NOT be shown

#### Scenario: Panel shows recent AI speech only
- **WHEN** the AI has spoken multiple turns
- **THEN** the panel SHALL show the most recent utterance (not the full history)
