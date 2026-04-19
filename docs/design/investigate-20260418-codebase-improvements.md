# Codebase Improvement Discovery — 2026-04-18

**Method:** graphify knowledge graph analysis of `server/` (97 files, 530 nodes, 752 edges) + manual frontend audit  
**Scope:** Non-breaking improvements only — no business logic changes

### Implementation notes (post-review)

- **CORS + Helmet:** Prefer `FRONTEND_URL` (and optional comma-separated `CORS_ORIGINS`) for the allowlist; **require `FRONTEND_URL` in production** so CORS is not accidentally empty. Enable Helmet’s safe defaults first; **leave CSP off or very loose on this Express API** until someone maps Clerk/Stripe/third-party needs — strict CSP breaks SPAs and redirect flows if applied blindly.
- **React.lazy / code splitting:** Lazy-load **most** routes; keep **one or two critical paths eager** (e.g. dashboard shell) if measurements show a chunk waterfall — not “every route lazy” as a hard rule.
- **BullMQ retries:** Default retry behavior depends on **BullMQ version and how jobs are added** — confirm `attempts` / `backoff` on **queue add options and Worker options** in-repo before documenting exact numbers.
- **`connectDB` fan-in:** High import count is not automatically wrong. Prefer **documenting the intended access pattern** (facade vs direct connection) before adding ESLint `no-restricted-imports`, so the rule does not fight legitimate bootstrap code.

---

## What We Found

### Graph Stats
- 530 nodes · 752 edges · 84 communities detected
- 84% EXTRACTED edges · 16% INFERRED
- 31 hyperedges mapping major system pipelines
- 97 isolated nodes (potential dead code or missing connections)

### God Nodes (highest dependency count)
| Node | Edges | Risk |
|------|-------|------|
| `connectDB()` | 47 | SPOF — imported directly across entire server |
| `Assignment Service` | 19 | High fan-out |
| `Database Index Definitions` | 18 | — |
| `Authentication Middleware (Clerk)` | 17 | — |
| `Mock Exam Service` | 16 | Orchestration god object |
| `User Usage Service` | 14 | Central to billing enforcement |

---

## Improvements by Area

### 🔴 Critical (fix now, low effort)

**1. Env var validation at startup**
- Currently: `process.env.CLERK_SECRET_KEY || ""` silently defaults to empty string
- Server starts successfully, then crashes on first authenticated request
- Fix: Zod schema validating all required env vars before `connectDB()` is called
- File: `server/server.ts`

**2. Error boundaries — none exist**
- Zero `ErrorBoundary` components in the entire frontend
- Any component throw unmounts the whole app
- Add: root-level boundary, route-level boundaries, exam session boundary (highest crash risk)
- Files: `App.tsx`, route components

**3. CORS wide open + no security headers**
- `app.use(cors())` — no origin whitelist
- No `helmet.js` — missing X-Frame-Options, X-Content-Type-Options, etc.
- Fix: allowlist via `FRONTEND_URL` + optional `CORS_ORIGINS`; dev auto-allows `http://localhost:3000` (Vite). `helmet()` with **CSP disabled or tuned** for this API (see Implementation notes above).
- File: `server/server.ts`, `server/env.ts`

---

### 🟠 High Impact

**4. No structured logging**
- All logging is `console.log/error` — no log levels, no JSON, no correlation IDs
- Fix: Drop in `pino` + request ID middleware (`X-Request-Id` stamped on every request)
- Files: `server/middleware/errorHandler.ts`, new `server/middleware/requestId.ts`

**5. BullMQ workers have no retry config**
- Workers may rely on BullMQ / job defaults — **verify** `attempts` and `backoff` on both **Worker** and **`queue.add`** call sites.
- A single Gemini timeout can mean a failed job with no recovery if retries are not set.
- Fix: Add `attempts: 3, backoff: { type: 'exponential', delay: 2000 }` + `removeOnFail: false` (or equivalent) where jobs are produced and consumed.
- Files: `server/workers/evaluationWorker.ts`, `server/workers/questionGenerationWorker.ts`, related queue modules

**6. No code splitting on frontend**
- All 24 routes are statically imported — entire app bundle loads on first visit
- Fix: `React.lazy()` + `Suspense` for **most** routes; keep critical paths eager if chunk waterfalls show up in profiling.
- File: `App.tsx`, `routes/ProtectedRoutes.tsx`

**7. No request timeout middleware**
- Server has no global timeout — a slow DB query holds threads indefinitely
- Individual `authenticatedFetch` has 30s client-side timeout, but server-side has none
- Fix: `express-timeout-handler` or simple timeout middleware
- **Done:** `server/middleware/requestTimeout.ts` after `express.json()` (default 120s, override with `REQUEST_TIMEOUT_MS`). Webhook routes mount earlier and are unaffected.

---

### 🟡 Medium Impact

**8. No client-side data caching**
- No React Query or SWR — each page independently fetches and manages its own state
- Multiple components can fire identical API calls simultaneously
- The `authenticatedFetch` layer is solid; just needs a cache layer on top
- Fix: React Query wrapping existing service calls

**9. No TTL indexes on growing collections**
- `webhookEvents`, `conversationLogs`, `usageEvents` grow unbounded
- Fix: Mongo TTL requires BSON `Date`; new writes set `mongoTtlAnchor` in `createWebhookEvent` / `createUsageEvent` / `createConversationLog`. TTL indexes: webhooks 30d, conversation logs 90d, usage events 90d. Legacy documents without `mongoTtlAnchor` are never auto-removed.
- File: `server/db/indexes.ts`, `server/models/webhookEvent.ts`, `usageEvent.ts`, `ConversationLog.ts`

