## Why

The daily warm-up is intended to be the easiest entry point for speaking French, but the current session UI gives users no help while speaking. Users need visual crutches (AI transcript + speaking aids) during the session, and the feedback screen needs to be scannable at a glance rather than a wall of text.

## What Changes

- Show AI speech as live text during the session so users can follow along and understand what was said
- Improve keyword chip display as active speaking aids during the session
- Redesign the completion feedback card: replace text paragraphs with a simple visual layout (icon + short line per insight)

## Capabilities

### New Capabilities

- `warmup-session-transcript`: AI speech displayed as live text during an active session
- `warmup-feedback-card`: Visual feedback card with icon-led, scannable layout

### Modified Capabilities

- `warmup-session`: Session screen now shows AI transcript panel alongside keyword chips

## Impact

- `components/warmup/WarmupSession.tsx` — add AI transcript display
- `components/warmup/WarmupComplete.tsx` — redesign feedback card layout
- No backend changes required
