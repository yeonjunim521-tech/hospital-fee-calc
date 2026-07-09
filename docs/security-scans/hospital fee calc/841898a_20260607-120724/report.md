# Security Review: hospital fee calc

## Scope

- Scan mode: repository-wide security scan.
- Target: `C:\Users\giro0\Desktop\Codex\hospital fee calc`.
- Commit baseline: `841898a`.
- Scan id: `841898a_20260607-120724`.
- Main artifacts: `docs/security-scans/hospital fee calc/841898a_20260607-120724`.
- Threat model: generated during Phase 1 and copied to `artifacts/01_context/threat_model.md`.
- Worklists: `rank_input.csv` and `deep_review_input.csv` each contain 470 rows.
- Runtime validation: local HTTP reproduction was attempted for `127.0.0.1:8788`, but no server was listening. Validation is primarily static source/config trace.
- Explicit limitations: many generated/secondary files in the 470-row worklist are marked deferred in `work_ledger.jsonl`; high-impact runtime surfaces were prioritized.

### Scan Summary

| Field | Value |
|---|---|
| Reportable findings | 2 |
| Severity mix | High: 1, Medium: 1 |
| Confidence mix | High: 1, Medium-high: 1 |
| Coverage | Core frontend, Pages Functions, D1 schema, local backend, build scripts reviewed; generated/secondary rows deferred |
| Validation mode | Static source/config trace plus local path calculation; no live server reproduction |

## Threat Model

## Overview

This repository is a hospital and emergency-room cost calculator deployed mainly as a Cloudflare Pages static frontend with Pages Functions and D1 for search/calculation analytics. It also contains a local Node backend for development/static API fallback, data-generation scripts, generated public-data JavaScript files, and database migrations.

Primary runtime surfaces:
- `frontend/`: public static pages, calculator UI, admin-search page, generated medical data JavaScript.
- `functions/api/`: Cloudflare Pages Functions for search logs, click logs, calculation logs, admin stats/delete, and public top-searches.
- `database/schema.sql`: D1 tables storing analytics and calculation inputs.
- `backend/server.js`: local development backend/static file server.
- `scripts/`: local data/build/GitHub helper scripts.

## Threat Model, Trust Boundaries, and Assumptions

Assets that matter:
- D1 analytics logs: search queries, clicked item names, path, user-agent, calculation conditions, selected item JSON, and costs.
- Frontend trust: public pages are served from the site origin, so DOM XSS can run with same-origin access to public/admin APIs reachable from the browser.
- Data integrity: generated JS data drives calculator search and estimates.
- Secrets: environment variables and GitHub/Cloudflare tokens must stay outside committed files.

Trust boundaries:
- Anonymous internet users can load public frontend pages and call unauthenticated public APIs.
- Admin-only analytics pages and deletion functions should require an operator boundary if they expose or mutate logs.
- Public-data CSV/XLSX files are developer/operator-controlled inputs but may still contain untrusted strings when rendered in HTML.
- Local backend is primarily developer-only unless separately deployed.

Attacker-controlled inputs:
- Search query text, clicked search item metadata, calculation form selections, URL path, query string parameters, and HTTP request body fields sent to Pages Functions.
- If the public-data import pipeline is compromised or untrusted data is imported, generated item/disease names become cross-boundary data rendered by the frontend.

Invariants:
- Admin analytics read/delete operations must not be reachable by anonymous users.
- User-controlled or imported text must not be inserted into `innerHTML` without context-correct escaping or DOM-safe construction.
- File-serving code must not allow path traversal or sibling-directory reads.
- SQL statements must use parameter binding for attacker-supplied values.
- PII-like user input should be rejected or minimized before logging.

## Attack Surface, Mitigations, and Attacker Stories

Important attack stories:
- Anonymous user calls admin APIs to read analytics or delete logs.
- Anonymous user enters a crafted search query that is reflected into `innerHTML` and executes script in the page.
- Imported public-data item names containing markup are rendered into result cards and execute script.
- A local backend request attempts path traversal to read files outside `frontend`.

Existing mitigations:
- D1 writes use prepared statements and bound parameters.
- `search-log.ts` blocks email, phone number, and resident-registration-number-like patterns before storage.
- Most static select/options use DOM APIs such as `.text`/`.textContent` in some areas.
- `backend/server.js` normalizes paths and blocks many traversal attempts, though its prefix check is not boundary-safe.

## Severity Calibration (Critical, High, Medium, Low)