**10. `connectDB()` imported directly everywhere**
- 47 direct import edges — services import from `db/connection.ts` (high fan-in, not necessarily incorrect).
- Fix (pick after design): ESLint `no-restricted-imports`, a thin `db` facade, or DI — **document intended pattern first** so lint rules match architecture.
- Flagged by graph: `subscriptionService`, `stripeWebhooks`, `clearMockData` among direct callers.

**11. Tailwind loaded from CDN in production**
- `index.html` fetches Tailwind from CDN — eliminates tree-shaking and adds network dep
- Fix: Build-time Tailwind CLI with PurgeCSS

**12. Analytics scripts blocking render**
- Ahrefs loader already uses `async`. gtag loader uses `async`; inline config moved to **end of `<body>`** before `index.tsx` so `<head>` meta/CSS parse first.
- File: `index.html`

---

### 🟢 Low Impact / Long-term

**13. No API versioning**
- All routes are `/api/*` — no version prefix
- Fix: `/api/v1/*` now, keep old routes as aliases; costs nothing, future-proofs breaking changes

**14. No pagination on list endpoints**
- Assignments, batch assignments, conversation logs likely return full collections
- Fix: Add `limit`/`offset` or cursor pagination

**15. Test coverage is near zero**
- 1 test file exists (`notificationService.test.ts`); Vitest is configured and ready
- Quickest wins: `mcqScoring` (pure function, easy), `userUsageService` (branching usage limit logic), auth middleware role resolution
- No frontend tests at all

**16. `any` types in catch blocks**
- Scattered `error: any` across route files and components
- Fix: Replace with `unknown` + type narrowing — no logic change

**17. `voteAnalyticsService` appears isolated**
- Graph under-connected this module; it **is in use**: `server/routes/admin.ts` (`voteAnalyticsService.getAnalytics`), `pages/AdminVoteAnalyticsView.tsx`, nav in `layouts/DashboardLayout.tsx`. **Not dead code** — graph false positive.

---

## Pipelines Mapped (from graphify hyperedges)

These are the major system flows, now formally documented:

| Pipeline | Files |
|----------|-------|
| BullMQ Queue System | redis → evaluation/email/questionGeneration queues + workers |
| MCQ Scoring Pipeline | mcqController → mcqScoring → readingTask/listeningTask → results |
| Server Startup Sequence | server.ts → connectDB → createIndexes → subscriptionService.init → workers |
| Stripe Webhook Pipeline | route → webhookEvent idempotency → subscription/stripe/notification |
| Evaluation Pipeline | evaluationWorker → Gemini → resultsService + userUsageService |
| Usage Limit Check | userUsageService → orgConfig + d2cConfig + periodUtils → mongo |
| Email Delivery Stack | emailWorker → notificationService → emailClient → Resend |
| Audio Storage Stack | recordingsService → s3Service → AWS S3 |

---

## Prioritized Backlog

| Priority | Item | Est. Effort |
|----------|------|-------------|
| 🔴 | Env var validation at startup | 1 hour |
| 🔴 | Error boundaries (root + exam session) | 2 hours |
| 🔴 | CORS whitelist + helmet.js | 1 hour |
| 🟠 | Structured logging (pino) + correlation IDs | 2 hours |
| 🟠 | BullMQ retry config + job timeouts | 1 hour |
| 🟠 | React.lazy code splitting on all routes | 2 hours |
| 🟠 | Request timeout middleware | 30 min |
| 🟡 | React Query for client-side caching | 1 day |
| 🟡 | TTL indexes on 3 collections | 30 min |
| 🟡 | `no-restricted-imports` for connectDB | 30 min |
| 🟡 | Tailwind build-time (remove CDN) | 2 hours |
| 🟢 | API versioning prefix | 1 hour |
| 🟢 | Pagination on list endpoints | 1 day |
| 🟢 | Test coverage: mcqScoring + userUsageService | 1 day |
| 🟢 | Audit voteAnalyticsService (dead code?) | 30 min |

**Total critical fixes: ~4 hours**  
**Total high-impact: ~1.5 days**

---

## Implementation status (2026-04-18)

| Item | Status |
|------|--------|
| Critical 1 — Env validation (`MONGODB_URI`; prod `CLERK_SECRET_KEY` + `FRONTEND_URL`) | Done — `server/env.ts`, wired from `server/server.ts` |
| Critical 2 — Error boundaries (root, signed-in shell, exam / mock-exam routes) | Done — `components/ErrorBoundary.tsx`, `App.tsx`, `routes/ProtectedRoutes.tsx` |
| Critical 3 — CORS allowlist + Helmet (CSP off on API) | Done — `server/server.ts` |
| High 5 — BullMQ retries | **Already present** — `defaultJobOptions.attempts` / `backoff` on `evaluationQueue` and `questionGenerationQueue`; `queue.add` call sites do not override `attempts` down to 1 |
| High 7 — Request timeout | Done — `server/middleware/requestTimeout.ts`, global after `express.json()` in `server/server.ts` |
| Medium 9 — TTL indexes | Done — `mongoTtlAnchor` + TTL in `server/db/indexes.ts` and model factories |
| Medium 12 — Analytics head | Done — gtag block moved to end of `index.html` `<body>` |
| High 4 — Pino + request ID | Done — `server/logger.ts`, `server/middleware/requestId.ts`, `errorHandler.ts`, `server/server.ts` |
| High 6 — React.lazy | Done — `App.tsx`, `routes/ProtectedRoutes.tsx` with `Suspense` fallbacks |
| Low 17 — voteAnalyticsService | **Not applicable** — in use via admin API and UI (see item 17 above) |

*Generated 2026-04-18 via graphify knowledge graph analysis + manual audit*
