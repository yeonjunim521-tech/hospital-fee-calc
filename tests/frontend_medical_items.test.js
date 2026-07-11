const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'frontend', 'admin-search.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'frontend', 'assets', 'js', 'script.js'), 'utf8');

const requiredAdminFields = [
    'item-id-input',
    'item-name-input',
    'item-category-input',
    'item-group-input',
    'item-type-input',
    'clinic-price-input',
    'hospital-price-input',
    'is-benefit-input',
    'source-url-input',
    'source-date-input',
    'keywords-input'
];

for (const id of requiredAdminFields) {
    assert(admin.includes(`id="${id}"`), `관리자 입력 필드 누락: ${id}`);
}

assert(admin.includes('승인하면 공개 검색 DB에 즉시 반영됩니다.'), '승인 효과 안내 문구가 필요합니다.');
assert(admin.includes('clinicPrice: clinicPrice'), '의원 가격이 승인 요청에 포함되어야 합니다.');
assert(admin.includes('hospitalPrice: hospitalPrice'), '병원 가격이 승인 요청에 포함되어야 합니다.');
assert(admin.includes('sourceUrl: sourceUrl'), '공식 출처 URL이 승인 요청에 포함되어야 합니다.');
assert(admin.includes('keywords: keywords'), '검색 키워드가 승인 요청에 포함되어야 합니다.');

assert(script.includes("fetch('/api/medical-items'"), '공개 의료 항목 API를 불러와야 합니다.');
assert(script.includes('await loadMedicalItemsOverlay();'), '초기화 전에 공개 항목을 로드해야 합니다.');
assert(script.includes('medicalItemsOverlay'), '공개 항목 오버레이 상태가 필요합니다.');
assert(script.includes('itemsByCode.set(item.code, item)'), '같은 코드의 공개 항목이 정적 항목을 덮어써야 합니다.');

const overlayBlock = script.slice(
    script.indexOf('let medicalItemsOverlay = []'),
    script.indexOf('function resolveProviderPrice')
);
const createDatabaseHarness = new Function(
    'HIRA_DATABASE',
    'window',
    `${overlayBlock}\nreturn { getMedicalItemDatabase, setOverlay(items) { medicalItemsOverlay = items; } };`
);
const harness = createDatabaseHarness(
    [{ code: 'A', name: '정적 A' }, { code: 'B', name: '정적 B' }],
    { PUBLIC_FEE_SCHEDULE_ITEMS: { items: [{ code: 'C', name: '공개 C' }] } }
);
harness.setOverlay([{ code: 'A', name: '승인 A' }]);
const merged = harness.getMedicalItemDatabase();
assert.strictEqual(merged.length, 3, '정적·공개·승인 항목이 코드 기준으로 병합되어야 합니다.');
assert.strictEqual(merged.find(item => item.code === 'A').name, '승인 A', '승인 항목이 같은 코드의 정적 항목보다 우선해야 합니다.');

console.log('PASS: 관리자 실제 항목 입력 및 공개 DB 오버레이 계약');
