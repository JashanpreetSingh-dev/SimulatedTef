# gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available gstack skills:
`/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`

## Design documents

gstack skills that produce design/plan documents (`/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`) must save their output to **`docs/design/`** in the repo root, not to `~/.gstack/projects/`. Use the filename convention `{skill}-{YYYYMMDD}-{short-slug}.md` (e.g. `office-hours-20260402-launch-strategy.md`).

After writing the file, always stage and commit it: `git add docs/design/ && git commit -m "docs: add {skill} design doc — {short description}"`.

`~/.gstack/` is still used for gstack internals (learnings, timeline, reviews) — those stay local and are not committed.

## Knowledge graph (Graphify)

This repo has Graphify output under **`graphify-out/`**. When the task touches **architecture, module boundaries, how components connect, onboarding a large area of the codebase, or cross-file relationships**, read these **before** guessing from ad-hoc search alone:

1. **`graphify-out/GRAPH_REPORT.md`** — plain-language audit and communities (start here).
2. **`graphify-out/graph.json`** — nodes, edges, and provenance (EXTRACTED / INFERRED / AMBIGUOUS) for precise follow-up.
3. **`graphify-out/graph.html`** — interactive visualization; use when spatial/layout of the graph matters.

If those files are missing or stale for the area being discussed, say so and either read the source directly or suggest re-running Graphify on the relevant path. A second corpus may exist at **`server/graphify-out/`** when the graph was built from `server/` only — prefer the tree that matches the user’s question.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
