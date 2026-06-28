# Validation Summary

| Candidate | Disposition | Confidence | Notes |
|---|---|---|---|
| CF-001 | reportable | high | Static source/config trace supports missing auth on admin stats and delete APIs. Runtime HTTP reproduction blocked by no local server. |
| CF-002 | reportable | medium-high | Static source trace supports unescaped `innerHTML` sinks for search query and imported names. Browser PoC not run. |
| CF-003 | deferred | medium | Inline admin `onclick` context needs browser PoC. |
| CF-004 | suppressed | medium | Boundary-unsafe prefix check exists, but no sibling target or production backend exposure found. |
