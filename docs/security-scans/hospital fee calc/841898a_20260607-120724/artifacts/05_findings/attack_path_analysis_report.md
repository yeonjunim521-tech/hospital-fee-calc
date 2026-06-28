# Scan-Level Attack Path Analysis

Reportable findings:
- CF-001: High, anonymous admin analytics read and destructive log deletion.
- CF-002: Medium, DOM XSS via unescaped `innerHTML` from user search query/imported data names.

Deferred/suppressed:
- CF-003: deferred pending browser PoC and post-auth admin design.
- CF-004: suppressed because no reachable sibling target or deployed backend evidence exists.
