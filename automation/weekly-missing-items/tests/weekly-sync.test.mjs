import assert from "node:assert/strict";
import test from "node:test";

import worker, { syncWeeklyMissingItems } from "../src/index.ts";

function createDatabase() {
  const sql = [];
  let batchCalls = 0;
  return {
    db: {
      prepare(statement) {
        sql.push(statement);
        return { statement };
      },
      async batch(statements) {
        batchCalls += 1;
        assert.equal(statements.length, 1);
        return [];
      },
    },
    sql,
    get batchCalls() {
      return batchCalls;
    },
  };
}

test("최근 7일 무결과 검색어를 승인 대기로만 동기화한다", async () => {
  // Given
  const database = createDatabase();

  // When
  await syncWeeklyMissingItems(database.db);

  // Then
  assert.equal(database.batchCalls, 1);
  assert.match(database.sql.join("\n"), /datetime\('now', '-7 days'\)/);
  assert.match(database.sql.join("\n"), /'pending'/);
  assert.doesNotMatch(database.sql.join("\n"), /'approved'|'published'/);
});

test("기존 승인 또는 거절 후보는 자동 변경하지 않는다", async () => {
  // Given
  const database = createDatabase();

  // When
  await syncWeeklyMissingItems(database.db);

  // Then
  assert.equal(database.sql.length, 1);
  assert.match(database.sql[0], /NOT EXISTS/);
  assert.doesNotMatch(database.sql[0], /UPDATE search_candidates/);
});

test("예약 실행은 동기화 작업을 런타임에 위임한다", async () => {
  // Given
  const database = createDatabase();
  let pending;
  const context = {
    waitUntil(promise) {
      pending = promise;
    },
  };

  // When
  await worker.scheduled({}, { DB: database.db }, context);
  await pending;

  // Then
  assert.equal(database.batchCalls, 1);
});
