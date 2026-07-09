# Validation Report: CF-002

## Candidate
DOM XSS through unescaped search and data names rendered with `innerHTML`.

## Rubric
- [x] Attacker-controlled or cross-boundary source identified: `disease_code_input` and other search inputs; imported generated JS data.
- [x] DOM sink identified: `innerHTML` assignments.
- [x] Missing control identified: no HTML escaping or DOM-safe text node construction at affected interpolation lines.
- [x] Active function versions identified: final override functions around `eofRenderDiseaseResults`, `eofRenderItemResults`, and hierarchy item rendering.
- [ ] Browser PoC completed: not run in this scan.

## Evidence
- `frontend/index.html:256` exposes a disease search input.
- `frontend/index.html:535-539` loads generated data scripts and `script.js` into the page.
- `frontend/assets/js/script.js:4637` inserts `${query}` into `results.innerHTML` when no disease results exist.
- `frontend/assets/js/script.js:4646-4649` inserts disease `name` and English name into `btn.innerHTML`.
- `frontend/assets/js/script.js:4673` inserts `${query}` into item-search no-results `innerHTML`.
- `frontend/assets/js/script.js:4688-4690` inserts `${item.name}` into `btn.innerHTML`.
- `frontend/assets/js/script.js:4787-4789` inserts `${item.name}` into hierarchy item `innerHTML`.

## Disposition
Reportable. Confidence medium-high for source-level DOM XSS; browser execution PoC remains a follow-up.
