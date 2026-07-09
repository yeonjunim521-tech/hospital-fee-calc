# Finding Discovery Report

Repository-wide scan target: `C:\Users\giro0\Desktop\Codex\hospital fee calc`.

Generated worklists:
- `rank_input.csv`: 470 rows, generated with the codex-security rank input script using `PYTHONUTF8=1` after Windows cp949 failed.
- `deep_review_input.csv`: 470 rows, copied from rank input for 100% candidate-file coverage contract.
- `work_ledger.jsonl`: high-impact runtime files completed; remaining rows explicitly deferred.

Discovery candidates:
- CF-001: Unauthenticated admin analytics read and log deletion APIs. Reportable.
- CF-002: DOM XSS through unescaped search and data names rendered with `innerHTML`. Reportable.
- CF-003: Admin inline `onclick` values use HTML escaping in JavaScript string context. Deferred pending browser PoC.
- CF-004: Local backend prefix path check permits sibling frontend-prefixed paths. Suppressed from final report because no such sibling exists and backend appears local/dev-only.

Raw data deletion risk:
- Current working tree shows deleted `data/raw/action_cost_inout_2024.csv`, `data/raw/disease_cost_kcd4_inout_2024.csv`, `data/raw/disease_cost_kcd5_age_sex_2024.csv`, and an XLSX fee schedule file.
- This is operational/build-data risk: generated JS remains present, but regeneration scripts will fail without required CSV/XLSX sources.
