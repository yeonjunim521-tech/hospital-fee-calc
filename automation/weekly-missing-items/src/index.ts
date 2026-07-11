interface Env {
  readonly DB: D1Database;
}

const INSERT_PENDING_SQL = `
  INSERT INTO search_candidates (
    query,
    normalized_query,
    item_id,
    item_name,
    item_category,
    status,
    created_at,
    updated_at
  )
  SELECT
    latest.query,
    latest.normalized_query,
    NULL,
    latest.query,
    NULL,
    'pending',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM search_logs AS latest
  INNER JOIN (
    SELECT normalized_query, MAX(id) AS latest_id
    FROM search_logs
    WHERE result_count = 0
      AND created_at >= datetime('now', '-7 days')
      AND length(normalized_query) >= 2
    GROUP BY normalized_query
  ) AS weekly
    ON weekly.latest_id = latest.id
  WHERE NOT EXISTS (
    SELECT 1
    FROM search_candidates AS candidate
    WHERE candidate.normalized_query = latest.normalized_query
  )
`;

export async function syncWeeklyMissingItems(db: D1Database): Promise<void> {
  await db.batch([db.prepare(INSERT_PENDING_SQL)]);
}

export default {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    context: ExecutionContext,
  ): Promise<void> {
    context.waitUntil(syncWeeklyMissingItems(env.DB));
  },
} satisfies ExportedHandler<Env>;
