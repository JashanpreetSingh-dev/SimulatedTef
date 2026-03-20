## ADDED Requirements

### Requirement: History tab in WarmupDashboard
`WarmupDashboard` SHALL have a third tab labelled "Historique" (FR) / "History" (EN) alongside the Easy and Medium difficulty tabs.

#### Scenario: Tab visible on warmup dashboard
- **WHEN** the user opens the warm-up dashboard
- **THEN** three tabs SHALL be visible: Easy, Medium, and Historique

#### Scenario: Switching to history tab
- **WHEN** the user taps the Historique tab
- **THEN** the topic list SHALL be replaced by the session history view

### Requirement: History loads lazily on first tab activation
Session history SHALL be fetched from `GET /api/warmup/history` only on the first time the Historique tab is activated. Subsequent tab switches SHALL NOT trigger a new fetch.

#### Scenario: First activation fetches history
- **WHEN** the user taps Historique for the first time
- **THEN** a loading state SHALL appear, then the session list SHALL render

#### Scenario: Subsequent activation uses cached data
- **WHEN** the user switches away from Historique and back
- **THEN** the history SHALL display immediately without a new network request

### Requirement: History rows show session summary
Each history row SHALL display: formatted date, user-selected topic label, level badge, and duration in minutes.

#### Scenario: Completed session row
- **WHEN** a completed session exists in history
- **THEN** its row SHALL show the date, topic label, levelAtSession badge, and rounded duration in minutes

#### Scenario: Empty history
- **WHEN** the user has no completed sessions
- **THEN** an empty state message SHALL be displayed ("Aucune séance pour l'instant" / "No sessions yet")
