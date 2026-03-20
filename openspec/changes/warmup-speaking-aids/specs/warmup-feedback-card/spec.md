## ADDED Requirements

### Requirement: Feedback is displayed as scannable icon-led rows
The completion screen SHALL display feedback as three short icon-led rows instead of text paragraphs, so users can absorb it in under 5 seconds.

#### Scenario: Three feedback rows shown
- **WHEN** the completion screen loads with feedback
- **THEN** the system SHALL show three rows: wentWell (✅), practiceTip (💡), levelNote (📊)

#### Scenario: Each row is one sentence maximum
- **WHEN** feedback text is long
- **THEN** the system SHALL display only the first sentence of each field
