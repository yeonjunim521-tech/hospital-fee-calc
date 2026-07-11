# MEDICost 개인정보·분석 최소수집 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 분석 동의 기반 telemetry를 비식별 데이터로 축소하고 30일 보존·동의 철회·공개 API 보호를 적용한다.

**Architecture:** 브라우저는 동의 상태를 단일 진실원으로 사용해 GA·AdSense·자체 telemetry를 제어한다. 서버는 원시 텍스트 대신 열거값과 구간값만 받아 D1에 저장하며, 공통 IP 해시 rate limit과 관리자 purge endpoint로 보존기간을 적용한다.

**Tech Stack:** 정적 HTML/JavaScript, Cloudflare Pages Functions TypeScript, Cloudflare D1 SQL, Node 내장 테스트, Chrome DevTools Protocol QA.

## Global Constraints

- 계산 공식·의료 데이터·빠른 계산·결과 해석 카드의 동작을 변경하지 않는다.
- 원시 검색어, 질병명, 상세 시술, User-Agent, 보험 세대, 정확한 금액을 GA와 D1에 보내거나 저장하지 않는다.
- 분석과 광고는 필수 기능이 아니며 철회 후 다음 이벤트·telemetry 전송을 중단한다.
- telemetry 원본 보존기간은 30일이다.
- 신규 production dependency와 lockfile 변경을 만들지 않는다.
- 기존 사용자 변경 `TASKS.md`, `.codex-progress/`, `.omo/`, 기존 보안 계획 문서는 수정하거나 스테이징하지 않는다.

---

### Task 1: 동의 철회와 비식별 Google Analytics

**Files:**
- Modify: `frontend/assets/js/consent.js:47-75`
- Modify: `frontend/assets/js/analytics.js:1-16`
- Modify: `frontend/assets/js/script.js:4560-4569, 4959-4973`
- Test: `tests/frontend_v3_shell.test.js`

**Interfaces:**
- Consumes: `MEDICostConsent.readConsent()`과 `{ analytics: boolean, ads: boolean }` 동의값
- Produces: `MEDICostConsent.applyConsent(consent)`가 현재 스크립트와 동의 상태를 동기화하고, `trackGAEvent(name, params)`가 비식별 event만 전송

- [ ] **Step 1: 동의 철회 계약 테스트를 추가한다**

```js
assert.match(consentSource, /removeChild|\.remove\(\)/);
assert.match(consentSource, /medicost-analytics/);
assert.match(consentSource, /medicost-ads/);
assert.doesNotMatch(scriptSource, /search_term:\s*(clean|query)/);
```

- [ ] **Step 2: 테스트가 현재 실패하는지 확인한다**

Run: `node tests/frontend_v3_shell.test.js`

Expected: `search_term` 또는 철회 처리 부재 때문에 FAIL.

- [ ] **Step 3: 최소 동의 동기화를 구현한다**

```js
function syncScript(id, enabled, src, attributes = {}) {
    const existing = root.document?.getElementById(id);
    if (!enabled && existing) existing.remove();
    if (enabled && !existing) loadScript(id, src, attributes);
}

function applyConsent(consent) {
    syncScript('medicost-analytics', consent.analytics, 'assets/js/analytics.js');
    syncScript('medicost-ads', consent.ads, ADS_SCRIPT_URL, { crossorigin: 'anonymous' });
}
```

`script.js`의 GA event는 `result_count`, `search_scope`, `item_group`, `page_path`만 남긴다. `analytics.js`는 이벤트 실행 전 현재 `MEDICostConsent.readConsent().analytics`를 확인한다.

- [ ] **Step 4: 동의 계약 테스트를 통과시킨다**

Run: `node tests/frontend_v3_shell.test.js`

Expected: `PASS`.

- [ ] **Step 5: 변경 범위를 확인한다**

Run: `git diff --check -- frontend/assets/js/consent.js frontend/assets/js/analytics.js frontend/assets/js/script.js tests/frontend_v3_shell.test.js`

Expected: exit code `0`.

### Task 2: 최소 telemetry schema와 공개 API 속도 제한

**Files:**
- Modify: `frontend/assets/js/script.js:1331-1396`
- Modify: `functions/api/search-log.ts`
- Modify: `functions/api/search-click.ts`
- Modify: `functions/api/calculation-log.ts`
- Modify: `database/schema.sql:1-134`
- Test: `tests/api_security_regression.mjs`

