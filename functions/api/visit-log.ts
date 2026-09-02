import {
  countHourlyTelemetryRequest,
  purgeExpiredTelemetry,
  RATE_LIMIT_MAX_REQUESTS_PER_HOUR,
  readSameOriginJsonObject,
  sha256Hex,
  telemetryClientAddress,
} from './telemetry.ts';

interface Env { DB: D1Database; }

const BROWSER_ID_PATTERN = /^[A-Za-z0-9_-]{20,80}$/;

function currentKoreanDay(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await readSameOriginJsonObject(context.request);
    if (!body) {
      return Response.json({ ok: false, error: '방문 통계 요청이 유효하지 않습니다.' }, { status: 400 });
    }
    const browserId = typeof body.browserId === 'string' ? body.browserId : '';
    const clientIp = telemetryClientAddress(context.request);
    if (body.operationalConsent !== true || !BROWSER_ID_PATTERN.test(browserId) || !clientIp) {
      return Response.json({ ok: false, error: '방문 통계 요청이 유효하지 않습니다.' }, { status: 400 });
    }

    await purgeExpiredTelemetry(context.env.DB);
    if (await countHourlyTelemetryRequest(context.env.DB, clientIp, 'visit-log') > RATE_LIMIT_MAX_REQUESTS_PER_HOUR) {
      return Response.json({ ok: false, error: '요청이 너무 많습니다.' }, {
        status: 429,
        headers: { 'Retry-After': '3600' },
      });
    }

    const day = currentKoreanDay();
    const visitorHash = await sha256Hex(`${day}:${browserId}`);
    await context.env.DB.prepare(`
      INSERT INTO visitor_daily_stats (day, visitor_hash, page_views, first_seen_at, last_seen_at)
      VALUES (?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(day, visitor_hash) DO UPDATE SET
        page_views = visitor_daily_stats.page_views + 1,
        last_seen_at = CURRENT_TIMESTAMP
    `).bind(day, visitorHash).run();

    return Response.json({ ok: true });
  } catch (error) {
    console.error('visit-log error', error);
    return Response.json({ ok: false, error: '방문 통계 저장 중 오류가 발생했습니다.' }, { status: 500 });
  }
};
