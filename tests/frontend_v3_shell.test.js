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
    assert.deepStrictEqual(parsed, { analytics: false, ads: false, updatedAt: null });
});

test('Given malformed consent, when parsed, then it fails closed', () => {
    const parsed = consent.parseConsent('{"analytics":"yes","ads":true}');
    assert.deepStrictEqual(parsed, { analytics: false, ads: false, updatedAt: null });
});

test('Given accepted analytics only, when checked, then ads remain blocked', () => {
    const value = { analytics: true, ads: false, updatedAt: '2026-07-11T00:00:00.000Z' };
    assert.strictEqual(consent.canLoadAnalytics(value), true);
    assert.strictEqual(consent.canLoadAds(value), false);
});

test('Given optional tracking is withdrawn, when consent is applied, then loaded optional scripts are removed', () => {
    const consentSource = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'assets', 'js', 'consent.js'), 'utf8');
    assert.match(consentSource, /syncScript/);
    assert.match(consentSource, /medicost-analytics/);
    assert.match(consentSource, /medicost-analytics-loader/);
    assert.match(consentSource, /medicost-kakao-ads/);
    assert.match(consentSource, /t1\.kakaocdn\.net\/kas\/static\/ba\.min\.js/);
    assert.match(consentSource, /kakao_ad_area/);
    assert.doesNotMatch(consentSource, /medicost-ads/);
    assert.match(consentSource, /existing\.remove\(\)/);
});

test('Given a search event, when analytics is sent, then raw search terms are not included', () => {
    const scriptSource = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'assets', 'js', 'script.js'), 'utf8');
    assert.doesNotMatch(scriptSource, /search_term\s*:/);
});

test('Given missing required selections, when validated, then exact labels are returned', () => {
    const missing = shell.getMissingRequiredSelections({ hospitalClass: '', treatmentType: 'er', nonBenefitRegion: '' });
    assert.deepStrictEqual(missing, ['병원 등급', '비급여 기준 지역']);
});

test('Given calculator assets, when requested, then first-step data loads before deferred search statistics', () => {
    assert.deepStrictEqual(shell.CALCULATOR_SCRIPTS, [
        'assets/js/hira_codes.js',
        'assets/js/nonbenefit_data.js',
        'assets/js/script.js'
    ]);
    assert.deepStrictEqual(shell.DEFERRED_CALCULATOR_SCRIPTS, [
        'assets/js/fee_schedule_items.js',
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
