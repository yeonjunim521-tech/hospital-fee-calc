import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const { onRequest: adminMiddleware } = await import('../functions/_middleware.ts');
const { onRequestGet: getTopSearches } = await import('../functions/api/top-searches.ts');
const { onRequestPost: logSearchClick } = await import('../functions/api/search-click.ts');
const { onRequestPost: logSearch } = await import('../functions/api/search-log.ts');
const { onRequestPost: logVisit } = await import('../functions/api/visit-log.ts');
const { onRequestPost: logCalculation } = await import('../functions/api/calculation-log.ts');
const { onRequestPost: purgeTelemetry } = await import('../functions/api/admin/purge-telemetry.ts');
const { onRequestGet: getSearchStats } = await import('../functions/api/admin/search-stats.ts');
const { onRequestPost: deleteAdminLog } = await import('../functions/api/admin/delete-log.ts');

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
            return { success: true };
          },
        };
      },
    },
    clickWrites: () => clickWrites,
    lastClickValues: () => lastClickValues,
  };
}

function createOperationalDatabase() {
  let rateCount = 0;
  let searchWrites = 0;
  let visitorWrites = 0;
  let lastSearchValues = [];
  let lastVisitorValues = [];

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
            if (sql.includes('telemetry_rate_limits')) return { event_count: ++rateCount };
            return null;
          },
          async run() {
            if (sql.includes('INSERT INTO search_logs')) {
              searchWrites += 1;
              lastSearchValues = values;
            }
            if (sql.includes('INSERT INTO visitor_daily_stats')) {
              visitorWrites += 1;
              lastVisitorValues = values;
            }
            return { success: true, meta: { changes: 1 } };
          },
        };
      },
    },
    searchWrites: () => searchWrites,
    visitorWrites: () => visitorWrites,
    lastSearchValues: () => lastSearchValues,
    lastVisitorValues: () => lastVisitorValues,
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
  const routes = ['/admin', '/admin/', '/admin-search'];

  for (const route of routes) {
    const response = await adminMiddleware(adminContext(new Request(`https://example.test${route}`)));
    assert.equal(response.status, 401);
  }
});

await run('deletes completed history without deleting the published medical item', async () => {
  const statements = [];
  const response = await deleteAdminLog({
    request: new Request('https://example.test/api/admin/delete-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'candidate-history', value: 17 }),
    }),
    env: {
      DB: {
        prepare(sql) {
          statements.push(sql);
          return { bind() { return this; }, run: async () => ({ meta: { changes: 1 } }) };
        },
      },
    },
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.publishedItemPreserved, true);
  assert.match(statements[0], /DELETE FROM search_candidates/);
  assert.match(statements[0], /status = 'approved'/);
  assert.doesNotMatch(statements.join('\n'), /DELETE FROM medical_items/);
});

