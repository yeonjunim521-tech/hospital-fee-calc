import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const { onRequest: adminMiddleware } = await import('../functions/_middleware.ts');
const { onRequestGet: getTopSearches } = await import('../functions/api/top-searches.ts');
const { onRequestPost: logSearchClick } = await import('../functions/api/search-click.ts');
const { onRequestPost: logSearch } = await import('../functions/api/search-log.ts');
const { onRequestGet: getSearchStats } = await import('../functions/api/admin/search-stats.ts');

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
            if (sql.includes('search_click_logs')) {
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

await run('does not persist client-supplied click identifiers in aggregate telemetry', async () => {
  const state = createClickDatabase();
  const response = await logSearchClick({
    request: new Request('https://example.test/api/search-click', {
      method: 'POST',
      headers: {
        'CF-Connecting-IP': '203.0.113.8',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchQuery: 'mri',
        clickedItemId: 'FAKE_NOT_IN_CATALOG',
        clickedItemName: 'attacker controlled name',
      }),
    }),
    env: { DB: state.database },
  });

  assert.equal(response.status, 200);
  assert.equal(state.clickWrites(), 1);
  assert.equal(state.lastClickValues()[2], null);
  assert.equal(state.lastClickValues()[3], null);
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
        clickedItemName: 'ignored',
      }),
    }),
    env: { DB: state.database },
  });

  assert.equal(response.status, 400);
  assert.equal(state.clickWrites(), 0);
});

await run('rejects unhyphenated phone numbers in both search telemetry endpoints', async () => {
  const clickState = createClickDatabase();
  const clickResponse = await logSearchClick({
    request: new Request('https://example.test/api/search-click', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '203.0.113.8', 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchQuery: '01012345678', clickedItemId: 'ignored' }),
    }),
    env: { DB: clickState.database },
  });
  let searchWrites = 0;
  const searchResponse = await logSearch({
    request: new Request('https://example.test/api/search-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '01012345678', resultCount: 1 }),
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

await run('rate limits public click logging and does not store client-supplied item names', async () => {
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
          searchQuery: 'mri',
          clickedItemId: 'IM_MR01',
          clickedItemName: 'attacker controlled name',
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
        searchQuery: 'mri',
        clickedItemId: 'IM_MR01',
        clickedItemName: 'attacker controlled name',
      }),
    }),
    env: { DB: state.database },
  });

  assert.equal(blocked.status, 429);
  assert.equal(state.clickWrites(), 30);
  assert.equal(state.lastClickValues()[2], null);
  assert.equal(state.lastClickValues()[3], null);
});

await run('reports only aggregate click counts and excludes legacy item rankings', async () => {
  const response = await getSearchStats({
    request: new Request('https://example.test/api/admin/search-stats?period=30'),
    env: {
      DB: {
        prepare(sql) {
          return {
            bind() {
              return this;
            },
            async all() {
              if (sql.includes('COUNT(*) AS click_count')) {
                return { results: [{ click_count: 7, clicked_item_id: 'FAKE_NOT_IN_CATALOG' }] };
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
  assert.deepEqual(body.clickedItems, []);
  assert.equal(body.clickCount, 7);
});

await run('declares the durable click rate-limit table in the D1 schema', async () => {
  const schema = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');
  assert.match(schema, /CREATE TABLE IF NOT EXISTS telemetry_rate_limits/);
  assert.match(schema, /idx_telemetry_rate_limits_window_started_at/);
});

console.log('api security regression checks passed');
