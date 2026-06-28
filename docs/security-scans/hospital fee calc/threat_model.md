# Security Threat Model: hospital fee calc

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
