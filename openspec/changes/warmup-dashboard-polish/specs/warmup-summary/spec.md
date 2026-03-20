## ADDED Requirements

### Requirement: Summary endpoint returns streak and level
The system SHALL expose `GET /api/warmup/summary` returning `{ streak: number, levelEstimate: string }` for the authenticated user. The endpoint SHALL NOT require any query parameters.

#### Scenario: Authenticated user with sessions
- **WHEN** an authenticated user calls `GET /api/warmup/summary`
- **THEN** the response SHALL include the user's current streak count and latest level estimate

#### Scenario: New user with no sessions
- **WHEN** a user with no warm-up history calls `GET /api/warmup/summary`
- **THEN** the response SHALL return `{ streak: 0, levelEstimate: "A2" }` without error

### Requirement: Dashboard card displays real user data
The `WarmupCard` on the dashboard SHALL display the user's actual streak and level estimate fetched on mount, not hardcoded defaults.

#### Scenario: Data loaded successfully
- **WHEN** the dashboard mounts and the summary fetch succeeds
- **THEN** `WarmupCard` SHALL show the real streak count and level estimate

#### Scenario: Fetch fails or loading
- **WHEN** the summary fetch is in progress or fails
- **THEN** `WarmupCard` SHALL render with fallback defaults (streak 0, level A2) without crashing
