# MEDICost 빠른 계산 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 필수 조건 3개만 선택하면 즉시 결과를 보이고, 상병·의료 항목·보험 설정은 필요할 때만 추가하는 계산 흐름을 완성한다.

**Architecture:** `app-shell.js`가 단계 전환과 빠른 결과 경로를 맡고, `script.js`가 기존 계산 상태로 선택 요약·초기화·결과 재계산을 제공한다. 계산 공식·검색 매칭은 변경하지 않는다.

**Tech Stack:** 정적 HTML, 브라우저 JavaScript, CSS, Node.js 계약·Chrome CDP 테스트.

## Global Constraints

- 제품 표기는 `MEDICost v3.0`으로 유지한다.
- 계산 공식, 의료 데이터, 외부 API, D1 schema, 기존 결과 구조는 변경하지 않는다.
- 기존 DOM ID와 검색 함수 계약을 유지한다.
- 신규 버튼은 최소 44px 터치 영역을 유지한다.
- 375px, 768px, 1280px 및 200% 확대에서 가로 넘침이 없어야 한다.
- commit(커밋: 변경 이력 저장), push(푸시: 원격 반영), 배포는 제외한다.

---

## 변경 파일과 책임

| 파일 | 책임 |
| --- | --- |
| `frontend/index.html` | 빠른 결과·항목 추가 CTA, 고급 항목 disclosure(접기/펼치기), 선택 요약, 결과 제어·초기화 마크업 |
| `frontend/assets/js/app-shell.js` | 단계 전환, 빠른 계산 실행, 결과 이동, live region 공지, 결과 제어 |
| `frontend/assets/js/script.js` | 기존 상태에서 요약 읽기, 추가 의료 항목 초기화, 보험 변경 시 재계산 |
| `frontend/assets/css/style-v3.css` | CTA 계층, 요약 칩, disclosure, 결과 제어의 반응형·접근성 스타일 |
| `tests/frontend_v3_shell.test.js` | 빠른 경로 순수 계약 테스트 |
| `tests/frontend_v3_browser.test.js` | 실제 Chrome 빠른 경로·고급 선택·초기화·반응형 회귀 |

## Task 1: 빠른 결과용 화면 구조와 접근성 마크업

**Files:**
- Modify: `frontend/index.html:112-535`
- Modify: `frontend/assets/css/style-v3.css:231-475, 554-600`

**Interfaces:**
- Consumes: `[data-step-panel]`, `[data-step-next]`, `#added_items_unified_list`, `#result_insurance_box`.
- Produces: `data-quick-result`, `data-open-advanced`, `#advanced-options`, `#selection-summary`, `#calculator-live-status`, `data-result-insurance`, `data-result-edit`, `data-reset-calculator`.

- [ ] **Step 1: 브라우저 테스트에 새 제어 요소 요구를 추가한다.**

```js
assert.ok(await evaluate(cdp, `document.querySelector('[data-quick-result]')?.textContent.includes('바로 결과')`));
assert.strictEqual(await evaluate(cdp, `document.getElementById('advanced-options').hidden`), true);
assert.strictEqual(await evaluate(cdp, `document.querySelector('[data-open-advanced]').getAttribute('aria-expanded')`), 'false');
assert.ok(await evaluate(cdp, `document.getElementById('selection-summary')?.tagName === 'ASIDE'`));
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다.**

Run: `node tests/frontend_v3_browser.test.js`

Expected: 새 `data-quick-result` 또는 `advanced-options` 요소가 없어 실패.

- [ ] **Step 3: 1단계 CTA와 선택 요약을 추가한다.**

기존 `data-step-next="2"` 버튼을 다음 두 버튼으로 교체한다. 첫 버튼은 기본 경로이고, 두 번째 버튼은 기존 2단계로만 이동한다.

```html
<div class="step-actions step-actions-primary">
    <button type="button" class="step-button step-button-primary" data-quick-result>바로 결과 보기</button>
    <button type="button" class="step-button step-button-secondary" data-step-next="2">검사·치료 항목 추가</button>
</div>
<aside id="selection-summary" class="selection-summary" aria-labelledby="selection-summary-title">
    <h3 id="selection-summary-title">현재 선택</h3>
    <div id="selection-summary-content"></div>
</aside>
<p id="calculator-live-status" class="sr-only" aria-live="polite"></p>
```

- [ ] **Step 4: 2단계의 보조 기능을 disclosure 아래로 이동한다.**

통합검색과 `#added_items_unified_list`는 계속 보인다. 상병코드, 분류 탭, 직접 선택, 기타 처치 영역만 아래 컨테이너로 감싼다.

