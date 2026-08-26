import {
  containsPersonalData,
  countHourlyTelemetryRequest,
  normalizeSearchQuery,
  normalizeTelemetryPath,
  purgeExpiredTelemetry,
  RATE_LIMIT_MAX_REQUESTS_PER_HOUR,
} from './telemetry.ts';

interface Env { DB: D1Database; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as { query?: unknown; resultCount?: unknown; path?: unknown };
    const search = normalizeSearchQuery(body.query);
    const resultCount = typeof body.resultCount === 'number' ? body.resultCount : Number.NaN;
    const path = normalizeTelemetryPath(body.path);
    const clientIp = context.request.headers.get('CF-Connecting-IP');
    if (!search || containsPersonalData(search.query) || !Number.isFinite(resultCount) || resultCount < 0 || !path || !clientIp) {
      return Response.json({ ok: false, error: '분석 요청이 유효하지 않습니다.' }, { status: 400 });
    }
    await purgeExpiredTelemetry(context.env.DB);
    if (await countHourlyTelemetryRequest(context.env.DB, clientIp, 'search-log') > RATE_LIMIT_MAX_REQUESTS_PER_HOUR) {
      return Response.json({ ok: false, error: '요청이 너무 많습니다.' }, { status: 429, headers: { 'Retry-After': '3600' } });
    }
    await context.env.DB.prepare('INSERT INTO search_logs (query, normalized_query, result_count, path) VALUES (?, ?, ?, ?)')
      .bind(search.query, search.normalizedQuery, Math.min(Math.round(resultCount), 100000), path).run();
    return Response.json({ ok: true });
  } catch (error) {
    console.error('search-log error', error);
    return Response.json({ ok: false, error: '검색 로그 저장 중 오류가 발생했습니다.' }, { status: 500 });
  }
};
