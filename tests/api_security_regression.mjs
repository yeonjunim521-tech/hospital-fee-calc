import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const { onRequest: adminMiddleware } = await import('../functions/_middleware.ts');
const { onRequestGet: getTopSearches } = await import('../functions/api/top-searches.ts');
const { onRequestPost: logSearchClick } = await import('../functions/api/search-click.ts');
const { onRequestPost: logSearch } = await import('../functions/api/search-log.ts');
const { onRequestPost: logCalculation } = await import('../functions/api/calculation-log.ts');
const { onRequestPost: purgeTelemetry } = await import('../functions/api/admin/purge-telemetry.ts');
const { onRequestGet: getSearchStats } = await import('../functions/api/admin/search-stats.ts');
const { containsPersonalData } = await import('../functions/api/telemetry.ts');

const basicAuthorization = `Basic ${Buffer.from('admin:secret').toString('base64')}`;

function adminContext(request) {
  return {
    request,
    env: { ADMIN_BASIC_AUTH: 'admin:secret' },
    next: () => new Response('next', { status: 200 }),
  };
}

function createClickDatabase() {
  let rateCount = 0;
  let clickWrites = 0;
  let lastClickValues = [];
  let searchWrites = 0;
  let lastSearchValues = [];

  return {
    database: {
      prepare(sql) {
        const values = [];
        return {
          bind(...params) {
            values.push(...params);
            return this;
          },
          async first() {
            if (sql.includes('telemetry_rate_limits')) {
              rateCount += 1;
              return { event_count: rateCount };
            }
            return null;
          },
          async run() {
            if (sql.includes('INSERT INTO search_click_logs')) {
              clickWrites += 1;
              lastClickValues = values;
            }
            if (sql.includes('INSERT INTO search_logs')) {
              searchWrites += 1;
              lastSearchValues = values;
            }
            return { success: true };
          },
        };
      },
    },
    clickWrites: () => clickWrites,
    lastClickValues: () => lastClickValues,
    searchWrites: () => searchWrites,
    lastSearchValues: () => lastSearchValues,
  };
}

async function run(name, callback) {
  try {
    await callback();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

await run('rejects cross-origin authenticated admin mutations', async () => {
  const response = await adminMiddleware(adminContext(new Request('https://example.test/api/admin/delete-log', {
    method: 'POST',
    headers: {
      Authorization: basicAuthorization,
      Origin: 'https://attacker.test',
      'Content-Type': 'application/json',
    },
  })));

  assert.equal(response.status, 403);
});

await run('allows same-origin authenticated admin mutations to reach their handler', async () => {
  const response = await adminMiddleware(adminContext(new Request('https://example.test/api/admin/delete-log', {
    method: 'POST',
    headers: {
      Authorization: basicAuthorization,
      Origin: 'https://example.test',
      'Content-Type': 'application/json',
    },
  })));

  assert.equal(response.status, 200);
});

await run('protects extensionless administrator routes', async () => {
  const response = await adminMiddleware(adminContext(new Request('https://example.test/admin-search')));

  assert.equal(response.status, 401);
});

await run('does not expose raw search terms through the public popular-search endpoint', async () => {
  const response = await getTopSearches({
    env: {
      DB: {
        prepare() {
          return {
            async all() {
              return {
                results: [{
                  query: '희귀 질환 이름',
                  normalized_query: '희귀 질환 이름',
                  search_count: 5,
                }],
              };
            },
          };
        },
      },
    },
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body.topSearches, [{ searchCount: 5 }]);
  assert.doesNotMatch(JSON.stringify(body), /희귀 질환 이름/);
});

await run('does not expose D1 errors through the public popular-search endpoint', async () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  let response;
  try {
    response = await getTopSearches({
      env: {
        DB: {
          prepare() {
            return {
              async all() {
                throw new Error('no such table: search_logs');
              },
            };
          },
        },
      },
    });
  } finally {
    console.error = originalConsoleError;
  }
  const body = await response.json();

  assert.equal(response.status, 500);
  assert.equal(body.detail, undefined);
  assert.doesNotMatch(JSON.stringify(body), /search_logs/);
});

await run('stores the real normalized search query without user-agent data', async () => {
  const state = createClickDatabase();
  const response = await logSearch({
    request: new Request('https://example.test/api/search-log', {
      method: 'POST',
      headers: {
        'CF-Connecting-IP': '203.0.113.8',
        'Content-Type': 'application/json',
        'User-Agent': 'must-not-be-stored',
      },
      body: JSON.stringify({
        query: '  Brain   MRI  ',
        resultCount: 3,
        path: '/hospital-cost-calculator',
      }),
    }),
    env: { DB: state.database },
  });

  assert.equal(response.status, 200);
  assert.equal(state.searchWrites(), 1);
  assert.deepEqual(state.lastSearchValues(), ['Brain MRI', 'brain mri', 3, '/hospital-cost-calculator']);
});

await run('stores the searched query and clicked medical item', async () => {
  const state = createClickDatabase();
  const response = await logSearchClick({
    request: new Request('https://example.test/api/search-click', {
      method: 'POST',
      headers: {
        'CF-Connecting-IP': '203.0.113.8',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchQuery: '  Brain   MRI  ',
        clickedItemId: 'HE101',
        clickedItemName: '뇌 MRI',
        path: '/hospital-cost-calculator',
      }),
    }),
    env: { DB: state.database },
  });

  assert.equal(response.status, 200);
  assert.equal(state.clickWrites(), 1);
  assert.deepEqual(state.lastClickValues(), ['Brain MRI', 'brain mri', 'HE101', '뇌 MRI', '/hospital-cost-calculator']);
});

await run('rejects personal data in click telemetry before writing analytics', async () => {
  const state = createClickDatabase();
  const response = await logSearchClick({
    request: new Request('https://example.test/api/search-click', {
      method: 'POST',
      headers: {
        'CF-Connecting-IP': '203.0.113.8',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        searchQuery: '010-1234-5678',
        clickedItemId: 'IM_MR01',
        clickedItemName: '뇌 MRI',
        path: '/hospital-cost-calculator',
      }),
    }),
    env: { DB: state.database },
  });

  assert.equal(response.status, 400);
  assert.equal(state.clickWrites(), 0);
});

