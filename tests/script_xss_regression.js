const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function createMockElement() {
    return {
        children: [],
        classList: {
            add() {},
            remove() {},
            toggle() {},
        },
        appendChild(child) {
            this.children.push(child);
            if (child && typeof child.innerHTML === 'string') {
                this.innerHTML += child.innerHTML;
            }
        },
        addEventListener() {},
        querySelector() { return null; },
        querySelectorAll() { return []; },
        focus() {},
        innerHTML: '',
        innerText: '',
        textContent: '',
        value: '',
        checked: false,
    };
}

const domStore = new Map();
function getElement(id) {
    if (!domStore.has(id)) {
        domStore.set(id, createMockElement());
    }
    return domStore.get(id);
}

global.window = {
    location: { pathname: '/' },
    trackGAEvent: () => {},
};

global.document = {
    addEventListener: () => {},
    getElementById: (id) => getElement(id),
    createElement: () => createMockElement(),
    querySelector: (selector) => {
        if (selector === 'input[name="hospital_class"]:checked') return { value: 'tertiary_hospital' };
        if (selector === 'input[name="treatment_type"]:checked') return { value: 'outpatient' };
        return null;
    },
    querySelectorAll: () => [],
};

global.alert = () => {};
global.fetch = undefined;
global.lucide = undefined;
global.setTimeout = () => 0;

const hiraCodesPath = path.join(__dirname, '..', 'frontend', 'assets', 'js', 'hira_codes.js');
const hiraCodesCode = fs.readFileSync(hiraCodesPath, 'utf8')
    .replace('const HIRA_DATABASE =', 'global.HIRA_DATABASE =')
    .replace('const KCD_DATABASE =', 'global.KCD_DATABASE =');
eval(hiraCodesCode);

const scriptPath = path.join(__dirname, '..', 'frontend', 'assets', 'js', 'script.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');
eval(`const HIRA_DATABASE = global.HIRA_DATABASE;\nconst KCD_DATABASE = global.KCD_DATABASE;\n${scriptCode}\n;globalThis.__setXssRegressionState = (tests, surgeries, procedures) => {\n    addedTests = tests;\n    addedSurgeries = surgeries;\n    addedProcedures = procedures;\n};`);

const malicious = '<img src=x onerror=alert(1)>';
const sourceItem = global.HIRA_DATABASE.find((item) => item && item.code) || global.HIRA_DATABASE[0];

const searchResults = getElement('search-results');
renderSearchResults(malicious, 'test', searchResults, [
    {
        ...sourceItem,
        name: malicious,
        keywords: [malicious],
        price: 1234,
        isBenefit: true,
    },
]);

assert.match(searchResults.innerHTML, /&lt;img src=x onerror=alert\(1\)&gt;/);
assert.doesNotMatch(searchResults.innerHTML, /<img src=x onerror=alert\(1\)>/);

global.addedTests = [
    {
        id: 1,
        typeName: '<svg onload=alert(2)>검사</svg>',
        categoryName: '<script>alert(3)</script>',
        count: 1,
        isBenefit: true,
        publicStatsSource: '<img src=x onerror=alert(4)>',
        publicFeeScheduleSource: '<iframe src=x></iframe>',
    },
];
global.addedSurgeries = [];
global.addedProcedures = [];
global.__setXssRegressionState(global.addedTests, global.addedSurgeries, global.addedProcedures);

const addedItems = getElement('added_items_unified_list');
renderAddedItems();

assert.match(addedItems.innerHTML, /&lt;svg onload=alert\(2\)&gt;검사&lt;\/svg&gt;/);
assert.match(addedItems.innerHTML, /&lt;script&gt;alert\(3\)&lt;\/script&gt;/);
assert.doesNotMatch(addedItems.innerHTML, /<svg onload=alert\(2\)>/);
assert.doesNotMatch(addedItems.innerHTML, /<script>alert\(3\)<\/script>/);
assert.doesNotMatch(addedItems.innerHTML, /<img src=x onerror=alert\(4\)>/);

console.log('xss regression checks passed');
