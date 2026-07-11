# MEDICost Search Discoverability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the seven broken Korean public SEO pages and make the current `pages.dev` site crawlable, understandable, and ready for SEO/GEO discovery across Google, Naver, Bing, and AI search while preserving the free calculator flow.

**Architecture:** Keep the current static HTML architecture and canonical host. Put page-specific Korean metadata and visible explanatory content directly in each public HTML page, mirror only visible claims in JSON-LD and `llms.txt`, and maintain one canonical URL list in `sitemap.xml`. Use a static IndexNow key file as a post-deploy submission aid; do not add a runtime or external API dependency.

**Tech Stack:** Static HTML, CSS, XML, Markdown-like text, Node.js built-in `fs`/`assert` tests, existing Playwright/Chrome browser test.

## Global Constraints

- Official canonical host is `https://hospital-fee-calc.pages.dev/`.
- Repair only public search surfaces; do not change calculation formulas, medical datasets, APIs, D1 schema, admin behavior, or existing privacy/telemetry edits.
- All public copy must be Korean UTF-8, unique per page, factual, reference-only, and must not claim diagnosis, treatment advice, or a guaranteed bill.
- JSON-LD must describe content visible on the same page; use `WebPage` on each target page and `FAQPage` only when the corresponding FAQ is visible.
- Keep admin routes blocked from crawling; do not add analytics, ad network code, or third-party runtime dependencies.
- Do not commit or push unless the user separately requests it.

## Execution Status

- [x] Tasks 1–4 implemented and focused contracts pass.
- [x] Task 5 verified with static regression tests, Chrome calculator QA, and fresh SEO page captures at `.codex-progress/seo-visual-qa/results.json` (7 pages × 375/768/1280).
- [ ] External deployment, search-console submission, and IndexNow submission remain owner actions after this branch is approved.

## File Map

- Modify: `frontend/hospital-cost-calculator.html` — hospital cost page metadata and Korean content.
- Modify: `frontend/er-cost-calculator.html` — emergency room cost page metadata and Korean content.
- Modify: `frontend/mri-cost-calculator.html` — MRI cost page metadata, JSON-LD, and Korean content.
- Modify: `frontend/ct-cost-calculator.html` — CT cost page metadata, JSON-LD, and Korean content.
- Modify: `frontend/endoscopy-cost-calculator.html` — endoscopy cost page metadata and Korean content.
- Modify: `frontend/hospitalization-cost-calculator.html` — hospitalization page metadata and Korean content.
- Modify: `frontend/noncovered-medical-cost.html` — non-covered cost page metadata and Korean content.
- Modify: `frontend/llms.txt` — UTF-8 AI-readable site summary, URL list, sources, and limits.
- Modify: `frontend/sitemap.xml` — canonical URL list and the implementation date as accurate `lastmod`.
- Modify: `frontend/robots.txt` — preserve admin disallows and verify sitemap reference.
- Create: `frontend/medicost-pages-20260712.txt` — IndexNow key text, exactly `medicost-pages-20260712`.
- Modify: `frontend/assets/css/seo-page.css` — only if the existing page stylesheet lacks the semantic information/ad-slot styles needed by the seven pages.
- Modify: `tests/frontend_v3_pages.test.js` — static SEO, canonical, JSON-LD, sitemap, and IndexNow regression assertions.
- Modify: `tests/frontend_v3_browser.test.js` — only if needed to cover public SEO-page-to-calculator navigation in the existing browser harness.

---

### Task 1: Pin the public search contract with failing tests

**Files:**
- Modify: `tests/frontend_v3_pages.test.js`

**Interfaces:**
- Consumes: the seven public HTML files, `frontend/sitemap.xml`, `frontend/robots.txt`, and `frontend/llms.txt`.
- Produces: a deterministic static contract that later page edits must satisfy.

- [ ] **Step 1: Add target page metadata to the test fixture**

Add a `seoPages` array with each file, canonical URL, and expected Korean title keyword:

