## ADDED Requirements

### Requirement: Topic library is a static curated list of ~30 TEF-relevant topics
The system SHALL provide a static constant `WARMUP_TOPICS` (client-side) containing approximately 30 topics organized by difficulty (`easy` | `medium`) and theme. Each topic SHALL have an `id` (kebab-case), `label` (French display name), `difficulty`, and `theme`.

#### Scenario: Topics cover easy and medium difficulty
- **WHEN** the topic list is rendered
- **THEN** the system SHALL display topics grouped into two sections: Easy (A2–B1) and Medium (B1–B2)

#### Scenario: Topics are TEF Canada relevant
- **WHEN** a user browses the topic list
- **THEN** all topics SHALL be drawn from TEF Canada oral expression thematic areas (vie quotidienne, travail, environnement, logement au Canada, etc.)

---

### Requirement: User selects a topic before starting a session
The warm-up dashboard SHALL display the topic library as a browsable grid. The user SHALL select one topic before the Start button becomes active.

#### Scenario: Dashboard shows topic grid
- **WHEN** a user visits `/warmup`
- **THEN** the system SHALL display all topics as selectable cards grouped by difficulty, replacing the previous single "topic of the day" card

#### Scenario: Start button inactive until topic selected
- **WHEN** no topic is selected
- **THEN** the Start button SHALL be disabled

#### Scenario: Start button active after topic selected
- **WHEN** a user taps a topic card
- **THEN** that topic SHALL be visually highlighted as selected and the Start button SHALL become active

#### Scenario: Selected topic passed to session start
- **WHEN** the user clicks Start with a topic selected
- **THEN** the system SHALL pass the selected topic label and id to `POST /api/warmup/session/start` and use it for keyword generation and the system prompt

---

### Requirement: One-session-per-day gate is removed
The system SHALL allow users to practice any topic at any time, with no restriction on how many sessions they complete per day.

#### Scenario: User can start multiple sessions per day
- **WHEN** a user has already completed a session today
- **THEN** the Start button SHALL remain active (not disabled) and the user MAY start another session on the same or a different topic

#### Scenario: Streak tracks daily practice regardless of session count
- **WHEN** a user completes one or more sessions on a given day
- **THEN** that day counts as practiced for streak purposes (streak increments once per day, not once per session)
