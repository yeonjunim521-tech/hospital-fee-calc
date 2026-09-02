const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const estimator = require(path.join(root, 'frontend', 'assets', 'js', 'medical-estimator.js'));

const session = (sessionId, overrides = {}) => ({
    anesthesia: {
        sessionId,
        type: 'general',
        durationMinutes: 60,
        ageGroup: 'adult',
        sedation: false,
        ...overrides
    }
});

{
    const result = estimator.estimateAnesthesia([
        session('shared', { durationMinutes: 120 }),
        session('shared', { durationMinutes: 120 })
    ], 'hospital');
    assert.equal(result.total, 127470 + (24520 * 4), '같은 마취 회차는 기본료를 한 번만 산정해야 합니다.');
    assert.equal(result.episodes.length, 1);
}

{
    const result = estimator.estimateAnesthesia([session('first'), session('second')], 'hospital');
    assert.equal(result.total, 127470 * 2, '별도 마취 회차는 회차마다 기본료를 산정해야 합니다.');
    assert.equal(result.episodes.length, 2);
}

{
    const local = estimator.estimateAnesthesia([session('local', { type: 'local' })], 'hospital');
    assert.equal(local.total, 0, '단순 국소마취는 수술·처치료에 포함되어 별도 산정하지 않습니다.');

    const generalWithSedation = estimator.estimateAnesthesia([session('general', { sedation: true })], 'hospital');
    assert.equal(generalWithSedation.total, 127470, '전신마취와 MAC 진정관리료를 중복 산정하면 안 됩니다.');

    const mac = estimator.estimateAnesthesia([
        session('mac', { type: 'local', durationMinutes: 45, sedation: true })
    ], 'hospital');
    assert.equal(mac.total, 109000 + 24520, 'MAC은 기본 30분과 초과 15분 단위로 산정해야 합니다.');
}

{
    const newborn = estimator.estimateAnesthesia([
        session('newborn', { ageGroup: 'newborn' })
    ], 'hospital');
    assert.equal(newborn.total, Math.round(127470 * 1.6), '신생아 마취료 60% 가산을 반영해야 합니다.');
}

const fixtureItems = [
    { code: 'FEE_G1', name: '슬관절1매', category: 'imaging', hospitalPrice: 100, clinicPrice: 120, isBenefit: true },
    { code: 'FEE_G2', name: '슬관절2매', category: 'imaging', hospitalPrice: 200, clinicPrice: 220, isBenefit: true },
    { code: 'FEE_G3', name: '슬관절3매', category: 'imaging', hospitalPrice: 300, clinicPrice: 320, isBenefit: true },
    { code: 'FEE_G4', name: '슬관절 C-Arm형 영상증폭장치이용료', category: 'imaging', hospitalPrice: 999, clinicPrice: 999, isBenefit: true },
    { code: 'FEE_N1', name: '슬개골골절도수정복술', category: 'surgery', hospitalPrice: 100000, clinicPrice: 120000, isBenefit: true },
    { code: 'FEE_N2', name: '슬개골골절관혈적정복술', category: 'surgery', hospitalPrice: 400000, clinicPrice: 450000, isBenefit: true }
];

{
    const items = estimator.createConsumerEstimateItems('무릎 엑스레이', fixtureItems, 'hospital');
    assert.equal(items.length, 1);
    assert.equal(items[0].price, 200);
    assert.deepEqual(items[0].estimateRange, { min: 100, max: 300 });
    assert.equal(items[0].estimateSampleCount, 3, '특수촬영·C-Arm은 일반 엑스레이 중앙값에서 제외해야 합니다.');
}

{
    const items = estimator.createConsumerEstimateItems('무릎 골절', fixtureItems, 'hospital');
    assert.equal(items.length, 3, '골절은 수술·비수술·잘 모름 선택지를 제공해야 합니다.');
    assert.equal(items.find(item => item.estimateBucket === 'surgery').price, 400000);
    assert.equal(items.find(item => item.estimateBucket === 'nonsurgery').price, 100000);
    assert.equal(items.find(item => item.estimateBucket === 'unknown').price, 250000);
}

{
    const admin = fs.readFileSync(path.join(root, 'frontend', 'admin-search.html'), 'utf8');
    const adminScript = fs.readFileSync(path.join(root, 'frontend', 'assets', 'js', 'admin-search.js'), 'utf8');
    const adminStyles = fs.readFileSync(path.join(root, 'frontend', 'assets', 'css', 'admin-search.css'), 'utf8');
    assert.match(admin, /결과가 없었던 검색어/);
    assert.match(admin, /추가 완료 이력/);
    assert.match(admin, /방문자가 검색한 전체 검색어/);
    assert.match(admin, /날짜별 방문 흐름/);
    assert.match(adminScript, /period:\s*'7'/);
    assert.match(adminStyles, /\.table-scroll\s*\{\s*overflow-x:\s*auto/);
}

{
    const context = { window: {} };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(root, 'frontend', 'assets', 'js', 'fee_schedule_items.js'), 'utf8'), context);
    const items = context.window.PUBLIC_FEE_SCHEDULE_ITEMS.items;
    ['FEE_HE118', 'FEE_HE120', 'FEE_HE121', 'FEE_HE123'].forEach(code => {
        assert.ok(items.some(item => item.code === code), `${code} 하지 MRI 공식 수가가 필요합니다.`);
    });
    ['척추 엑스레이', '흉부 엑스레이', '두개골 엑스레이'].forEach(query => {
        assert.equal(estimator.createConsumerEstimateItems(query, items, 'hospital').length, 1, `${query} 중앙값이 필요합니다.`);
    });
    ['고관절 골절', '척추 골절', '흉부 골절', '두개골 골절'].forEach(query => {
        assert.ok(estimator.createConsumerEstimateItems(query, items, 'hospital').length >= 1, `${query} 중앙값이 필요합니다.`);
    });
}

console.log('PASS: 의료수가 중앙값·마취 회차 계산 계약');