await run('rejects personal data in every persisted search and click field', async () => {
  const cases = [
    {
      handler: logSearch,
      body: { query: 'brain mri', resultCount: 1, path: '/patient@example.com' },
      writeCount: state => state.searchWrites(),
    },
    {
      handler: logSearch,
      body: { query: '010(1234)5678', resultCount: 1, path: '/hospital-cost-calculator' },
      writeCount: state => state.searchWrites(),
    },
    {
      handler: logSearch,
      body: { query: '홍길동@example.com', resultCount: 1, path: '/hospital-cost-calculator' },
      writeCount: state => state.searchWrites(),
    },
    {
      handler: logSearchClick,
      body: {
        searchQuery: 'brain mri',
        clickedItemId: '123456-1234567',
        clickedItemName: '뇌 MRI',
        path: '/hospital-cost-calculator',
      },
      writeCount: state => state.clickWrites(),
    },
    {
      handler: logSearchClick,
      body: {
        searchQuery: 'brain mri',
        clickedItemId: 'HE101',
        clickedItemName: '환자@예시.한국',
        path: '/hospital-cost-calculator',
      },
      writeCount: state => state.clickWrites(),
    },
    {
      handler: logSearchClick,
      body: {
        searchQuery: 'brain mri',
        clickedItemId: 'HE101',
        clickedItemName: '뇌 MRI',
        path: '/010.1234.5678',
      },
      writeCount: state => state.clickWrites(),
    },
  ];

  for (const testCase of cases) {
    const state = createClickDatabase();
    const response = await testCase.handler({
      request: new Request('https://example.test/api/telemetry', {
        method: 'POST',
        headers: { 'CF-Connecting-IP': '203.0.113.8', 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.body),
      }),
      env: { DB: state.database },
    });

    assert.equal(response.status, 400);
    assert.equal(testCase.writeCount(state), 0);
  }
});

await run('rejects unhyphenated phone numbers in both search telemetry endpoints', async () => {
  const clickState = createClickDatabase();
  const clickResponse = await logSearchClick({
    request: new Request('https://example.test/api/search-click', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '203.0.113.8', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        searchQuery: '01012345678',
        clickedItemId: 'HE101',
        clickedItemName: '뇌 MRI',
        path: '/hospital-cost-calculator',
      }),
    }),
    env: { DB: clickState.database },
  });
  let searchWrites = 0;
  const searchResponse = await logSearch({
    request: new Request('https://example.test/api/search-log', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '203.0.113.8', 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '01012345678', resultCount: 1, path: '/hospital-cost-calculator' }),
    }),
    env: {
      DB: {
        prepare() {
          return {
            bind() {
              return this;
            },
            async run() {
              searchWrites += 1;
              return { success: true };
            },
          };
        },
      },
    },
  });

  assert.equal(clickResponse.status, 400);
  assert.equal(clickState.clickWrites(), 0);
  assert.equal(searchResponse.status, 400);
  assert.equal(searchWrites, 0);
});