**Interfaces:**
- Consumes: 분석 동의 브라우저 호출과 `CF-Connecting-IP` header
- Produces: `/api/search-log`, `/api/search-click`, `/api/calculation-log`은 비식별 payload만 받고 IP당 30회/시간 제한, 31번째 요청은 `429`

- [ ] **Step 1: API 보안 회귀 테스트를 추가한다**

```js
assert.doesNotMatch(searchLogSource, /userAgent|rawQuery\.slice/);
assert.doesNotMatch(calculationLogSource, /sanjeongDisease|selectedTests|insuranceGeneration/);
assert.match(searchLogSource, /RATE_LIMIT_MAX_REQUESTS_PER_HOUR/);
assert.match(calculationLogSource, /createRateLimitKey/);
```

- [ ] **Step 2: 테스트가 현재 실패하는지 확인한다**

Run: `node tests/api_security_regression.mjs`

Expected: 원시 필드와 rate limit 부재 때문에 FAIL.

- [ ] **Step 3: 클라이언트 payload를 집계값으로 축소한다**

```js
function bucketCost(value) {
    const amount = Number(value) || 0;
    if (amount < 50000) return 'under_50k';
    if (amount < 200000) return '50k_to_199k';
    return '200k_or_more';
}

sendCalculationLog({
    hospitalClass,
    treatmentType,
    nonBenefitRegion,
    stayDaysBucket: stayDays > 7 ? '8_or_more' : String(Math.max(0, stayDays)),
    hasInsurance,
    finalCostBucket: bucketCost(patientTotalPay)
});
```

검색 payload는 `searchScope`, `resultCount`, `path`만, 클릭 payload는 `itemGroup`, `path`만 전송한다.

- [ ] **Step 4: 서버 API와 schema를 최소화한다**

```ts
const RATE_LIMIT_MAX_REQUESTS_PER_HOUR = 30;
const requestCount = await countHourlyRequest(context.env.DB, clientIp, 'search-log');
if (requestCount > RATE_LIMIT_MAX_REQUESTS_PER_HOUR) {
  return Response.json({ ok: false, error: '요청이 너무 많습니다.' }, { status: 429, headers: { 'Retry-After': '3600' } });
}
```

`search_logs`, `search_click_logs`, `calculation_logs`의 원시 text column을 쓰지 않고 scope·count·bucket·created_at만 insert한다. 기존 컬럼은 migration 없이 남겨도 되지만 새 코드가 값을 넣지 않는다. `telemetry_rate_limits`의 rate key에는 event type prefix를 포함한다.

- [ ] **Step 5: API 보안 테스트를 통과시킨다**

Run: `node tests/api_security_regression.mjs`

Expected: `PASS`.

- [ ] **Step 6: XSS·페이지 회귀를 확인한다**

Run: `node tests/script_xss_regression.js && node tests/frontend_v3_pages.test.js`

Expected: 둘 다 `PASS`.

### Task 3: 30일 보존 purge와 개인정보 고지

**Files:**
- Create: `functions/api/admin/purge-telemetry.ts`
- Modify: `frontend/privacy.html`
- Modify: `frontend/contact.html`
- Modify: `tests/api_security_regression.mjs`
- Modify: `tests/frontend_v3_pages.test.js`

**Interfaces:**
- Consumes: 공통 `/api/admin/` Basic Auth·same-origin mutation 보호
- Produces: `POST /api/admin/purge-telemetry`가 30일 초과 telemetry row를 삭제하고 table별 count를 반환

- [ ] **Step 1: purge와 고지 계약 테스트를 추가한다**

```js
assert.match(purgeSource, /datetime\('now', '-30 days'\)/);
assert.match(purgeSource, /DELETE FROM search_logs/);
assert.match(privacyPage, /30일/);
assert.match(privacyPage, /원시 검색어/);
assert.match(contactPage, /데이터 오류/);
```

- [ ] **Step 2: 테스트가 현재 실패하는지 확인한다**

Run: `node tests/api_security_regression.mjs && node tests/frontend_v3_pages.test.js`

Expected: purge endpoint와 새 고지 문구 부재 때문에 FAIL.

- [ ] **Step 3: 관리자 purge endpoint를 구현한다**

