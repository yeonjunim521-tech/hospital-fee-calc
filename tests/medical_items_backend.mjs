import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const { onRequestPost: saveCandidate } = await import('../functions/api/admin/search-candidates.ts');

async function run(name, callback) {
  try {
    await callback();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function approvedRequest(overrides = {}) {
  return new Request('https://example.test/api/admin/search-candidates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'MRI scan',
      code: 'MRI-001',
      name: 'Magnetic resonance imaging',
      category: 'imaging',
      group: 'tests',
      type: 'mri',
      status: 'approved',
      clinicPrice: 120000,
      hospitalPrice: 150000,
      isBenefit: false,
      sourceUrl: 'https://www.hira.or.kr/example',
      sourceDate: '2026-07-01',
      keywords: ['MRI', 'magnetic imaging'],
      ...overrides,
    }),
  });
}

await run('declares durable approved medical items, aliases, and weekly review tables', async () => {
  // Given
  const schema = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');

  // When / Then
  assert.match(schema, /CREATE TABLE IF NOT EXISTS medical_items/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS medical_item_aliases/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS weekly_candidate_reviews/);
});

await run('rejects approval when prices and official HIRA source are incomplete', async () => {
  // Given
  let writes = 0;
  const database = {
    prepare() {
      writes += 1;
      return { bind() { return this; }, async run() { return { success: true }; } };
    },
  };

  // When
  const response = await saveCandidate({
    request: approvedRequest({ clinicPrice: undefined, sourceUrl: 'https://attacker.test/item' }),
    env: { DB: database },
  });

  // Then
  assert.equal(response.status, 400);
  assert.equal(writes, 0);
});

await run('rejects candidate item codes that cannot be used by click telemetry', async () => {
  let writes = 0;
  const database = {
    prepare() {
      writes += 1;
      return { bind() { return this; }, async run() { return { success: true }; } };
    },
  };

  const response = await saveCandidate({
    request: approvedRequest({ code: '123456-1234567' }),
    env: { DB: database },
  });

  assert.equal(response.status, 400);
  assert.equal(writes, 0);
});

await run('atomically upserts an approved item and normalized aliases', async () => {
  // Given
  const prepared = [];
  let batchStatements = [];
  const database = {
    prepare(sql) {
      const statement = {
        sql,
        values: [],
        bind(...values) {
          this.values = values;
          return this;
        },
      };
      prepared.push(statement);
      return statement;
    },
    async batch(statements) {
      batchStatements = statements;
      return statements.map(() => ({ success: true }));
    },
  };

  // When
  const response = await saveCandidate({ request: approvedRequest(), env: { DB: database } });

  // Then
  assert.equal(response.status, 200);
  assert.equal(batchStatements.length, 6);
  assert.ok(prepared.some((statement) => statement.sql.includes('INSERT INTO medical_items')));
  const aliasValues = prepared
    .filter((statement) => statement.sql.includes('INSERT INTO medical_item_aliases'))
    .map((statement) => statement.values[1]);
  assert.deepEqual(aliasValues, ['mri scan', 'mri', 'magnetic imaging']);
});

await run('public endpoint returns only approved frontend fields', async () => {
  // Given
  const { onRequestGet: getMedicalItems } = await import('../functions/api/medical-items.ts');
  const database = {
    prepare(sql) {
      assert.match(sql, /WHERE status = 'approved'/);
      return {
        bind() { return this; },
        async all() {
          return {
            results: [{
              code: 'MRI-001',
              name: 'Magnetic resonance imaging',
              category: 'imaging',
              item_group: 'tests',
              item_type: 'mri',
              clinic_price: 120000,
              hospital_price: 150000,
              is_benefit: 0,
              source_url: 'https://www.hira.or.kr/example',
              source_date: '2026-07-01',
              keywords: 'mri scan|mri|magnetic imaging',
              updated_at: 'private',
            }],
          };
        },
      };
    },
  };

  // When
  const response = await getMedicalItems({
    request: new Request('https://example.test/api/medical-items?q=mri'),
    env: { DB: database },
  });
  const body = await response.json();

  // Then
  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    ok: true,
    items: [{
      code: 'MRI-001',
      name: 'Magnetic resonance imaging',
      category: 'imaging',
      group: 'tests',
      type: 'mri',
      clinicPrice: 120000,
      hospitalPrice: 150000,
      isBenefit: false,
      sourceUrl: 'https://www.hira.or.kr/example',
      sourceDate: '2026-07-01',
      keywords: ['mri scan', 'mri', 'magnetic imaging'],
    }],
  });
  assert.doesNotMatch(JSON.stringify(body), /updated_at|status/);
});

await run('public alias endpoint exposes only curator-approved code mappings', async () => {
  // Given
  const { onRequestGet: getSearchAliases } = await import('../functions/api/search-aliases.ts');
  const database = {
    prepare(sql) {
      assert.match(sql, /status = 'approved'/);
      assert.match(sql, /item_id IS NOT NULL/);
      return {
        async all() {
          return { results: [{ normalized_query: '중심정맥', item_id: 'PR_TR09', created_at: 'private' }] };
        },
      };
    },
  };

  // When
  const response = await getSearchAliases({ env: { DB: database } });
  const body = await response.json();

  // Then
  assert.deepEqual(body, { ok: true, aliases: [{ alias: '중심정맥', code: 'PR_TR09' }] });
  assert.doesNotMatch(JSON.stringify(body), /created_at|status/);
});

console.log('medical items backend checks passed');