await run('detects resident numbers, phone numbers, and email addresses before storage', async () => {
  assert.equal(containsPersonalData('123456-1234567'), true);
  assert.equal(containsPersonalData('123456 1234567'), true);
  assert.equal(containsPersonalData('010-1234-5678'), true);
  assert.equal(containsPersonalData('010.1234.5678'), true);
  assert.equal(containsPersonalData('010 1234 5678'), true);
  assert.equal(containsPersonalData('010(1234)5678'), true);
  assert.equal(containsPersonalData('+82 (10) 1234-5678'), true);
  assert.equal(containsPersonalData('01012345678'), true);
  assert.equal(containsPersonalData('patient@example.com'), true);
  assert.equal(containsPersonalData('홍길동@example.com'), true);
  assert.equal(containsPersonalData('환자@예시.한국'), true);
  assert.equal(containsPersonalData('brain mri'), false);
});

await run('rate limits public click logging after storing 30 valid item selections', async () => {
  const state = createClickDatabase();

  for (let index = 0; index < 30; index += 1) {
    const response = await logSearchClick({
      request: new Request('https://example.test/api/search-click', {
        method: 'POST',
        headers: {
          'CF-Connecting-IP': '203.0.113.8',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery: 'brain mri',
          clickedItemId: 'HE101',
          clickedItemName: '뇌 MRI',
          path: '/hospital-cost-calculator',
        }),
      }),
      env: { DB: state.database },
    });
    assert.equal(response.status, 200);
  }

  const blocked = await logSearchClick({
    request: new Request('https://example.test/api/search-click', {
      method: 'POST',
      headers: {
        'CF-Connecting-IP': '203.0.113.8',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchQuery: 'brain mri',
        clickedItemId: 'HE101',
        clickedItemName: '뇌 MRI',
        path: '/hospital-cost-calculator',
      }),
    }),
    env: { DB: state.database },
  });

  assert.equal(blocked.status, 429);
  assert.equal(state.clickWrites(), 30);
  assert.deepEqual(state.lastClickValues(), ['brain mri', 'brain mri', 'HE101', '뇌 MRI', '/hospital-cost-calculator']);
});

