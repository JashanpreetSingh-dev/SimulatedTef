# Owner Dashboard — Design Document
**Date:** 2026-05-01  
**Status:** Approved for implementation  
**Scope:** Internal-only, owner-gated analytics dashboard  

---

## 1. Goal

Build a single-page owner dashboard that gives the app owner (Jashanpreet) a real-time view of:
- How many users are active and what tier they are on
- What AI features are being used and how often
- What AI is costing, broken down by feature
- Health of the evaluation pipeline

This is **not** for org admins or students — it is strictly a single-user internal tool gated by the owner's Clerk user ID.

---

## 2. Access Control

### Backend
Add `requireOwner` middleware to `server/middleware/auth.ts`:

```ts
export function requireOwner(req: Request, res: Response, next: NextFunction) {
  const ownerId = process.env.OWNER_USER_ID;
  if (!ownerId || req.userId !== ownerId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}
```

All owner routes use: `requireAuth, requireOwner`

### Frontend
Gate the page and nav link using `VITE_OWNER_USER_ID`:

```ts
const isOwner = user?.id === import.meta.env.VITE_OWNER_USER_ID;
```

Redirect to `/dashboard` if not owner. No nav link shown to anyone else.

### Environment variables required
| Variable | Where | Value |
|---|---|---|
| `OWNER_USER_ID` | Railway (server) | Your Clerk user ID e.g. `user_2abc...` |
| `VITE_OWNER_USER_ID` | Railway (client build) | Same Clerk user ID |

---

## 3. New Files

| File | Purpose |
|---|---|
| `server/routes/owner.ts` | All aggregation endpoints |
| `pages/OwnerDashboard.tsx` | Dashboard page |
| `services/ownerApi.ts` | Frontend fetch wrappers |

Registered in `server/server.ts` as `app.use('/api/owner', ownerRouter)`.  
Registered in `App.tsx` / `routes/ProtectedRoutes.tsx` as `/owner-dashboard`.

---

## 4. Cost Tracking Gaps — Fixes Required

Before the dashboard can show complete AI costs, token usage needs to be captured in two places that currently discard it.

### 4a. Evaluation Worker (`server/workers/evaluationWorker.ts`)

**Currently:** calls `generateContent()` for transcription + scoring, ignores `response.usageMetadata`.

**Fix:** After each `generateContent` call, read `response.usageMetadata` and accumulate:
```ts
const meta = response.usageMetadata;
const cost = (meta.promptTokenCount * 0.00000030) + (meta.candidatesTokenCount * 0.00000250);
```

**Store on:** `Result` document — add fields `aiTokens: { prompt, completion }` and `aiCost: number`.

Gemini 2.5 Flash pricing used:
- Input: $0.30 / 1M tokens  
- Output: $2.50 / 1M tokens  
*(Verify against current Google pricing before go-live)*

### 4b. Writing Feedback (`services/guidedWritingFeedback.ts`, `server/services/assignmentService.ts`, `server/services/dailyRitualService.ts`)

Same fix — capture `usageMetadata` after `generateContent`, store cost on the relevant result/log document.

### 4c. Speaking Sessions — Already Done ✅

`ConversationLog.metrics.totalCost` is already computed and stored per session using Gemini Live token pricing ($3/$12 per 1M input/output).

---

## 5. Backend API Endpoints

All under `/api/owner`. All require `requireAuth + requireOwner`.

### `GET /api/owner/stats`
Top-level KPI cards. Accepts optional `?days=30`.

**Response:**
```json
{
  "users": {
    "total": 421,
    "d2c": 389,
    "org": 32
  },
  "subscriptions": {
    "free": 238,
    "basic": 112,
    "premium": 71,
    "canceled": 45
  },
  "activity": {
    "speakingSessions": 1204,
    "evaluations": 892,
    "writingFeedback": 340,
    "mockExams": 201
  },
  "cost": {
    "speaking": 12.40,
    "evaluations": 3.80,
    "writing": 1.10,
    "total": 17.30
  }
}
```

**Sources:**
- `subscriptions` collection — group by tier/status
- `conversationlogs` — count + sum cost
- `usageEvents` — count by type
- `results` — sum aiCost (after fix 4a)

---

### `GET /api/owner/activity-chart`
Daily activity for the chart. Accepts `?days=30`.

**Response:**
```json
{
  "labels": ["2026-04-01", "2026-04-02", ...],
  "speaking": [12, 9, 15, ...],
  "evaluations": [8, 6, 11, ...],
  "newSignups": [3, 1, 4, ...]
}
```

**Sources:**
- `conversationlogs` — `$group by startedAt date`
- `usageEvents` — `$group by date`
- `subscriptions` — `$group by createdAt date`

---

### `GET /api/owner/cost-breakdown`
AI cost per feature per day. Accepts `?days=30`.