```ts
const cutoff = "datetime('now', '-30 days')";
const [searches, clicks, calculations] = await context.env.DB.batch([
  context.env.DB.prepare(`DELETE FROM search_logs WHERE created_at < ${cutoff}`),
  context.env.DB.prepare(`DELETE FROM search_click_logs WHERE created_at < ${cutoff}`),
  context.env.DB.prepare(`DELETE FROM calculation_logs WHERE created_at < ${cutoff}`),
]);
return Response.json({ ok: true, deleted: {
  searchLogs: searches.meta.changes,
  searchClickLogs: clicks.meta.changes,
  calculationLogs: calculations.meta.changes
} });
```

endpoint는 body를 받지 않고, 공통 middleware가 인증·Origin 검사를 적용한다.

- [ ] **Step 4: 개인정보·문의 문구를 코드와 일치시킨다**

```html
<li>검색 범위와 결과 수, 계산 조건의 비식별 구간값</li>
<li>원시 검색어, 질병명, 상세 시술명, 보험 문서와 진료기록은 분석 목적으로 저장하지 않습니다.</li>
<p>선택 분석 로그는 수집일로부터 30일 뒤 삭제합니다.</p>
<p>데이터 오류와 개인정보 문의 채널은 준비 중이며, 공개 전 운영 주체와 공식 이메일을 이 페이지에 표시합니다.</p>
```

- [ ] **Step 5: purge·고지 테스트를 통과시킨다**

Run: `node tests/api_security_regression.mjs && node tests/frontend_v3_pages.test.js`

Expected: 둘 다 `PASS`.

### Task 4: 통합 Chrome 검증과 문서 정리

**Files:**
- Modify: `docs/superpowers/specs/2026-07-11-medicost-privacy-telemetry-hardening-design.md`
- Modify: `docs/superpowers/plans/2026-07-11-medicost-privacy-telemetry-hardening.md`
- Test: `tests/frontend_v3_shell.test.js`
- Test: `tests/frontend_v3_browser.test.js`

**Interfaces:**
- Consumes: Tasks 1–3의 동의·API·고지 계약
- Produces: 수동 Chrome 증적과 완료된 계획 체크리스트

- [ ] **Step 1: 동의 거부·허용·철회 브라우저 검증을 추가한다**

```js
assert.strictEqual(optionalRequests, 0);
await evaluate(cdp, 'window.MEDICostConsent.saveConsent(true, false)');
assert.ok(await evaluate(cdp, 'Boolean(document.getElementById("medicost-analytics"))'));
await evaluate(cdp, 'window.MEDICostConsent.saveConsent(false, false)');
assert.strictEqual(await evaluate(cdp, 'Boolean(document.getElementById("medicost-analytics"))'), false);
```

- [ ] **Step 2: 전체 회귀 검증을 실행한다**

Run: `node tests/script_xss_regression.js && node tests/frontend_v3_shell.test.js && node tests/frontend_v3_pages.test.js && node tests/api_security_regression.mjs && node tests/frontend_v3_browser.test.js && git diff --check`

Expected: 모든 명령이 exit code `0`.

- [ ] **Step 3: Chrome에서 실제 사용 흐름을 확인한다**

검증 순서: 최초 거부 → 필수 조건 계산 → 검색 → 분석 허용 → 분석 철회 → 보험 계산 → 초기화 → 375/768/1280px 확인.

Expected: 거부·철회 뒤 optional request가 없고, 계산 결과·검색·결과 해석 카드가 기존과 동일하게 동작.

- [ ] **Step 4: 문서와 작업 상태를 정리한다**

설계 문서에는 구현 결과만 한 줄 추가하고, 계획서의 완료한 checkbox를 `[x]`로 바꾼다. 기존 사용자 소유 `TASKS.md`는 수정하지 않는다.

- [ ] **Step 5: 커밋 여부를 사용자에게 확인한다**

커밋·push·merge는 실행하지 않는다. 검증 결과와 변경 파일을 보고한 뒤 사용자의 명시 요청이 있을 때만 Git 작업을 수행한다.

## Self-Review

- Spec coverage: 동의 철회, GA 최소화, D1 최소수집, rate limit, 30일 purge, 개인정보 안내, Chrome 회귀가 Task 1–4에 각각 포함됨.
- Placeholder scan: `TBD`, `TODO`, `implement later`, `fill in details` 없음.
- Interface consistency: 브라우저 동의는 `MEDICostConsent`, API 보호는 `CF-Connecting-IP`와 `telemetry_rate_limits`, 보존은 `/api/admin/purge-telemetry`로 고정.