Critical: direct unauthenticated code execution, broad account/control-plane compromise, or secret exfiltration from a deployed production surface.

High: unauthenticated access to admin log deletion or sensitive analytics, persistent/stored XSS with same-origin impact, or exploitable file read/write of sensitive files from deployed server code.

Medium: DOM XSS requiring user interaction with limited data access, imported-data XSS dependent on compromised build/source data, or local-only path traversal with no sensitive sibling files currently present.

Low: weak headers, noindex-only admin obscurity, version/banner leakage, or operational data freshness problems without a direct security boundary break.

## Findings

| # | Title | Severity | Confidence |
|---|---|---|---|
| 1 | [Unauthenticated admin analytics read and log deletion APIs](#1-unauthenticated-admin-analytics-read-and-log-deletion-apis) | high | high |
| 2 | [DOM XSS through unescaped search and data names rendered with innerHTML](#2-dom-xss-through-unescaped-search-and-data-names-rendered-with-innerhtml) | medium | medium-high |

### Confidence Scale

| Label | Meaning |
|---|---|
| high | Direct source, configuration, or runtime evidence supports the finding, with no material unresolved reachability or exploitability blocker. |
| medium | Source evidence supports a plausible issue, but runtime behavior, deployment configuration, role reachability, type constraints, or exploit reliability still need proof. |
| low | Weak or incomplete evidence; include only when the user explicitly wants follow-up candidates in the final report. |

### [1] Unauthenticated admin analytics read and log deletion APIs

| Field | Value |
|---|---|
| Severity | high |
| Confidence | high |
| Confidence rationale | Source and config trace show admin handlers read/delete D1 logs without any auth check; only live HTTP reproduction is missing. |
| Category | Missing authentication / unauthorized administrative action |
| CWE | CWE-306 Missing Authentication for Critical Function |
| Affected lines | `functions/api/admin/search-stats.ts:9`, `functions/api/admin/search-stats.ts:57-65`, `functions/api/admin/delete-log.ts:5`, `functions/api/admin/delete-log.ts:23-28`, `functions/api/admin/delete-log.ts:56`, `frontend/admin-search.html:219`, `frontend/admin-search.html:278`, `frontend/admin-search.html:308` |

#### Summary

The admin analytics endpoints expose search statistics, recent searches, clicked items, calculation conditions, and destructive log deletion without an authentication gate. The admin page calls these endpoints with ordinary fetch requests and no token/header. `noindex` only hides the page from search engines; it does not prevent direct API calls.

#### Validation

Method: static source/config trace.

Checklist:
- [x] Anonymous HTTP source identified.
- [x] Admin read and delete sinks identified.
- [x] Missing auth control confirmed in handler files.
- [x] Repository counterevidence checked for `_middleware.ts`, `ADMIN_TOKEN`, `Authorization`, and token checks.
- [ ] Live HTTP reproduction completed; local server was not listening.

Evidence:
- `search-stats.ts` exports `onRequestGet` and returns log-derived data without auth.
- `delete-log.ts` exports `onRequestPost`; `type === 'all'` deletes `search_logs`, `search_click_logs`, and `calculation_logs`.
- `wrangler.toml` binds D1 as `DB` and sets Pages output to `frontend`; no repository-level access control is present.

#### Dataflow

Anonymous request -> `/api/admin/search-stats` or `/api/admin/delete-log` -> Pages Function handler -> D1 prepared query/delete -> analytics data response or permanent log deletion.

#### Reachability

Under normal Cloudflare Pages Functions deployment, `/api/admin/*` routes are public unless protected by code, middleware, or external Cloudflare Access policy. This repository contains no such code-level protection. External Cloudflare Access could mitigate it, but no repository evidence proves it exists.

#### Severity

High. An unauthenticated user can read analytics data and delete all analytics/calculation logs. The impact is narrower than critical because the tables store analytics and calculator metadata rather than credentials or full medical records, and external deployment protection remains unverified.

Additional evidence that would raise severity: proof that logs contain sensitive personal medical information or that the API is publicly reachable in production. Evidence that would lower severity: enforced Cloudflare Access or route middleware protecting `/api/admin/*`.

#### Remediation

- Re-add admin authentication, preferably with `ADMIN_TOKEN` in Cloudflare Pages environment variables or Cloudflare Access.
- Enforce the auth check in both `search-stats.ts` and `delete-log.ts` before any DB access.
- Do not rely on hidden URLs or `noindex`.
- Add tests for unauthenticated 401 and authenticated success paths.

### [2] DOM XSS through unescaped search and data names rendered with innerHTML

| Field | Value |
|---|---|
| Severity | medium |
| Confidence | medium-high |
| Confidence rationale | Static source trace shows direct interpolation into `innerHTML`; browser payload execution was not run in this scan. |
| Category | DOM-based cross-site scripting |
| CWE | CWE-79 Improper Neutralization of Input During Web Page Generation |
| Affected lines | `frontend/index.html:256`, `frontend/index.html:535-539`, `frontend/assets/js/script.js:4637`, `frontend/assets/js/script.js:4646-4649`, `frontend/assets/js/script.js:4673`, `frontend/assets/js/script.js:4688-4690`, `frontend/assets/js/script.js:4787-4789` |

#### Summary

The frontend renders user search queries and imported medical item/disease names into template strings assigned to `innerHTML`. If the query or imported name contains markup, the browser treats it as HTML instead of text. Some other UI areas use safer DOM APIs, but these affected lines do not.

#### Validation

Method: static DOM sink trace.

Checklist:
- [x] User-controlled or cross-boundary source identified.
- [x] DOM sink identified.
- [x] Missing escaping/control identified at affected lines.
- [x] Active final function definitions identified.
- [ ] Browser PoC completed.

Evidence:
- `script.js:4637` puts `${query}` inside a no-results `innerHTML` string.
- `script.js:4673` repeats the same pattern for item search.
- `script.js:4646-4649`, `4688-4690`, and `4787-4789` insert disease/item names from generated datasets into `innerHTML`.

#### Dataflow

Search input or generated data value -> render function builds HTML string -> assignment to `innerHTML` -> browser parses as HTML/script-capable DOM.

#### Reachability

The search query path is reachable by a normal site visitor. The generated-data path requires polluted imported data or a compromised build/data source. If script executes on the same origin, it can call APIs available to that page, including the admin APIs while CF-001 remains unfixed.

#### Severity

Medium. The user-query XSS is directly reachable, but the scan did not prove credential/session theft or persistent execution. The imported-data path has stronger preconditions. Severity could rise if a browser PoC proves execution against production and same-origin admin APIs remain open.

#### Remediation

- Replace `innerHTML` rendering of dynamic text with DOM nodes and `.textContent`.
- If HTML templates must remain, escape all dynamic text for HTML context and avoid inline event handlers.
- Add a small browser/test harness using payloads such as `<img src=x onerror=alert(1)>` to ensure text renders inertly.

## Reviewed Surfaces

| Surface | Risk Area | Outcome | Notes |
|---|---|---|---|
| Cloudflare admin APIs | Missing auth / destructive action | Reported | CF-001. |
| Main frontend search rendering | DOM XSS | Reported | CF-002. |
| Admin page inline handlers | Stored/admin XSS | Needs follow-up | CF-003 deferred pending browser PoC and final admin-auth design. |
| Local backend static server | Path traversal / sibling read | Rejected | Prefix check is unsafe style, but no sibling target or production exposure found. Harden if backend is deployed. |
| Public log-write APIs | SQL injection / PII pattern logging | No issue found | Prepared statements used; search-log blocks common PII patterns. |
| Public top-searches API | Data exposure | Not applicable | Aggregate public search terms only. |
| GitHub helper scripts | Secret handling | No issue found | Tokens read from env vars; no token literals found. |
| Raw data files | Build/data integrity | Needs follow-up | Deleted raw CSV/XLSX files will break regeneration scripts; not a direct security vulnerability. |
| Generated data files | Data-to-DOM XSS | Needs follow-up | Rendering sinks reviewed; huge generated data not exhaustively line-reviewed. |

## Open Questions And Follow Up

1. Fix CF-001 first: protect `/api/admin/search-stats` and `/api/admin/delete-log` with `ADMIN_TOKEN` or Cloudflare Access.
2. Fix CF-002 next: replace dynamic `innerHTML` with `textContent`/DOM construction in `frontend/assets/js/script.js` around lines 4637, 4673, 4690, and 4789.
3. Validate CF-003 after CF-001: use a stored search/click value containing quotes and markup, then open `frontend/admin-search.html` in a browser.
4. Decide raw data deletion: restore required CSV/XLSX if future regeneration of `medical_statistics.js` or `fee_schedule_items.js` is needed.
5. If deploying `backend/server.js`, harden path boundary check with `path.relative` or `filePath.startsWith(FRONTEND_DIR + path.sep)` plus exact root handling.