```html
<button type="button" class="accordion-trigger" data-open-advanced aria-expanded="false" aria-controls="advanced-options">고급 항목 열기</button>
<div id="advanced-options" hidden>
    <!-- 기존 상병코드, 분류별 직접 선택, 기타 처치 마크업을 그대로 둔다. -->
</div>
```

2단계 CTA는 `선택 완료·결과 보기`로 바꾸고 `data-step-next="3"`은 유지한다.

- [ ] **Step 5: 결과 제어와 반응형 스타일을 추가한다.**

결과 카드 제목 아래에 아래 제어를 추가한다. `.selection-summary`, `.result-actions`, `.step-actions-primary`는 기존 spacing token을 사용하고, 375px에서는 세로 배치한다.

```html
<div class="result-actions">
    <button type="button" class="step-button step-button-secondary" data-result-insurance>보험 설정</button>
    <button type="button" class="step-button step-button-secondary" data-result-edit>조건 수정</button>
    <button type="button" class="step-button step-button-secondary" data-reset-calculator>처음부터</button>
</div>
```

- [ ] **Step 6: 화면 구조 테스트를 통과시킨다.**

Run: `node tests/frontend_v3_browser.test.js`

Expected: 새 요소, 44px 터치 영역, 375/768/1280px 가로 넘침 검사가 통과.

## Task 2: 빠른 경로·선택 요약·초기화 상태 연결

**Files:**
- Modify: `frontend/assets/js/app-shell.js:122-205`
- Modify: `frontend/assets/js/script.js:440-546, 2509-2519, 3077-3086`
- Modify: `tests/frontend_v3_shell.test.js`
- Modify: `tests/frontend_v3_browser.test.js:190-305`

**Interfaces:**
- Consumes: `window.requestCalculation()`, `window.MEDICostCalculator`.
- Produces: `MEDICostCalculator.getSelectionSummary()`, `MEDICostCalculator.resetCalculatorState()`, `MEDICostCalculator.hasCalculatedResult()`.

- [ ] **Step 1: 순수 빠른 경로 계약을 먼저 추가한다.**

```js
test('Given complete required selections, when quick result is requested, then step two is skipped', () => {
    assert.strictEqual(shell.getQuickResultTarget({ hospitalClass: 'clinic', treatmentType: 'outpatient', nonBenefitRegion: '11' }), 3);
});

test('Given a missing required selection, when quick result is requested, then it stays on step one', () => {
    assert.strictEqual(shell.getQuickResultTarget({ hospitalClass: '', treatmentType: 'outpatient', nonBenefitRegion: '11' }), 1);
});
```

- [ ] **Step 2: 실패를 확인한다.**

Run: `node tests/frontend_v3_shell.test.js`

Expected: `getQuickResultTarget is not a function`으로 실패.

- [ ] **Step 3: `app-shell.js`에 빠른 결과 흐름을 구현한다.**

`getQuickResultTarget`은 누락 필수값이 있으면 `1`, 아니면 `3`을 반환한다. `[data-quick-result]` 클릭은 `validateStepOne()` 성공 후 `requestCalculation()`, `showStep(3)`, 결과 카드 이동 순서로 처리한다.

```js
const behavior = root.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
root.document.querySelector('.result-card')?.scrollIntoView({ behavior, block: 'start' });
```

`[data-open-advanced]`는 `#advanced-options.hidden`과 `aria-expanded`를 함께 토글한다. 결과 제어는 각각 3단계, 1단계, 초기화 함수로 연결한다.

- [ ] **Step 4: `script.js`에 상태 읽기·초기화를 최소 공개한다.**

기존 `getRequiredCalculationSelections()`와 `addedTests`, `addedSurgeries`, `addedProcedures`로만 요약을 계산한다. 별도 저장 상태를 만들지 않는다.

```js
function getSelectionSummary() {
    const selections = getRequiredCalculationSelections();
    return {
        hospitalClass: selections.hospitalClass,
        treatmentType: selections.treatmentType,
        nonBenefitRegion: selections.nonBenefitRegion,
        sanjeongApplied: Boolean(getSanjeongSpecialInfo()),
        diseaseApplied: Boolean(document.getElementById('has_disease_code')?.checked),
        itemCount: addedTests.length + addedSurgeries.length + addedProcedures.length
    };
}
```

`resetCalculatorState()`는 폼 reset, 배열 3개와 ID counter 3개 초기화, `renderAddedItems()`, 검색 UI 초기화, `resultRequested = false`, `resetResultView()` 순으로 실행한다. 동의 설정과 `localStorage`는 건드리지 않는다. 비급여 기본 지역은 기존 초기화 로직으로 다시 선택한다.

보험 입력 변경은 결과가 이미 계산된 경우에만 `requestCalculation()`으로 즉시 반영한다. 나머지 입력 변경은 기존 `markResultStale()` 계약을 유지한다.

- [ ] **Step 5: 요약 렌더링과 초기화 focus를 구현한다.**

