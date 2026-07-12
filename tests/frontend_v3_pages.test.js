const assert = require('assert');
const fs = require('fs');
const path = require('path');

const frontend = path.join(__dirname, '..', 'frontend');
const pages = ['index.html', 'about.html', 'data-sources.html', 'privacy.html', 'contact.html'];
const seoPages = [
    ['hospital-cost-calculator.html', 'hospital-cost-calculator', '병원비'],
    ['er-cost-calculator.html', 'er-cost-calculator', '응급실'],
    ['mri-cost-calculator.html', 'mri-cost-calculator', 'MRI'],
    ['ct-cost-calculator.html', 'ct-cost-calculator', 'CT'],
    ['endoscopy-cost-calculator.html', 'endoscopy-cost-calculator', '내시경'],
    ['hospitalization-cost-calculator.html', 'hospitalization-cost-calculator', '입원비'],
    ['noncovered-medical-cost.html', 'noncovered-medical-cost', '비급여']
];

function readPage(name) {
    return fs.readFileSync(path.join(frontend, name), 'utf8');
}

function test(name, run) {
    try {
        run();
        console.log(`  [PASS] ${name}`);
    } catch (error) {
        console.error(`  [FAIL] ${name}`);
        throw error;
    }
}

console.log('=== MEDICost v3.0 page contract ===');

