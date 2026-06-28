# Attack Path Analysis: CF-001

## Attack Path
1. Attacker opens the deployed site origin or calls the Pages Function directly.
2. Attacker sends GET `/api/admin/search-stats?days=30`.
3. Handler reads D1 log tables without auth and returns analytics, recent queries, paths, and user-agent values.
4. Attacker sends POST `/api/admin/delete-log` with `{"type":"all"}`.
5. Handler deletes all search, click, and calculation logs without auth.

## Counterevidence
- `frontend/admin-search.html` includes `noindex`, but this only reduces search-engine discovery and is not access control.
- A Cloudflare Access rule outside the repository could mitigate this, but no repository evidence proves such protection.

## Severity
High. The issue is unauthenticated admin data read plus unauthenticated destructive mutation of analytics tables. It is not rated critical because the stored data is analytics/calculation metadata rather than credentials or full medical records, and runtime deployment protection remains unverified.

## Policy Decision
Report.
