## Why

The current daily warm-up shows 4–5 short keyword chips generated at runtime by Gemini (e.g. "logement", "loyer mensuel"). These are too abstract to help a TEF Canada candidate actually start speaking — they see a word but don't know how to build a sentence with it. Replacing them with pre-written per-topic phrases and verb constructions (sentence starters) gives candidates an immediate, actionable speaking scaffold.

## What Changes

- Add a `phrases: string[]` field to the `WarmupTopic` interface and populate it for all 30 topics with 5–7 French sentence starters / verb constructions per topic
- Remove the `generateKeywords()` Gemini call from the server config endpoint — keywords are no longer generated at runtime
- Update the server config route to return `phrases` from the static topic list instead of `keywords` from Gemini
- Rename `keywords` → `phrases` (or keep `keywords` as the wire key populated from static data) throughout frontend/backend
- Replace the horizontal chip display in `WarmupSession` with a vertically scrollable "Phrases utiles" list, since full sentence starters don't fit in pill chips

## Capabilities

### New Capabilities
- `warmup-topic-phrases`: Static per-topic phrase library — sentence starters and verb constructions for all 30 warm-up topics, displayed as a scrollable list during the session

### Modified Capabilities
- (none — no existing spec files)

## Impact

- `constants/warmupTopics.ts`: Add `phrases: string[]` to `WarmupTopic` interface + populate all 30 entries
- `server/services/warmupService.ts`: Remove `generateKeywords()` method
- `server/routes/warmup.ts`: Config endpoint reads phrases from a static map instead of calling Gemini
- `services/warmupService.ts` (frontend): Update `WarmupConfigResponse` type (`keywords` → `phrases`)
- `pages/WarmupView.tsx`: Pass `phrases` through to `WarmupSession`
- `components/warmup/WarmupSession.tsx`: Replace chip row with scrollable phrase list
