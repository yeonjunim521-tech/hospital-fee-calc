const assert = require('assert');
const fs = require('fs');
const path = require('path');

const frontend = path.join(__dirname, '..', 'frontend');
const pages = ['index.html', 'about.html', 'data-sources.html', 'privacy.html', 'contact.html'];

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
        assert.doesNotMatch(html, /<script[^>]+(?:analytics\.js|pagead2\.googlesyndication\.com)/i, name);
    }
});

test('메인 페이지는 v3.0, 단계형 계산기, 동의 설정과 환자 부담금 의미를 명시한다', () => {
    const html = readPage('index.html');
    assert.match(html, /MEDICost <span class="brand-version">v3\.0/);
    assert.match(html, /data-step-panel="1"/);
    assert.match(html, /data-step-panel="2"/);
    assert.match(html, /data-step-panel="3"/);
    assert.match(html, /data-step-next="3"/);
    assert.doesNotMatch(html, /id="btn-show-result"|id="result-ready-message"|data-focus-result/);
    assert.match(html, /실비 환급 전 예상 환자 부담금/);
    assert.match(html, /data-open-consent/);
    assert.doesNotMatch(html, /style=/i);
});

test('문의 안내는 채널과 의료상담을 만들어내지 않는다', () => {
    const html = readPage('contact.html');
    assert.match(html, /공식 문의 채널은 없습니다/);
    assert.match(html, /개인 의료상담/);
    assert.match(html, /환자정보/);
    assert.doesNotMatch(html, /mailto:|tel:/i);
});

test('필수 안내 페이지는 현재 위치를 탐색 메뉴에 표시한다', () => {
    for (const name of ['about.html', 'data-sources.html', 'privacy.html', 'contact.html']) {
        assert.match(readPage(name), /aria-current="page"/, name);
    }
});
