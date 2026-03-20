## ADDED Requirements

### Requirement: Post-session corrections are generated from the user's transcript
After a session ends, the system SHALL run a second Gemini call on the user's transcript to extract 2–3 sentences the user said and rewrite each with a concise grammatical or lexical explanation.

#### Scenario: Corrections generated when user spoke
- **WHEN** `POST /api/warmup/session/complete` is called with a non-empty user transcript (≥10 words)
- **THEN** the system SHALL return a `corrections` array of up to 3 objects: `{ original: string, corrected: string, explanation: string }`

#### Scenario: No corrections when transcript too short
- **WHEN** the user's transcript contains fewer than 10 words total
- **THEN** the system SHALL return `corrections: []` and SHALL NOT make a Gemini call for corrections

#### Scenario: Corrections call runs in parallel with feedback
- **WHEN** session completion is triggered
- **THEN** the corrections Gemini call and the feedback Gemini call SHALL run concurrently, not sequentially

#### Scenario: Corrections call failure does not block feedback
- **WHEN** the corrections Gemini call fails or times out
- **THEN** the system SHALL return `corrections: []` and still return the feedback fields normally

---

### Requirement: Corrections are displayed on the completion screen
The completion screen SHALL show a corrections section below the existing feedback rows, containing each original sentence alongside its rewrite and explanation.

#### Scenario: Corrections section shown when corrections exist
- **WHEN** the completion screen loads with a non-empty corrections array
- **THEN** the system SHALL render each correction as: original sentence (struck through or muted) → corrected sentence → short explanation

#### Scenario: Corrections section hidden when empty
- **WHEN** the corrections array is empty
- **THEN** the corrections section SHALL NOT be rendered

---

### Requirement: Corrections are persisted on the session document
The system SHALL store the corrections array on the `WarmupSession` MongoDB document alongside existing feedback fields.

#### Scenario: Corrections saved on completion
- **WHEN** `POST /api/warmup/session/complete` succeeds
- **THEN** the session document SHALL be updated with `corrections: Correction[]` where each item has `original`, `corrected`, and `explanation` fields
