# Warmup Topic Phrases

## Overview
Each warm-up topic provides a static library of French sentence starters and verb constructions, authored at TEF Canada B1–B2 register. These phrases are served via the config endpoint and displayed in the session UI to help candidates begin speaking naturally.

## Requirements

### Requirement: Static phrase library per topic
Each warm-up topic SHALL have a `phrases` array of 5–7 French sentence starters and verb constructions, authored at TEF Canada B1–B2 register, stored statically in `constants/warmupTopics.ts`.

#### Scenario: All topics have phrases
- **WHEN** the `WARMUP_TOPICS` array is imported
- **THEN** every topic object SHALL have a non-empty `phrases` array with at least 5 entries

#### Scenario: Phrases are actionable sentence starters
- **WHEN** a phrase is shown to the candidate
- **THEN** it SHALL be a complete or near-complete French sentence (not a single word or noun fragment)

### Requirement: Config endpoint returns static phrases
The `/api/warmup/config` endpoint SHALL return a `phrases` field populated from the static topic phrase library, identified by `topicId` query parameter. It SHALL NOT call Gemini to generate keywords.

#### Scenario: Valid topicId returns phrases
- **WHEN** the config endpoint receives a known `topicId`
- **THEN** the response SHALL include `phrases: string[]` with the pre-written phrases for that topic

#### Scenario: Unknown topicId returns empty phrases
- **WHEN** the config endpoint receives an unknown or missing `topicId`
- **THEN** the response SHALL include `phrases: []` and SHALL NOT error

### Requirement: Session UI displays phrases as vertical list
During a warm-up session, the `WarmupSession` component SHALL display phrases in a vertically scrollable list, replacing the horizontal chip layout.

#### Scenario: Phrases visible during session
- **WHEN** the session screen is rendered with a non-empty `phrases` array
- **THEN** each phrase SHALL appear on its own row in a scrollable container

#### Scenario: No phrases — section hidden
- **WHEN** `phrases` is empty or undefined
- **THEN** the phrase list section SHALL NOT render