await run('never deletes legacy aggregate search rows', async () => {
  let prepareCalled = false;
  const makeContext = (body) => ({
    request: new Request('https://example.test/api/admin/delete-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    env: {
      DB: {
        prepare() {
          prepareCalled = true;
          return { bind() { return this; }, run: async () => ({ meta: { changes: 1 } }) };
        },
      },
    },
  });

  const allResponse = await deleteAdminLog(makeContext({ type: 'all' }));
  const aggregateResponse = await deleteAdminLog(makeContext({ type: 'search-term', value: 'aggregate' }));

  assert.equal(allResponse.status, 400);
  assert.equal(aggregateResponse.status, 400);
  assert.equal(prepareCalled, false);
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

await run('retires aggregate click telemetry without writing new rows', async () => {
  const state = createClickDatabase();
  const response = await logSearchClick({
    request: new Request('https://example.test/api/search-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }),
    env: { DB: state.database },
  });

  assert.equal(response.status, 410);
  assert.equal(state.clickWrites(), 0);
});

await run('stores the normalized exact search term without visitor or device identity', async () => {
  const state = createOperationalDatabase();
  const response = await logSearch({
    request: new Request('https://example.test/api/search-log', {
      method: 'POST',
      headers: {
        'CF-Connecting-IP': '203.0.113.20',
        'Content-Type': 'application/json',
        Origin: 'https://example.test',
        'User-Agent': 'must-not-be-stored',
      },
      body: JSON.stringify({ query: '  Tibia   MRI  ', resultCount: 0, operationalConsent: true }),
    }),
    env: { DB: state.database },
  });

  assert.equal(response.status, 200);
  assert.equal(state.searchWrites(), 1);
  assert.deepEqual(state.lastSearchValues(), ['Tibia MRI', 'tibia mri', 0, '/calculator']);
  assert.doesNotMatch(JSON.stringify(state.lastSearchValues()), /203\.0\.113\.20|must-not-be-stored/);
});

await run('rejects exact search logging when operational consent is absent', async () => {
  const state = createOperationalDatabase();
  const response = await logSearch({
    request: new Request('https://example.test/api/search-log', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '203.0.113.21', 'Content-Type': 'application/json', Origin: 'https://example.test' },
      body: JSON.stringify({ query: '허리 mri', resultCount: 1, operationalConsent: false }),
    }),
    env: { DB: state.database },
  });

  assert.equal(response.status, 400);
  assert.equal(state.searchWrites(), 0);
});

await run('stores a daily anonymous visitor hash separately from search terms', async () => {
  const state = createOperationalDatabase();
  const browserId = '550e8400-e29b-41d4-a716-446655440000';
  const response = await logVisit({
    request: new Request('https://example.test/api/visit-log', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '203.0.113.22', 'Content-Type': 'application/json', Origin: 'https://example.test' },
      body: JSON.stringify({ browserId, operationalConsent: true }),
    }),
    env: { DB: state.database },
  });

  assert.equal(response.status, 200);
  assert.equal(state.visitorWrites(), 1);
  assert.match(state.lastVisitorValues()[0], /^\d{4}-\d{2}-\d{2}$/);
  assert.match(state.lastVisitorValues()[1], /^[a-f0-9]{64}$/);
  assert.notEqual(state.lastVisitorValues()[1], browserId);
  assert.equal(state.searchWrites(), 0);
});

await run('rejects unhyphenated phone numbers before writing exact search telemetry', async () => {
  let searchWrites = 0;
  const searchResponse = await logSearch({
    request: new Request('https://example.test/api/search-log', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '203.0.113.8', 'Content-Type': 'application/json', Origin: 'https://example.test' },
      body: JSON.stringify({ query: '01012345678', resultCount: 1, operationalConsent: true }),
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

  assert.equal(searchResponse.status, 400);
  assert.equal(searchWrites, 0);
});

await run('rejects telemetry writes without same-origin JSON and explicit consent', async () => {
  const endpoints = [
    {
      handler: logSearch,
      url: 'https://example.test/api/search-log',
      payload: { query: '허리 mri', resultCount: 1, operationalConsent: true },
    },
    {
      handler: logVisit,
      url: 'https://example.test/api/visit-log',
      payload: { browserId: '550e8400-e29b-41d4-a716-446655440000', operationalConsent: true },
    },
    {
      handler: logCalculation,
      url: 'https://example.test/api/calculation-log',
      payload: { hospitalClass: 'clinic', treatmentType: 'outpatient', nonBenefitRegion: '11', stayDaysBucket: '0', hasInsurance: false, finalCostBucket: 'under_50k', operationalConsent: true },
    },
  ];

  for (const endpoint of endpoints) {
    const invalidRequests = [
      new Request(endpoint.url, {
        method: 'POST',
        headers: { 'CF-Connecting-IP': '203.0.113.50', 'Content-Type': 'application/json' },
        body: JSON.stringify(endpoint.payload),
      }),
      new Request(endpoint.url, {
        method: 'POST',
        headers: { 'CF-Connecting-IP': '203.0.113.50', 'Content-Type': 'application/json', Origin: 'https://attacker.test' },
        body: JSON.stringify(endpoint.payload),
      }),
      new Request(endpoint.url, {
        method: 'POST',
        headers: { 'CF-Connecting-IP': '203.0.113.50', 'Content-Type': 'text/plain', Origin: 'https://example.test' },
        body: JSON.stringify(endpoint.payload),
      }),
      new Request(endpoint.url, {
        method: 'POST',
        headers: { 'CF-Connecting-IP': '203.0.113.50', 'Content-Type': 'application/json', Origin: 'https://example.test' },
        body: JSON.stringify({ ...endpoint.payload, operationalConsent: false }),
      }),
    ];

    for (const request of invalidRequests) {
      const response = await endpoint.handler({ request, env: { DB: createOperationalDatabase().database } });
      assert.equal(response.status, 400);
    }
  }
});

await run('returns 400 for malformed telemetry JSON', async () => {
  const response = await logSearch({
    request: new Request('https://example.test/api/search-log', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '203.0.113.51', 'Content-Type': 'application/json', Origin: 'https://example.test' },
      body: '{not-json}',
    }),
    env: { DB: createOperationalDatabase().database },
  });

  assert.equal(response.status, 400);
});

