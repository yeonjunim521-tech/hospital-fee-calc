interface Env {
  DB: D1Database;
}

async function purgeExpiredTelemetry(db: D1Database) {
  const cutoff = "datetime('now', '-30 days')";
  await db.batch([
    db.prepare(`DELETE FROM search_logs WHERE created_at < ${cutoff}`),
    db.prepare(`DELETE FROM search_click_logs WHERE created_at < ${cutoff}`),
    db.prepare(`DELETE FROM calculation_logs WHERE created_at < ${cutoff}`),
    db.prepare("DELETE FROM visitor_daily_stats WHERE day < date('now', '+9 hours', '-29 days')"),
    db.prepare("DELETE FROM telemetry_rate_limits WHERE window_started_at < ?").bind(Date.now() - 60 * 60 * 1000),
  ]);
}

export default {
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(purgeExpiredTelemetry(env.DB));
  },
};