```js
const seoPages = [
  ['hospital-cost-calculator.html', 'hospital-cost-calculator.html', '병원비'],
  ['er-cost-calculator.html', 'er-cost-calculator.html', '응급실'],
  ['mri-cost-calculator.html', 'mri-cost-calculator.html', 'MRI'],
  ['ct-cost-calculator.html', 'ct-cost-calculator.html', 'CT'],
  ['endoscopy-cost-calculator.html', 'endoscopy-cost-calculator.html', '내시경'],
  ['hospitalization-cost-calculator.html', 'hospitalization-cost-calculator.html', '입원비'],
  ['noncovered-medical-cost.html', 'noncovered-medical-cost.html', '비급여']
];
```

- [ ] **Step 2: Add assertions for unique Korean metadata and visible headings**

For each fixture, assert UTF-8, `index, follow`, exact canonical URL, a non-empty `title`, a non-empty description, an H1 containing the expected keyword, and no mojibake marker such as `�` or `癰`.

- [ ] **Step 3: Add JSON-LD and crawl-file assertions**

Parse every `application/ld+json` block with `JSON.parse`, assert `@type` is `WebPage` or `FAQPage`, assert the page URL matches its canonical URL, then parse `sitemap.xml` and assert every listed public URL has a matching canonical page. Assert `robots.txt` contains the canonical sitemap and both admin disallow rules. Assert `llms.txt` contains `MEDICost`, the canonical host, and no `�` replacement characters.

- [ ] **Step 4: Run the focused test and verify it fails before implementation**

Run: `node tests/frontend_v3_pages.test.js`

Expected: FAIL on the currently corrupted SEO metadata/content or missing search contract assertions. Do not weaken the assertions to make the existing files pass.

---

### Task 2: Restore the seven Korean public SEO pages

**Files:**
- Modify: the seven HTML files listed in the File Map.

**Interfaces:**
- Consumes: existing page layout, `assets/css/seo-page.css`, calculator links, and current data-source wording.
- Produces: crawlable, human-readable pages with stable canonical URLs and page-specific search intent.

- [ ] **Step 1: Preserve each page shell and repair only head/content blocks**

Keep `meta charset`, viewport, existing navigation, footer, scripts, calculator links, and classes. Replace corrupted title/description/H1/intro text with these page intents:

| File | Title intent | Required visible topics |
|---|---|---|
| `hospital-cost-calculator.html` | 병원비 계산기 | 병원급, 진료 유형, 검사·수술, 보험·비급여, 예상 범위 |
| `er-cost-calculator.html` | 응급실 진료비 계산기 | 응급실 이용, 병원급, 진료·검사, 보험, 예상 범위 |
| `mri-cost-calculator.html` | MRI 검사비 계산기 | MRI 부위, 급여·비급여 구분, 보험, 참고용 범위 |
| `ct-cost-calculator.html` | CT 검사비 계산기 | CT 검사, 조영제 여부가 달라질 수 있음, 보험, 참고용 범위 |
| `endoscopy-cost-calculator.html` | 내시경 검사비 계산기 | 위·대장내시경, 수면 여부, 급여·비급여, 참고용 범위 |
| `hospitalization-cost-calculator.html` | 입원비 계산기 | 입원일수, 병실, 병원급, 보험, 식대·비급여 변동 |
| `noncovered-medical-cost.html` | 비급여 진료비 계산기 | 비급여 검사·시술, 지역, 병원별 차이, 데이터 한계 |

- [ ] **Step 2: Add visible answer blocks that match search intent**

Each page must have one concise answer paragraph, a “계산 전에 확인할 점” list, a direct link to the main calculator, and a short FAQ whose answers use the same claims as the JSON-LD. Do not add hidden text or keyword lists.

- [ ] **Step 3: Add truthful structured data**

Use one `WebPage` object per page with `@id`, `name`, `description`, and the page canonical URL. Add `FAQPage` only when the page contains the matching visible FAQ questions and accepted answers. Keep JSON valid and avoid unsupported medical claims.

- [ ] **Step 4: Run the focused page contract**

Run: `node tests/frontend_v3_pages.test.js`

Expected: PASS for all public page SEO assertions, with existing v3 calculator/privacy assertions still passing.

---

### Task 3: Repair AI-readable and crawler discovery files

**Files:**
- Modify: `frontend/llms.txt`
- Modify: `frontend/sitemap.xml`
- Modify: `frontend/robots.txt`
- Create: `frontend/medicost-pages-20260712.txt`

