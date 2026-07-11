export const RATE_LIMIT_MAX_REQUESTS_PER_HOUR = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export function limitedText(value: unknown, maxLength: number): string | null {
  return typeof value === 'string' && value.length <= maxLength ? value : null;
}

export async function countHourlyTelemetryRequest(db: D1Database, clientIp: string, eventType: string): Promise<number> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${eventType}:${clientIp}`));
  const rateKey = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const windowStartedAt = Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
  await db.prepare('DELETE FROM telemetry_rate_limits WHERE window_started_at < ?').bind(windowStartedAt - RATE_LIMIT_WINDOW_MS).run();
  const result = await db.prepare(`
    INSERT INTO telemetry_rate_limits (rate_key, window_started_at, event_count)
    VALUES (?, ?, 1)
    ON CONFLICT(rate_key) DO UPDATE SET
      window_started_at = CASE
        WHEN telemetry_rate_limits.window_started_at < excluded.window_started_at THEN excluded.window_started_at
        ELSE telemetry_rate_limits.window_started_at
      END,
      event_count = CASE
        WHEN telemetry_rate_limits.window_started_at < excluded.window_started_at THEN 1
        ELSE telemetry_rate_limits.event_count + 1
      END
    RETURNING event_count
  `).bind(rateKey, windowStartedAt).first<{ event_count?: number }>();
  return typeof result?.event_count === 'number' ? result.event_count : 0;
}

export async function purgeExpiredTelemetry(db: D1Database) {
  const [searchLogs, searchClickLogs, calculationLogs] = await Promise.all([
    db.prepare("DELETE FROM search_logs WHERE created_at < datetime('now', '-30 days')").run(),
    db.prepare("DELETE FROM search_click_logs WHERE created_at < datetime('now', '-30 days')").run(),
    db.prepare("DELETE FROM calculation_logs WHERE created_at < datetime('now', '-30 days')").run(),
    db.prepare("DELETE FROM telemetry_rate_limits WHERE window_started_at < ?").bind(Date.now() - RATE_LIMIT_WINDOW_MS).run(),
  ]);
  return {
    searchLogs: searchLogs.meta?.changes ?? 0,
    searchClickLogs: searchClickLogs.meta?.changes ?? 0,
    calculationLogs: calculationLogs.meta?.changes ?? 0,
  };
}
