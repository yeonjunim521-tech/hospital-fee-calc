const assert = require('assert');

let telemetry = null;
try {
    telemetry = require('../frontend/assets/js/search-telemetry.js');
} catch (_error) {
    // The assertion below reports the missing production module as the expected RED failure.
}

assert.ok(telemetry, 'search telemetry payload builder must exist');

assert.deepStrictEqual(
    telemetry.buildSearchLogPayload('  Brain   MRI  ', 3.4, '/hospital-cost-calculator'),
    {
        query: 'Brain MRI',
        resultCount: 3,
        path: '/hospital-cost-calculator'
    }
);

assert.deepStrictEqual(
    telemetry.buildSearchClickPayload('  Brain   MRI  ', {
        publicActionCode: 'HE101',
        name: '뇌 MRI'
    }, '/hospital-cost-calculator'),
    {
        searchQuery: 'Brain MRI',
        clickedItemId: 'HE101',
        clickedItemName: '뇌 MRI',
        path: '/hospital-cost-calculator'
    }
);

assert.equal(telemetry.buildSearchLogPayload(' ', 1, '/'), null);
assert.equal(telemetry.buildSearchClickPayload('brain mri', {}, '/'), null);

console.log('PASS: 실제 검색어·클릭 항목 telemetry payload 계약');