`app-shell.js`에서 `MEDICostCalculator.getSelectionSummary()`를 `#selection-summary-content`의 텍스트 칩으로 렌더링한다. 지역명은 `#nonbenefit_region`의 선택 option 텍스트를 사용한다. 초기화 후에는 아래를 실행한다.

```js
showStep(1, false);
root.document.querySelector('input[name="hospital_class"]')?.focus();
root.document.getElementById('calculator-live-status').textContent = '계산 조건을 처음 상태로 되돌렸습니다.';
```

- [ ] **Step 6: 브라우저 회귀 시나리오를 추가하고 통과시킨다.**

```js
document.querySelector('[data-quick-result]').click();
await waitFor(cdp, `!document.querySelector('[data-step-panel="3"]').hidden`);
assert.notStrictEqual(await evaluate(cdp, `document.getElementById('display_final_cost').textContent`), '0');

document.querySelector('[data-reset-calculator]').click();
assert.strictEqual(await evaluate(cdp, `document.querySelector('[data-step-panel="1"]').hidden`), false);
assert.strictEqual(await evaluate(cdp, `document.querySelectorAll('#added_items_unified_list .added-item').length`), 0);
```

Run: `node tests/frontend_v3_shell.test.js; node tests/frontend_v3_browser.test.js`

Expected: 빠른 경로가 2단계를 건너뛰며 고급 항목·보험 즉시 재계산·초기화·focus·live region이 통과.

## Task 3: 문구 정리와 전체 회귀 검증

**Files:**
- Modify: `frontend/index.html:112-535`
- Modify: `frontend/assets/js/script.js:468-513`
- Modify: `tests/frontend_v3_browser.test.js`

- [ ] **Step 1: 제거 대상 문구 검증을 추가한다.**

```js
const obsoleteCopy = await evaluate(cdp, `document.querySelector('.calculator-runtime').textContent.includes('결과보기 버튼을 눌러')`);
assert.strictEqual(obsoleteCopy, false);
```

- [ ] **Step 2: 실패를 확인한다.**

Run: `node tests/frontend_v3_browser.test.js`

Expected: 현재 3단계 안내 또는 빈 결과 문구 때문에 실패.

- [ ] **Step 3: 결과 재클릭 안내를 현재 흐름에 맞게 바꾼다.**

3단계 안내는 `실손보험을 적용하면 결과가 바로 다시 계산됩니다.`로 바꾼다. `resetResultView()`의 두 빈 결과 문구는 아래처럼 바꾼다.

```js
if (tableBody) tableBody.innerHTML = '<tr><td colspan="3" class="empty-row">필수 조건을 선택하면 예상 산출 내역이 표시됩니다.</td></tr>';
if (comparisonBody) comparisonBody.innerHTML = '<tr><td colspan="3" class="empty-row">필수 조건을 선택하면 병원 규모별 예상 범위를 비교합니다.</td></tr>';
```

`updateResultButtonState()`는 `필수 조건이 모두 선택되었습니다. 바로 결과 보기로 예상 병원비를 계산하세요.`를 사용한다.

- [ ] **Step 4: 정적·로직·Chrome 검증을 실행한다.**

Run: `node --check frontend/assets/js/app-shell.js; node --check frontend/assets/js/script.js; node tests/frontend_v3_shell.test.js; node tests/test_runner.js; node tests/frontend_v3_browser.test.js; git diff --check`

Expected: 모든 명령 exit code 0, Chrome QA가 콘솔 오류 없이 통과하고 `.codex-progress/browser-qa/results.json`에 375/768/1280px와 200% 확대 결과가 기록.

- [ ] **Step 5: 수동 Chrome 확인을 수행한다.**

1. 일반 외래 조건 3개만 선택하고 `바로 결과 보기`로 금액을 확인한다.
2. `검사·치료 항목 추가`에서 MRI를 추가하고 결과 변경을 확인한다.
3. `고급 항목 열기`를 키보드 Enter로 열고 상병코드 검색을 확인한다.
4. 보험 적용과 세대 변경 후 환급액 즉시 변경을 확인한다.
5. `처음부터` 후 추가 항목·결과는 초기화되고 동의 설정은 유지되는지 확인한다.

## 계획 자체 점검

- 빠른 결과, 선택적 고급 기능, 요약, 초기화, 보험 즉시 재계산, 접근성·반응형 요구를 Task 1~3에 모두 매핑했다.
- 계산 공식, 의료 데이터, 외부 API, D1 schema, 검색 매칭 수정은 포함하지 않았다.
- 미완성 표식이나 모호한 검증 지시는 없다.
- `script.js`에 중복 정의된 함수가 있으므로, 구현자는 마지막에 적용되는 정의를 확인하고 해당 정의만 수정한다.
