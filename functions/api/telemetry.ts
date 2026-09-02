export const RATE_LIMIT_MAX_REQUESTS_PER_HOUR = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export function limitedText(value: unknown, maxLength: number): string | null {
  return typeof value === 'string' && value.length <= maxLength ? value : null;
}

export function compactTelemetryText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const compact = value.trim().replace(/\s+/g, ' ');
  return compact && compact.length <= maxLength ? compact : null;
}

export function normalizeSearchQuery(value: unknown): { query: string; normalizedQuery: string } | null {
  const query = compactTelemetryText(value, 100);
  if (!query || query.length < 2) return null;
  return { query, normalizedQuery: query.toLowerCase() };
}

export function containsPersonalData(value: string): boolean {
  const normalizedValue = value.normalize('NFKC');
  const patterns = [
    /\b\d{6}[ .-]?[1-4]\d{6}\b/,
    /(?:\+?82[\s().-]*|0)\d{1,2}[\s().-]*\d{3,4}[\s().-]*\d{4}(?!\d)/,
    /\b01[016789]\d{7,8}\b/,
    /\b\d{13}\b/,
    /[^\s@]+@[^\s@]+\.[^\s@]+/u,
  ];
  return patterns.some((pattern) => pattern.test(normalizedValue));
}

export function normalizeTelemetryPath(value: unknown): string | null {
  const path = compactTelemetryText(value, 200);
  if (!path || !/^\/[A-Za-z0-9/_-]*(?:\.html)?$/.test(path) || containsPersonalData(path)) return null;
  return path;
}

export function isValidTelemetryItemId(value: unknown): value is string {
  const itemId = compactTelemetryText(value, 100);
  return Boolean(itemId && /^[A-Za-z0-9_.:-]+$/.test(itemId) && !containsPersonalData(itemId));
}

export async function readSameOriginJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  const contentType = request.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase();
  const requestOrigin = request.headers.get('Origin');
  const fetchSite = request.headers.get('Sec-Fetch-Site');

  if (contentType !== 'application/json'
    || requestOrigin !== new URL(request.url).origin
    || (fetchSite !== null && fetchSite !== 'same-origin')) {
    return null;
  }

  try {
    const body: unknown = await request.json();
    return typeof body === 'object' && body !== null && !Array.isArray(body)
      ? body as Record<string, unknown>
      : null;
  } catch (error) {
    return null;
  }
}

export function telemetryClientAddress(request: Request): string | null {
  const edgeAddress = request.headers.get('CF-Connecting-IP');
  if (edgeAddress) return edgeAddress;

  const hostname = new URL(request.url).hostname;
  return hostname === '127.0.0.1' || hostname === 'localhost' || hostname === '::1'
    ? 'local-development'
    : null;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function countHourlyTelemetryRequest(db: D1Database, clientIp: string, eventType: string): Promise<number> {
  const rateKey = await sha256Hex(`${eventType}:${clientIp}`);
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
  const [searchLogs, searchClickLogs, calculationLogs, visitorDailyStats] = await Promise.all([
    db.prepare("DELETE FROM search_logs WHERE created_at < datetime('now', '-30 days')").run(),
    db.prepare("DELETE FROM search_click_logs WHERE created_at < datetime('now', '-30 days')").run(),
    db.prepare("DELETE FROM calculation_logs WHERE created_at < datetime('now', '-30 days')").run(),
    db.prepare("DELETE FROM visitor_daily_stats WHERE day < date('now', '+9 hours', '-29 days')").run(),
    db.prepare("DELETE FROM telemetry_rate_limits WHERE window_started_at < ?").bind(Date.now() - RATE_LIMIT_WINDOW_MS).run(),
  ]);
  return {
    searchLogs: searchLogs.meta?.changes ?? 0,
    searchClickLogs: searchClickLogs.meta?.changes ?? 0,
    calculationLogs: calculationLogs.meta?.changes ?? 0,
    visitorDailyStats: visitorDailyStats.meta?.changes ?? 0,
  };
}
