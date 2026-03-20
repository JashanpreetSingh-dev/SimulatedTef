## REMOVED Requirements

### Requirement: Dashboard shows a 7-day calendar dot view
**Reason**: The calendar dot view added visual complexity to the pre-session screen, creating anxiety about missed days rather than motivating the current session. The history data and endpoint remain intact for future use.
**Migration**: Remove the `getHistory()` call from `WarmupDashboard.tsx` on mount. Remove the `last7Days` computed logic and calendar dots JSX. The `/api/warmup/history` route and `warmupService.getHistory()` frontend method are also removed as they are no longer called.
