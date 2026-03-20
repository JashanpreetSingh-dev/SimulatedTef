## ADDED Requirements

### Requirement: System maintains one evolving profile document per user
The system SHALL store a single `warmupUserProfile` document per user in MongoDB containing their inferred French level, strengths, weaknesses, and topics explored. This document is the persistent memory the AI reads each session.

#### Scenario: Profile created on first session
- **WHEN** a user completes their first warm-up session and no profile exists
- **THEN** the system SHALL create a warmupUserProfile with levelEstimate: "A2" as default, and populate it from the session analysis

#### Scenario: Profile read at session start
- **WHEN** `GET /api/warmup/config` is called
- **THEN** the system SHALL read the user's warmupUserProfile and inject levelEstimate, relevant strengths/weaknesses, and recent topics into the Gemini system prompt

---

### Requirement: Profile is updated via background job after each session
The system SHALL enqueue a `warmup-profile` BullMQ job after each completed session. The job SHALL use Gemini to analyse the transcript and feedback, then update the profile document.

#### Scenario: Profile update job enqueued
- **WHEN** `/api/warmup/session/complete` is called and feedback is generated
- **THEN** the system SHALL enqueue a warmup-profile job with `{ userId, sessionId, transcript, feedback, currentProfile }` and return to the client without waiting for the job

#### Scenario: Profile update job runs successfully
- **WHEN** the warmup-profile worker processes the job
- **THEN** the system SHALL call Gemini with the transcript, feedback, and current profile to produce a delta, then update levelEstimate, strengths[], weaknesses[], topicsExplored[], totalSessions, and lastSessionDate on the profile document

#### Scenario: Profile update job fails
- **WHEN** the warmup-profile worker fails (Gemini error, network issue)
- **THEN** the system SHALL retry up to 3 times with exponential backoff; the session feedback already delivered to the user is unaffected

---

### Requirement: Profile informs topic selection
The system SHALL avoid suggesting topics the user has explored recently and SHALL factor in known weaknesses when shaping the AI system prompt.

#### Scenario: Topic not recently covered
- **WHEN** `GET /api/warmup/config` is called
- **THEN** the system SHALL select a topic not present in the last 5 entries of topicsExplored[]

#### Scenario: Weakness injected into system prompt
- **WHEN** warmupUserProfile has non-empty weaknesses[]
- **THEN** the system prompt SHALL include an instruction for the AI to naturally weave in practice of the top weakness (e.g. "gently encourage use of connecting words")
