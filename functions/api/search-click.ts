import {
  compactTelemetryText,
  containsPersonalData,
  countHourlyTelemetryRequest,
  isValidTelemetryItemId,
  normalizeSearchQuery,
  normalizeTelemetryPath,
  purgeExpiredTelemetry,
  RATE_LIMIT_MAX_REQUESTS_PER_HOUR,
} from './telemetry.ts';

interface Env { DB: D1Database; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as {
      searchQuery?: unknown;
      clickedItemId?: unknown;
      clickedItemName?: unknown;
      path?: unknown;
    };
    const search = normalizeSearchQuery(body.searchQuery);
    const clickedItemId = compactTelemetryText(body.clickedItemId, 100);
    const clickedItemName = compactTelemetryText(body.clickedItemName, 200);
    const path = normalizeTelemetryPath(body.path);
    const clientIp = context.request.headers.get('CF-Connecting-IP');
    if (!search || containsPersonalData(search.query) || !isValidTelemetryItemId(clickedItemId)
      || !clickedItemName || containsPersonalData(clickedItemName) || !path || !clientIp) {
      return Response.json({ ok: false, error: '분석 요청이 유효하지 않습니다.' }, { status: 400 });
    }
    await purgeExpiredTelemetry(context.env.DB);
    if (await countHourlyTelemetryRequest(context.env.DB, clientIp, 'search-click') > RATE_LIMIT_MAX_REQUESTS_PER_HOUR) {
      return Response.json({ ok: false, error: '요청이 너무 많습니다.' }, { status: 429, headers: { 'Retry-After': '3600' } });
    }
    await context.env.DB.prepare('INSERT INTO search_click_logs (search_query, normalized_query, clicked_item_id, clicked_item_name, path) VALUES (?, ?, ?, ?, ?)')
      .bind(search.query, search.normalizedQuery, clickedItemId, clickedItemName, path).run();
    return Response.json({ ok: true });
  } catch (error) {
    console.error('search-click error', error);
    return Response.json({ ok: false, error: '클릭 로그 저장 중 오류가 발생했습니다.' }, { status: 500 });
  }
};
