## AI Transcript Panel (WarmupSession)

`aiLinesRef` already collects AI speech text from `outputTranscription` events — it just isn't displayed. We surface it as a scrolling panel below the keyword chips.

- New `aiTranscript` state (string, last AI utterance or last 2-3 lines)
- Updated on every `outputTranscription` event
- Shown only when `status === 'active'` and transcript is non-empty
- Auto-scrolls to latest line
- Styled as a muted panel (not user-facing chat, just an aid)

## Feedback Card (WarmupComplete)

Replace the prose-heavy layout with three icon-led rows:

| Icon | Content |
|------|---------|
| ✅ | `wentWell` — 1 sentence, truncated if needed |
| 💡 | `practiceTip` — 1 sentence |
| 📊 | `levelNote` — 1 short line |

Each row: icon + label chip + text. Scannable in under 5 seconds.
No card wrapper needed — rows sit directly in the space.
