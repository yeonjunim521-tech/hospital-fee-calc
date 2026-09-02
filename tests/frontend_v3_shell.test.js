const assert = require('assert');
const fs = require('fs');
const path = require('path');

const consent = require('../frontend/assets/js/consent.js');
const shell = require('../frontend/assets/js/app-shell.js');

function test(name, run) {
    try {
        run();
        console.log(`  [PASS] ${name}`);
    } catch (error) {
        console.error(`  [FAIL] ${name}`);
        throw error;
    }
}

console.log('=== MEDICost v3.0 shell contract ===');

test('Given no saved consent, when parsed, then optional categories stay disabled', () => {
    const parsed = consent.parseConsent(null);
    assert.strictEqual(consent.STORAGE_KEY, 'medicost-consent-v3');
    assert.deepStrictEqual(parsed, { enhancedFeatures: false, analytics: false, updatedAt: null });
});

test('Given malformed consent, when parsed, then it fails closed', () => {
    const parsed = consent.parseConsent('{"analytics":"yes","ads":true}');
    assert.deepStrictEqual(parsed, { enhancedFeatures: false, analytics: false, updatedAt: null });
});

test('Given legacy consent, when parsed, then exact-search collection fails closed until a new choice', () => {
    const value = { analytics: true, ads: false, updatedAt: '2026-07-11T00:00:00.000Z' };
    assert.deepStrictEqual(consent.parseConsent(JSON.stringify(value)), { enhancedFeatures: false, analytics: false, updatedAt: null });
});

test('Given current consent, when parsed, then enhanced features and external analytics stay independent', () => {
    const value = { enhancedFeatures: true, analytics: false, updatedAt: '2026-08-30T00:00:00.000Z' };
    assert.deepStrictEqual(consent.parseConsent(JSON.stringify(value)), value);
    assert.strictEqual(consent.canUseEnhancedFeatures(value), true);
    assert.strictEqual(consent.canLoadAnalytics(value), false);
});

test('Given optional analytics is withdrawn, when consent is applied, then loaded analytics scripts are removed', () => {
    const consentSource = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'assets', 'js', 'consent.js'), 'utf8');
    assert.match(consentSource, /syncScript/);
    assert.match(consentSource, /medicost-analytics/);
    assert.match(consentSource, /medicost-analytics-loader/);
    assert.doesNotMatch(consentSource, /medicost-kakao-ads|t1\.kakaocdn\.net|kakao_ad_area|canLoadAds/);
    assert.doesNotMatch(consentSource, /medicost-ads/);
    assert.match(consentSource, /existing\.remove\(\)/);
});

test('Given an enhanced search, when operational telemetry is sent, then the exact term is included without identity fields', () => {
    const scriptSource = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'assets', 'js', 'script.js'), 'utf8');
    const searchLogSource = scriptSource.match(/async function sendSearchLog[\s\S]*?function compactSelectedItems/)?.[0] || '';
    assert.match(searchLogSource, /query: payload\.query,\s*resultCount: payload\.resultCount,\s*operationalConsent: true/);
    assert.match(scriptSource, /const pendingSearchLogs = new Map\(\)/);
    assert.doesNotMatch(searchLogSource, /userAgent|visitorId|sessionId/);
    assert.doesNotMatch(scriptSource, /sendSearchClickLog|\/api\/search-click/);
});

test('Given basic-only use, when the shell is rendered, then required calculation stays available and optional step is gated', () => {
    const shellSource = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'assets', 'js', 'app-shell.js'), 'utf8');
    const pageSource = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'index.html'), 'utf8');
    assert.match(shellSource, /step === 2 && !hasEnhancedFeatureAccess/);
    assert.match(shellSource, /prepareBasicCalculation/);
    assert.match(pageSource, /data-step-basic-result>필수 조건으로 계산/);
    assert.match(pageSource, /data-step-next="2">선택 조건 추가/);
    assert.match(pageSource, /\[필수\] 프로토타입 선택 기능 데이터 수집 동의/);
    assert.match(pageSource, /\[선택\] Google Analytics/);
    assert.match(pageSource, /동의하지 않고 기본 계산/);
    assert.match(shellSource, /자체 방문·검색 통계 수집에 동의한 경우/);
});

test('Given a direct medical-item selection, when it is added, then search analytics are not polluted', () => {
    const scriptSource = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'assets', 'js', 'script.js'), 'utf8');
    const directSelectBlock = scriptSource.slice(
        scriptSource.indexOf('function handleDirectSelectChange'),
        scriptSource.indexOf('function renderRecommendChips')
    );
    const hierarchicalBlock = scriptSource.slice(
        scriptSource.indexOf('function renderHierarchicalItemsList'),
        scriptSource.indexOf('function toggleDiseaseCodeSection')
    );

    assert.doesNotMatch(directSelectBlock, /sendSearch(?:Log|ClickLog)\(/);
    assert.doesNotMatch(hierarchicalBlock, /sendSearch(?:Log|ClickLog)\(/);
    assert.doesNotMatch(scriptSource, /sendSearchClickLog\(\s*['"]{2}\s*,/);
});

test('Given missing required selections, when validated, then exact labels are returned', () => {
    const missing = shell.getMissingRequiredSelections({ hospitalClass: '', treatmentType: 'er', nonBenefitRegion: '' });
    assert.deepStrictEqual(missing, ['병원 등급', '비급여 기준 지역']);
});

test('Given calculator assets, when requested, then first-step data loads before deferred search statistics', () => {
    assert.deepStrictEqual(shell.CALCULATOR_SCRIPTS, [
        'assets/js/hira_codes.js',
        'assets/js/nonbenefit_data.js',
        'assets/js/fee_schedule_items.js',
        'assets/js/medical-estimator.js',
        'assets/js/search-telemetry.js',
        'assets/js/script.js'
    ]);
    assert.deepStrictEqual(shell.DEFERRED_CALCULATOR_SCRIPTS, [
        'assets/js/medical_statistics.js'
    ]);
});

test('Given a calculator hash, when route is checked, then eager loading is requested', () => {
    assert.strictEqual(shell.shouldLoadForHash('#calculator'), true);
    assert.strictEqual(shell.shouldLoadForHash('#faq'), false);
});

test('Given reduced motion preference, when result scrolling is requested, then instant scrolling is selected', () => {
    assert.strictEqual(shell.getResultScrollBehavior({ matches: true }), 'auto');
    assert.strictEqual(shell.getResultScrollBehavior({ matches: false }), 'smooth');
});