test('지원 페이지는 UTF-8, canonical, 공통 탐색과 홈 복귀 경로를 제공한다', () => {
    for (const name of pages) {
        const html = readPage(name);
        assert.match(html, /<meta charset=["']?utf-8/i, name);
        assert.match(html, /rel="canonical"/, name);
        assert.match(html, /class="site-header"/, name);
        assert.match(html, /class="site-footer"/, name);
        assert.match(html, /href="\/?(?:#calculator)?"/, name);
        assert.doesNotMatch(html, /(?:癰|筌|揶|占쏙)/, name);
    }
});

test('초기 HTML은 계산 데이터, 분석, 광고 스크립트를 직접 로드하지 않는다', () => {
    const html = readPage('index.html');
    for (const source of [
        'hira_codes.js',
        'fee_schedule_items.js',
        'nonbenefit_data.js',
        'medical_statistics.js',
        'analytics.js',
        'pagead2.googlesyndication.com'
    ]) {
        assert.doesNotMatch(html, new RegExp(`<script[^>]+${source.replaceAll('.', '\\.')}`, 'i'), source);
    }
});

test('공개 HTML은 동의 전에 분석과 광고 스크립트를 직접 로드하지 않는다', () => {
    const htmlFiles = fs.readdirSync(frontend).filter(name => name.endsWith('.html') && !name.startsWith('admin-'));
    for (const name of htmlFiles) {
        const html = readPage(name);
        assert.doesNotMatch(html, /<script[^>]+(?:analytics\.js|pagead2\.googlesyndication\.com|t1\.kakaocdn\.net)/i, name);
    }
});

test('메인 페이지는 v3.0, 단계형 계산기, 동의 설정과 환자 부담금 의미를 명시한다', () => {
    const html = readPage('index.html');
    assert.match(html, /MEDICost <span class="brand-version">v3\.0/);
    assert.match(html, /data-step-panel="1"/);
    assert.match(html, /data-step-panel="2"/);
    assert.match(html, /data-step-panel="3"/);
    assert.match(html, /data-step-next="3"/);
    assert.match(html, /data-step-quick-result/);
    assert.match(html, />조건 선택<\/button>/);
    assert.match(html, /id="advanced-items-toggle"/);
    assert.match(html, /id="advanced-items-panel"/);
    assert.match(html, /id="selection-summary"/);
    assert.match(html, /id="result-insights"/);
    assert.match(html, /id="result-insights-drivers"/);
    assert.match(html, /id="result-insights-summary"/);
    assert.match(html, /data-reset-calculator/);
    assert.doesNotMatch(html, /data-open-insurance|data-edit-conditions/);
    assert.doesNotMatch(html, /id="btn-show-result"|id="result-ready-message"|data-focus-result/);
    assert.match(html, /실비 환급 전 예상 환자 부담금/);
    assert.match(html, /data-open-consent/);
    assert.doesNotMatch(html, /style=/i);
});

test('문의 안내는 채널과 의료상담을 만들어내지 않는다', () => {
    const html = readPage('contact.html');
    assert.match(html, /공식 문의 채널을 준비하고 있습니다/);
    assert.match(html, /개인 의료상담/);
    assert.match(html, /환자정보/);
    assert.doesNotMatch(html, /mailto:|tel:/i);
});

test('개인정보 안내는 최소수집과 30일 보유 기준을 명시한다', () => {
    const html = readPage('privacy.html');
    assert.match(html, /원시 검색어/);
    assert.match(html, /30일/);
    assert.match(html, /데이터 오류/);
    assert.match(html, /Kakao AdFit/);
});

test('필수 안내 페이지는 현재 위치를 탐색 메뉴에 표시한다', () => {
    for (const name of ['about.html', 'data-sources.html', 'privacy.html', 'contact.html']) {
        assert.match(readPage(name), /aria-current="page"/, name);
    }
});

test('공개 페이지 canonical은 운영 clean URL과 일치한다', () => {
    const supportPages = [
        ['about.html', 'about'],
        ['data-sources.html', 'data-sources'],
        ['privacy.html', 'privacy'],
        ['contact.html', 'contact']
    ];
    for (const [name, slug] of supportPages) {
        assert.match(readPage(name), new RegExp(`<link rel="canonical" href="https://hospital-fee-calc\\.pages\\.dev/${slug}"`), name);
    }
});

test('공개 SEO 페이지는 고유 한글 메타데이터와 검색용 본문을 제공한다', () => {
    for (const [name, slug, keyword] of seoPages) {
        const html = readPage(name);
        assert.match(html, /<meta charset=["']?utf-8/i, name);
        assert.match(html, /<meta name="robots" content="index, follow"/i, name);
        assert.match(html, new RegExp(`<link rel="canonical" href="https://hospital-fee-calc\\.pages\\.dev/${slug}"`), name);
        assert.match(html, new RegExp(`<title>[^<]*${keyword}`), name);
        assert.match(html, /<meta name="description" content="[^"]{20,}"/i, name);
        assert.match(html, new RegExp(`<h1[^>]*>[^<]*${keyword}`), name);
        assert.doesNotMatch(html, /(?:�|癰|沅|쑴|쎿)/, name);
        assert.match(html, /href="\/#calculator"/, `${name}: calculator CTA`);
        assert.ok((html.match(/class="ad-slot ad-slot--content"/g) || []).length >= 2, `${name}: content ad slots`);
        assert.strictEqual((html.match(/class="kakao_ad_area"/g) || []).length, 2, `${name}: Kakao ad slots`);
        assert.match(html, /data-ad-unit="DAN-dmM66J0Ueo0AkcLo"/);
        assert.match(html, /data-ad-unit="DAN-FwOH9Vn3dSU1pp97"/);
        assert.match(html, /id="consent-banner"/);
        assert.match(html, /data-open-consent/);
        assert.doesNotMatch(html, /(?:googlesyndication|pagead2\.googlesyndication\.com|t1\.kakaocdn\.net)/i, `${name}: direct ad script`);
    }
});

test('공개 SEO 페이지의 JSON-LD와 크롤링 파일은 대표 URL과 일치한다', () => {
    const sitemap = readPage('sitemap.xml');
    const robots = readPage('robots.txt');
    const llms = readPage('llms.txt');
    const key = readPage('medicost-pages-20260712.txt');

    for (const [name, slug] of seoPages) {
        const html = readPage(name);
        const canonical = `https://hospital-fee-calc.pages.dev/${slug}`;
        const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
        assert.ok(jsonLdBlocks.length > 0, `${name}: JSON-LD`);
        const structuredData = jsonLdBlocks.map(([, block]) => JSON.parse(block.trim()));
        assert.ok(structuredData.some((data) => data['@type'] === 'WebPage' && data['@id'] === `${canonical}#webpage` && data.url === canonical), `${name}: WebPage JSON-LD`);
        const faqPage = structuredData.find((data) => data['@type'] === 'FAQPage');
        const visibleFaqAnswers = [...html.matchAll(/<details><summary>[^<]+<\/summary><p>([^<]+)<\/p><\/details>/g)].map(([, answer]) => answer);
        assert.deepStrictEqual(faqPage.mainEntity.map((item) => item.acceptedAnswer.text), visibleFaqAnswers, `${name}: FAQ answer parity`);
        assert.match(sitemap, new RegExp(`<loc>${canonical.replaceAll('.', '\\.')}</loc>`), `${name}: sitemap`);
    }

    assert.match(robots, /Disallow: \/admin-search(?:\r?\n|$)/);
    assert.match(robots, /Disallow: \/admin-search\.html(?:\r?\n|$)/);
    assert.match(robots, /Disallow: \/admin-dashboard-prototype(?:\r?\n|$)/);
    assert.match(robots, /Sitemap: https:\/\/hospital-fee-calc\.pages\.dev\/sitemap\.xml/);
    assert.match(llms, /MEDICost/);
    assert.match(llms, /https:\/\/hospital-fee-calc\.pages\.dev\//);
    for (const [, url] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
        assert.match(llms, new RegExp(url.replaceAll('.', '\\.') ), `llms.txt: ${url}`);
    }
    assert.doesNotMatch(llms, /(?:�|癰|沅|쑴|쎿)/);
    assert.strictEqual(key.trim(), 'medicost-pages-20260712');
});
