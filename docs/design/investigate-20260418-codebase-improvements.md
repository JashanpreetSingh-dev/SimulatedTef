# Codebase Improvement Discovery — 2026-04-18

**Method:** graphify knowledge graph analysis of `server/` (97 files, 530 nodes, 752 edges) + manual frontend audit  
**Scope:** Non-breaking improvements only — no business logic changes

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
- No `helmet.js` — missing X-Frame-Options, X-Content-Type-Options, CSP, HSTS
- Fix: `cors({ origin: [FRONTEND_URL] })` + `app.use(helmet())`
- File: `server/server.ts`

---

### 🟠 High Impact

**4. No structured logging**
- All logging is `console.log/error` — no log levels, no JSON, no correlation IDs
- Fix: Drop in `pino` + request ID middleware (`X-Request-Id` stamped on every request)
- Files: `server/middleware/errorHandler.ts`, new `server/middleware/requestId.ts`

**5. BullMQ workers have no retry config**
- `evaluationWorker` and `questionGenerationWorker` rely on BullMQ defaults (0 retries)
- A single Gemini timeout = silent job failure, no retry, no dead-letter
- Fix: Add `attempts: 3, backoff: { type: 'exponential', delay: 2000 }` + `removeOnFail: false`
- Files: `server/workers/evaluationWorker.ts`, `server/workers/questionGenerationWorker.ts`

**6. No code splitting on frontend**
- All 24 routes are statically imported — entire app bundle loads on first visit
- Fix: Wrap every page in `React.lazy()` + `Suspense`
- File: `App.tsx`

**7. No request timeout middleware**
- Server has no global timeout — a slow DB query holds threads indefinitely
- Individual `authenticatedFetch` has 30s client-side timeout, but server-side has none
- Fix: `express-timeout-handler` or simple timeout middleware

---

### 🟡 Medium Impact

**8. No client-side data caching**
- No React Query or SWR — each page independently fetches and manages its own state
- Multiple components can fire identical API calls simultaneously
- The `authenticatedFetch` layer is solid; just needs a cache layer on top
- Fix: React Query wrapping existing service calls

**9. No TTL indexes on growing collections**
- `webhookEvents`, `conversationLogs`, `usageEvents` grow unbounded
- Fix: TTL index on `webhookEvents` (30 days), `conversationLogs` (90 days)
- File: `server/db/indexes.ts`

**10. `connectDB()` imported directly everywhere**
- 47 direct import edges — services bypass the model layer and import from `db/connection.ts`
- Fix: ESLint `no-restricted-imports` rule to enforce DB access only through models
- Flagged by graph as surprising connections: `subscriptionService`, `stripeWebhooks`, `clearMockData` all directly call `connectDB()`

**11. Tailwind loaded from CDN in production**
- `index.html` fetches Tailwind from CDN — eliminates tree-shaking and adds network dep
- Fix: Build-time Tailwind CLI with PurgeCSS

**12. Analytics scripts blocking render**
- Google Analytics + Ahrefs load synchronously in `<head>`
- Fix: Add `async`/`defer` attributes

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
- ≤1 connection in the graph — possible dead code or under-documented
- Audit: is it called anywhere? If not, remove.

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

*Generated 2026-04-18 via graphify knowledge graph analysis + manual audit*