**Response:**
```json
{
  "labels": ["2026-04-01", ...],
  "speaking": [0.42, 0.38, ...],
  "evaluations": [0.12, 0.09, ...],
  "writing": [0.04, 0.03, ...]
}
```

---

### `GET /api/owner/session-health`
Speaking session quality metrics.

**Response:**
```json
{
  "completed": 938,
  "abandoned": 181,
  "failed": 85,
  "avgDurationSeconds": 372,
  "avgTokensPerSession": 42310,
  "totalCostThisMonth": 12.40
}
```

---

### `GET /api/owner/recent-sessions`
Last N speaking sessions. Accepts `?limit=20`.

**Response:**
```json
[
  {
    "userId": "user_abc",
    "userEmail": "...",
    "examType": "partA",
    "startedAt": "2026-05-01T14:22:00Z",
    "duration": 372,
    "status": "completed",
    "cost": 0.042
  }
]
```

Note: needs Clerk API call to resolve userId → email.

---

## 6. Frontend Page — `pages/OwnerDashboard.tsx`

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Owner Dashboard                          Date range: [30d ▾]   │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│  Total   │  Active  │  Basic   │ Premium  │ Speaking │  AI Cost │
│  Users   │   Subs   │  Users   │  Users   │ Sessions │  /month  │
│   421    │   183    │   112    │   71     │  1,204   │  $17.30  │
├──────────┴──────────┴──────────┴──────────┴──────────┴──────────┤
│                                                                  │
│  Activity (last 30 days)            [Speaking] [Evals] [Signups]│
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                     Line + bar chart                       │  │
│  └────────────────────────────────────────────────────────────┘  │
├────────────────────────┬─────────────────────────────────────────┤
│  Usage by task type    │  Subscription breakdown                 │
│                        │                                         │
│  Speaking A  ████  412 │  ● Free      238  ░░░░░░░░░░  57%      │
│  Speaking B  ███   298 │  ● Basic     112  ██████░░░░  27%      │
│  Writing A   ██    187 │  ● Premium    71  ████░░░░░░  17%      │
│  Writing B   █     102 │                                         │
│  Full Exam   ████  389 │  New this month: 34                     │
│  Mock Exam   ██    201 │  Churned:         8                     │
├────────────────────────┴─────────────────────────────────────────┤
│  AI Cost Breakdown (this month)                                  │
│                                                                  │
│  Speaking (Live)    $12.40  ████████████░░  72%                  │
│  Evaluations        $ 3.80  ████░░░░░░░░░░  22%                  │
│  Writing feedback   $ 1.10  █░░░░░░░░░░░░░   6%                  │
│  ─────────────────────────────────────────────────               │
│  Total              $17.30                                       │
│                                                                  │
│  [Cost trend chart — 30 days]                                    │
├──────────────────────────────────────────────────────────────────┤
│  Speaking Session Health                                         │
│                                                                  │
│  Completed  ████████████████  78%   Avg duration:  6.2 min      │
│  Abandoned  ████░░░░░░░░░░░░  15%   Avg tokens:    42,310       │
│  Failed     ██░░░░░░░░░░░░░░   7%   Total cost:    $12.40       │
├──────────────────────────────────────────────────────────────────┤
│  Recent Sessions                                     [View all]  │
│                                                                  │
│  user@email.com  Speaking A  6m 12s  ✅ completed  $0.04        │
│  user@email.com  Speaking B  4m 01s  ⚠️ abandoned  $0.02        │
│  user@email.com  Speaking A  8m 44s  ✅ completed  $0.06        │
└──────────────────────────────────────────────────────────────────┘
```

### Charting library
Use **Recharts** — it's lightweight, already likely in the project or easy to add, and works well with React + Tailwind.

### Date range selector
`7d / 30d / 90d` pill buttons. State lives in the page, passed as `?days=N` to all API calls.

---

## 7. Implementation Order

1. **`requireOwner` middleware** — 5 lines in `auth.ts`
2. **Cost capture in `evaluationWorker.ts`** — capture `usageMetadata`, store on `Result`
3. **Cost capture in writing services** — same pattern, 3 files
4. **`server/routes/owner.ts`** — aggregation queries (stats, chart, costs, health, recent)
5. **Register route** in `server/server.ts`
6. **`services/ownerApi.ts`** — typed fetch helpers
7. **`pages/OwnerDashboard.tsx`** — UI with Recharts
8. **Route + nav guard** in `App.tsx` / `ProtectedRoutes.tsx`
9. **Set env vars** in Railway

---

## 8. What's Out of Scope (v1)

- Stripe revenue / MRR — use Stripe dashboard directly
- Per-user drill-down pages
- Email alerts for cost spikes
- Export to CSV

These can be added in v2.