await run('reports clicked item rankings and filters legacy aggregate search rows', async () => {
  const preparedSql = [];
  const response = await getSearchStats({
    request: new Request('https://example.test/api/admin/search-stats?period=30'),
    env: {
      DB: {
        prepare(sql) {
          preparedSql.push(sql);
          return {
            bind() {
              return this;
            },
            async all() {
              if (sql.includes('clicked_item_id') && sql.includes('GROUP BY')) {
                return {
                  results: [{
                    clicked_item_id: 'HE101',
                    clicked_item_name: '뇌 MRI',
                    normalized_query: 'brain mri',
                    path: '/hospital-cost-calculator',
                    click_count: 4,
                    last_clicked_at: '2026-08-26 08:00:00',
                  }],
                };
              }
              if (sql.includes('COUNT(*) AS click_count')) {
                return { results: [{ click_count: 7 }] };
              }
              return { results: [] };
            },
          };
        },
      },
    },
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body.clickedItems, [{
    clicked_item_id: 'HE101',
    clicked_item_name: '뇌 MRI',
    normalized_query: 'brain mri',
    path: '/hospital-cost-calculator',
    click_count: 4,
    last_clicked_at: '2026-08-26 08:00:00',
  }]);
  assert.equal(body.clickCount, 7);
  assert.equal(
    preparedSql.filter(sql => sql.includes('FROM search_logs')).every(sql => sql.includes("normalized_query <> 'aggregate'")),
    true,
  );
  assert.equal(
    preparedSql.filter(sql => sql.includes('FROM search_click_logs')).every(sql => sql.includes("normalized_query <> 'aggregate'")),
    true,
  );
  assert.equal(
    preparedSql.filter(sql => sql.includes('FROM search_logs')).every(sql => !sql.includes('user_agent')),
    true,
  );
});

await run('returns click details for the requested normalized query', async () => {
  const prepared = [];
  const response = await getSearchStats({
    request: new Request('https://example.test/api/admin/search-stats?period=30&query=Brain%20MRI'),
    env: {
      DB: {
        prepare(sql) {
          const statement = {
            sql,
            values: [],
            bind(...values) {
              this.values = values;
              return this;
            },
            async all() {
              return {
                results: [{
                  clicked_item_id: 'HE101',
                  clicked_item_name: '뇌 MRI',
                  normalized_query: 'brain mri',
                  path: '/hospital-cost-calculator',
                  click_count: 1,
                  last_clicked_at: '2026-08-26 08:00:00',
                }],
              };
            },
          };
          prepared.push(statement);
          return statement;
        },
      },
    },
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(prepared.length, 1);
  assert.match(prepared[0].sql, /normalized_query = \?/);
  assert.deepEqual(prepared[0].values, ['-30 days', 'brain mri']);
  assert.equal(body.query, 'brain mri');
  assert.equal(body.clickedItems.length, 1);
});

await run('declares the durable click rate-limit table in the D1 schema', async () => {
  const schema = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');
  assert.match(schema, /CREATE TABLE IF NOT EXISTS telemetry_rate_limits/);
  assert.match(schema, /idx_telemetry_rate_limits_window_started_at/);
});

await run('resets rate-limit counters by hourly window and schedules daily retention', async () => {
  const telemetrySource = await readFile(new URL('../functions/api/telemetry.ts', import.meta.url), 'utf8');
  const workerConfig = await readFile(new URL('../automation/telemetry-retention/wrangler.toml', import.meta.url), 'utf8');
  const workerSource = await readFile(new URL('../automation/telemetry-retention/src/index.ts', import.meta.url), 'utf8');

  assert.match(telemetrySource, /window_started_at = CASE/);
  assert.match(telemetrySource, /THEN 1/);
  assert.match(workerConfig, /\[triggers\]/);
  assert.match(workerConfig, /crons = \["0 3 \* \* \*"\]/);
  assert.match(workerSource, /async scheduled/);
});

await run('retains filtered search terms but not user-agent or raw calculation fields', async () => {
  const searchSource = await readFile(new URL('../functions/api/search-log.ts', import.meta.url), 'utf8');
  const calculationSource = await readFile(new URL('../functions/api/calculation-log.ts', import.meta.url), 'utf8');

  assert.doesNotMatch(searchSource, /userAgent/);
  assert.doesNotMatch(calculationSource, /sanjeongDisease/);
  assert.doesNotMatch(calculationSource, /selectedTests/);
  assert.doesNotMatch(calculationSource, /insuranceGeneration/);
  assert.match(searchSource, /RATE_LIMIT_MAX_REQUESTS_PER_HOUR/);
  assert.match(calculationSource, /RATE_LIMIT_MAX_REQUESTS_PER_HOUR/);
});

await run('rate limits anonymous search and calculation telemetry', async () => {
  const createRateLimitedDatabase = () => {
    let events = 0;
    return {
      database: {
        prepare(sql) {
          return {
            bind() { return this; },
            async first() {
              if (sql.includes('telemetry_rate_limits')) return { event_count: ++events };
              return null;
            },
            async run() { return { success: true }; },
          };
        },
      },
    };
  };
  const searchState = createRateLimitedDatabase();
  const calculationState = createRateLimitedDatabase();
  const request = (url, payload) => new Request(url, {
    method: 'POST',
    headers: { 'CF-Connecting-IP': '203.0.113.9', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  for (let index = 0; index < 30; index += 1) {
    assert.equal((await logSearch({ request: request('https://example.test/api/search-log', { query: 'brain mri', resultCount: 1, path: '/hospital-cost-calculator' }), env: { DB: searchState.database } })).status, 200);
    assert.equal((await logCalculation({ request: request('https://example.test/api/calculation-log', { hospitalClass: 'clinic', treatmentType: 'outpatient', nonBenefitRegion: '11', stayDaysBucket: '0', hasInsurance: false, finalCostBucket: 'under_50k' }), env: { DB: calculationState.database } })).status, 200);
  }
  assert.equal((await logSearch({ request: request('https://example.test/api/search-log', { query: 'brain mri', resultCount: 1, path: '/hospital-cost-calculator' }), env: { DB: searchState.database } })).status, 429);
  assert.equal((await logCalculation({ request: request('https://example.test/api/calculation-log', { hospitalClass: 'clinic', treatmentType: 'outpatient', nonBenefitRegion: '11', stayDaysBucket: '0', hasInsurance: false, finalCostBucket: 'under_50k' }), env: { DB: calculationState.database } })).status, 429);
});

await run('accepts the documented national fallback region for aggregate calculation telemetry', async () => {
  const state = createClickDatabase();
  const response = await logCalculation({
    request: new Request('https://example.test/api/calculation-log', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '203.0.113.10', 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalClass: 'clinic', treatmentType: 'outpatient', nonBenefitRegion: 'national', stayDaysBucket: '0', hasInsurance: false, finalCostBucket: 'under_50k' }),
    }),
    env: { DB: state.database },
  });

  assert.equal(response.status, 200);
});

await run('purges telemetry older than 30 days', async () => {
  const statements = [];
  const response = await purgeTelemetry({
    request: new Request('https://example.test/api/admin/purge-telemetry', { method: 'POST' }),
    env: {
      DB: {
        prepare(sql) { statements.push(sql); return { bind() { return this; }, run: async () => ({ meta: { changes: 1 } }) }; },
        async batch(values) { return Promise.all(values.map(value => value.run())); },
      },
    },
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.deleted.searchLogs, 1);
  assert.equal(statements.filter(sql => sql.includes("datetime('now', '-30 days')")).length, 3);
});

console.log('api security regression checks passed');
