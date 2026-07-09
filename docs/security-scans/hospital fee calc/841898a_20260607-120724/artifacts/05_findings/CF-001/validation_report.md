# Validation Report: CF-001

## Candidate
Unauthenticated admin analytics read and log deletion APIs.

## Rubric
- [x] Attacker-controlled source identified: anonymous HTTP GET/POST to `/api/admin/*`.
- [x] Broken control identified: no authentication/authorization gate in handlers.
- [x] Sensitive sink identified: D1 queries returning logs and D1 deletes.
- [x] Repository counterevidence checked: no `_middleware.ts`, `ADMIN_TOKEN`, `Authorization`, or token check found in `functions/` or `wrangler.toml`.
- [ ] Runtime HTTP reproduction completed: blocked because local server was not listening on `127.0.0.1:8788`.

## Evidence
- `functions/api/admin/search-stats.ts:9` exports `onRequestGet` and immediately parses request URL at lines 11-12.
- `functions/api/admin/search-stats.ts:14-95` returns aggregate searches, zero-result searches, clicked items, recent search rows, and calculation condition rows.
- `functions/api/admin/search-stats.ts:57-65` returns recent `query`, `path`, `user_agent`, and timestamp fields.
- `functions/api/admin/delete-log.ts:5` exports `onRequestPost` and immediately parses body at lines 7-15.
- `functions/api/admin/delete-log.ts:23-28` deletes all log tables for `type === 'all'`.
- `functions/api/admin/delete-log.ts:56` executes delete queries for targeted deletion.
- `frontend/admin-search.html:219`, `278`, and `308` call these endpoints without auth headers.
- `database/schema.sql:1-8`, `17-24`, and `33-52` show the log tables include search query, path, user-agent, selected item JSON, calculation fields, and cost fields.

## Disposition
Reportable. Confidence high from static source/config evidence, with runtime reproduction pending.
