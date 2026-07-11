interface Env {
  DB: D1Database;
}

const CLICK_LOG_MAX_REQUESTS_PER_HOUR = 30;
const CLICK_LOG_WINDOW_MS = 60 * 60 * 1000;
const BLOCKED_QUERY_PATTERNS = [
  /\d{6}-\d{7}/,
  /\d{2,3}-\d{3,4}-\d{4}/,
  /\b01[016789]\d{7,8}\b/,
  /\b\d{13}\b/,
  /[\w.-]+@[\w.-]+\.\w+/,
];

function normalizeQuery(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 100);
}

function isBlockedQuery(query: string): boolean {
  return BLOCKED_QUERY_PATTERNS.some((pattern) => pattern.test(query));
}

async function createRateLimitKey(clientIp: string): Promise<string> {
  const input = new TextEncoder().encode(`search-click:${clientIp}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function countHourlyClickLogRequest(db: D1Database, clientIp: string): Promise<number> {
  const rateKey = await createRateLimitKey(clientIp);
  const windowStartedAt = Math.floor(Date.now() / CLICK_LOG_WINDOW_MS) * CLICK_LOG_WINDOW_MS;
  await db.prepare(`
    DELETE FROM telemetry_rate_limits
    WHERE window_started_at < ?
  `).bind(windowStartedAt - CLICK_LOG_WINDOW_MS).run();
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

  return typeof result?.event_count === "number" ? result.event_count : 0;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as {
      searchQuery?: string;
      clickedItemId?: string;
      clickedItemName?: string;
      path?: string;
    };

    const searchQuery = typeof body.searchQuery === "string" ? body.searchQuery : "";
    const normalizedQuery = normalizeQuery(searchQuery);

    if (!normalizedQuery) {
      return Response.json(
        { ok: false, error: "검색어가 비어 있습니다." },
        { status: 400 }
      );
    }

    if (isBlockedQuery(searchQuery)) {
      return Response.json(
        { ok: false, error: "개인정보로 추정되는 검색어는 저장하지 않습니다." },
        { status: 400 }
      );
    }

    const clientIp = context.request.headers.get("CF-Connecting-IP");
    if (!clientIp) {
      return Response.json(
        { ok: false, error: "클라이언트 주소를 확인할 수 없습니다." },
        { status: 400 }
      );
    }

    const requestCount = await countHourlyClickLogRequest(context.env.DB, clientIp);
    if (requestCount > CLICK_LOG_MAX_REQUESTS_PER_HOUR) {
      return Response.json(
        { ok: false, error: "클릭 로그 요청이 너무 많습니다." },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    const path = typeof body.path === "string"
      ? body.path.slice(0, 200)
      : null;

    await context.env.DB.prepare(`
      INSERT INTO search_click_logs (
        search_query,
        normalized_query,
        clicked_item_id,
        clicked_item_name,
        path
      ) VALUES (?, ?, ?, ?, ?)
    `)
      .bind(
        searchQuery.slice(0, 100),
        normalizedQuery,
        null,
        null,
        path
      )
      .run();

    return Response.json({ ok: true });
  } catch (error) {
    console.error("search-click error", error);

    return Response.json(
      { ok: false, error: "클릭 로그 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