await run('allows localhost telemetry without Cloudflare edge headers only for development', async () => {
  const state = createOperationalDatabase();
  const response = await logSearch({
    request: new Request('http://127.0.0.1:8790/api/search-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:8790' },
      body: JSON.stringify({ query: '개발 환경 검색', resultCount: 0, operationalConsent: true }),
    }),
    env: { DB: state.database },
  });

  assert.equal(response.status, 200);
  assert.equal(state.searchWrites(), 1);

  const productionResponse = await logSearch({
    request: new Request('https://example.test/api/search-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://example.test' },
      body: JSON.stringify({ query: '운영 환경 검색', resultCount: 0, operationalConsent: true }),
    }),
    env: { DB: createOperationalDatabase().database },
  });
  assert.equal(productionResponse.status, 400);
});

await run('reports exact term counts and daily visitors while excluding legacy aggregate rows', async () => {
  const statements = [];
  const response = await getSearchStats({
    request: new Request('https://example.test/api/admin/search-stats?period=30'),
    env: {
      DB: {
        prepare(sql) {
          statements.push(sql);
          return {
            bind() {
              return this;
            },
            async all() {
              if (sql.includes('COUNT(DISTINCT normalized_query)')) return { results: [{ total_searches: 4, unique_terms: 2, zero_result_searches: 1 }] };
              if (sql.includes('logs.normalized_query AS query')) return { results: [{ query: 'tibia', zero_result_count: 1, last_searched_at: '2026-08-30 01:00:00' }] };
              if (sql.includes('normalized_query AS query')) return { results: [{ query: 'mri', search_count: 3, zero_result_count: 0, last_searched_at: '2026-08-30 02:00:00' }] };
              if (sql.includes('COUNT(*) AS daily_visitor_total')) return { results: [{ daily_visitor_total: 5, page_views: 8 }] };
              if (sql.includes('AS search_count') && sql.includes("date(created_at, '+9 hours')")) return { results: [{ day: '2026-08-30', search_count: 4 }] };
              if (sql.includes('GROUP BY day')) return { results: [{ day: '2026-08-30', unique_visitors: 5, page_views: 8 }] };
              return { results: [] };
            },
          };
        },
      },
    },
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body.summary, { totalSearches: 4, uniqueTerms: 2, zeroResultSearches: 1 });
  assert.deepEqual(body.allSearchTerms[0], { query: 'mri', search_count: 3, zero_result_count: 0, last_searched_at: '2026-08-30 02:00:00' });
  assert.deepEqual(body.missingTerms[0], { query: 'tibia', zero_result_count: 1, last_searched_at: '2026-08-30 01:00:00' });
  assert.equal(body.visitorStats.dailyVisitorTotal, 5);
  assert.equal(body.visitorStats.pageViews, 8);
  assert.equal(body.visitorStats.daily[0].search_count, 4);
  assert.deepEqual(body.clickedItems, []);
  assert.equal(body.clickCount, 0);
  assert.ok(statements.filter(sql => sql.includes("normalized_query <> 'aggregate'")).length >= 3);
});

await run('declares durable rate-limit and separate daily visitor tables in the D1 schema', async () => {
  const schema = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');
  assert.match(schema, /CREATE TABLE IF NOT EXISTS telemetry_rate_limits/);
  assert.match(schema, /idx_telemetry_rate_limits_window_started_at/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS visitor_daily_stats/);
  assert.match(schema, /PRIMARY KEY \(day, visitor_hash\)/);
  const visitorTable = schema.match(/CREATE TABLE IF NOT EXISTS visitor_daily_stats\s*\(([\s\S]*?)\);/)?.[1] || '';
  assert.doesNotMatch(visitorTable, /query/i);
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

await run('retains exact search terms without identity fields and keeps calculation telemetry minimized', async () => {
  const searchSource = await readFile(new URL('../functions/api/search-log.ts', import.meta.url), 'utf8');
  const calculationSource = await readFile(new URL('../functions/api/calculation-log.ts', import.meta.url), 'utf8');

  assert.match(searchSource, /bind\(search\.query, search\.normalizedQuery/);
  assert.match(searchSource, /operationalConsent/);
  assert.doesNotMatch(searchSource, /userAgent/);
  assert.doesNotMatch(searchSource, /browserId|sessionId/);
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
    headers: { 'CF-Connecting-IP': '203.0.113.9', 'Content-Type': 'application/json', Origin: 'https://example.test' },
    body: JSON.stringify(payload),
  });

  for (let index = 0; index < 30; index += 1) {
    assert.equal((await logSearch({ request: request('https://example.test/api/search-log', { query: '허리 mri', resultCount: 1, operationalConsent: true }), env: { DB: searchState.database } })).status, 200);
    assert.equal((await logCalculation({ request: request('https://example.test/api/calculation-log', { hospitalClass: 'clinic', treatmentType: 'outpatient', nonBenefitRegion: '11', stayDaysBucket: '0', hasInsurance: false, finalCostBucket: 'under_50k', operationalConsent: true }), env: { DB: calculationState.database } })).status, 200);
  }
  assert.equal((await logSearch({ request: request('https://example.test/api/search-log', { query: '허리 mri', resultCount: 1, operationalConsent: true }), env: { DB: searchState.database } })).status, 429);
  assert.equal((await logCalculation({ request: request('https://example.test/api/calculation-log', { hospitalClass: 'clinic', treatmentType: 'outpatient', nonBenefitRegion: '11', stayDaysBucket: '0', hasInsurance: false, finalCostBucket: 'under_50k', operationalConsent: true }), env: { DB: calculationState.database } })).status, 429);
});

await run('accepts the documented national fallback region for consented calculation telemetry', async () => {
  const state = createClickDatabase();
  const response = await logCalculation({
    request: new Request('https://example.test/api/calculation-log', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '203.0.113.10', 'Content-Type': 'application/json', Origin: 'https://example.test' },
      body: JSON.stringify({ hospitalClass: 'clinic', treatmentType: 'outpatient', nonBenefitRegion: 'national', stayDaysBucket: '0', hasInsurance: false, finalCostBucket: 'under_50k', operationalConsent: true }),
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
  assert.equal(body.deleted.visitorDailyStats, 1);
  assert.equal(statements.filter(sql => sql.includes("datetime('now', '-30 days')")).length, 3);
  assert.equal(statements.filter(sql => sql.includes('visitor_daily_stats')).length, 1);
});

console.log('api security regression checks passed');