**Interfaces:**
- Consumes: the canonical URLs from the seven pages plus existing public support pages.
- Produces: one consistent crawl/discovery surface for search engines and AI systems.

- [ ] **Step 1: Rewrite `llms.txt` as valid UTF-8 Korean**

Include the product purpose, public URL list, official source categories, reference-only calculation limits, and a statement that the main calculator is free. Use the same page names and URLs as the HTML and sitemap.

- [ ] **Step 2: Update the sitemap without inventing freshness**

Keep only canonical public URLs already present in the site. Set `lastmod` for changed pages to `2026-07-12`, leave unchanged support pages at their existing date until they are actually edited, use absolute HTTPS URLs, and keep admin pages out.

- [ ] **Step 3: Verify robots and add the IndexNow key file**

Keep `Allow: /`, both admin disallows, and `Sitemap: https://hospital-fee-calc.pages.dev/sitemap.xml`. Create `frontend/medicost-pages-20260712.txt` with exactly one line: `medicost-pages-20260712`. Do not call IndexNow during local implementation; submit after deployment from the owner’s webmaster account.

- [ ] **Step 4: Run the discovery assertions**

Run: `node tests/frontend_v3_pages.test.js`

Expected: sitemap URLs, canonical URLs, robots rules, llms content, and key-file content all pass.

---

### Task 4: Add non-invasive information-page ad slots and internal links

**Files:**
- Modify: the seven SEO HTML files.
- Modify: `frontend/assets/css/seo-page.css` only when the existing stylesheet has no compatible slot style.

**Interfaces:**
- Consumes: existing SEO page classes and current calculator CTA links.
- Produces: clearly reserved, empty ad containers that do not load a network script or interrupt calculator input/result flow.

- [ ] **Step 1: Place semantic empty slots only in informational content**

Add an `aside` with `aria-label="광고 영역"` between explanatory sections and after the FAQ, never inside the calculator CTA or result flow. Use a stable class such as `ad-slot ad-slot--content`; keep the container empty.

- [ ] **Step 2: Add only the minimum layout style if required**

Use the existing design tokens, a reserved minimum height, and responsive width. Do not add third-party scripts, inline style, tracking, or layout shifts in the calculator.

- [ ] **Step 3: Verify no optional script regression**

Run: `node tests/frontend_v3_pages.test.js`

Expected: every public page still contains no direct analytics or ad-network script before consent, and all internal calculator links remain present.

---

### Task 5: Run full static and browser verification

**Files:**
- Test only: existing test files and changed public files.

**Interfaces:**
- Consumes: all completed SEO/GEO changes.
- Produces: evidence that search metadata changes did not break the calculator or consent flow.

- [ ] **Step 1: Run JavaScript syntax and regression tests**

Run: `node --check frontend/assets/js/script.js`

Run: `node tests/script_xss_regression.js`

Run: `node tests/frontend_v3_shell.test.js`

Run: `node tests/frontend_v3_pages.test.js`

Expected: all commands exit 0.

- [ ] **Step 2: Run the existing Chrome browser test**

Run: `node tests/frontend_v3_browser.test.js`

Expected: the calculator loads, a normal calculation completes, consent-gated optional scripts remain absent before consent, and the tested viewport checks pass.

- [ ] **Step 3: Inspect the final diff and changed-file size**

Run: `git diff --check`

Run: `git status --short`

Review only the SEO/GEO files plus the new tests/key file. Preserve all pre-existing user changes. Confirm no secrets, patient data, or external ad code were added.

- [ ] **Step 4: Manual QA through the matching surface**

Open the local frontend in Chrome at the existing preview URL. Visit the main page and all seven SEO pages at desktop and mobile widths, confirm Korean title/H1/body rendering, click at least one “계산기로 이동” link, and complete one calculator result flow. Record any browser console error before handoff.

## Post-deploy owner actions

After the user deploys this branch, submit `https://hospital-fee-calc.pages.dev/sitemap.xml` and the key URL to Google Search Console, Naver Search Advisor, and Bing Webmaster Tools. Request recrawls for the seven changed URLs. These are external account actions and are intentionally not performed by the local implementation.
