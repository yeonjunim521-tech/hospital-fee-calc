import {
  countHourlyTelemetryRequest,
  purgeExpiredTelemetry,
  RATE_LIMIT_MAX_REQUESTS_PER_HOUR,
  readSameOriginJsonObject,
  telemetryClientAddress,
} from './telemetry.ts';

interface Env { DB: D1Database; }

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const RESIDENT_NUMBER_PATTERN = /\b\d{6}\s*-?\s*[1-8]\d{6}\b/;
const LONG_NUMBER_PATTERN = /\d{7,}/;

function normalizeSearchQuery(value: unknown): { query: string; normalizedQuery: string } | null {
  if (typeof value !== 'string') return null;
  const query = value.normalize('NFKC').trim().replace(/\s+/g, ' ');
  const digits = query.replace(/\D/g, '');
  const containsPhoneNumber = /^(?:01[016789]|02|0[3-6][1-5])\d{7,8}$/.test(digits);
  if (query.length < 2 || query.length > 80 || EMAIL_PATTERN.test(query)
    || RESIDENT_NUMBER_PATTERN.test(query) || containsPhoneNumber || LONG_NUMBER_PATTERN.test(query)) {
    return null;
  }
  return { query, normalizedQuery: query.toLocaleLowerCase('ko-KR') };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await readSameOriginJsonObject(context.request);
    if (!body) {
      return Response.json({ ok: false, error: '분석 요청이 유효하지 않습니다.' }, { status: 400 });
    }
    const search = normalizeSearchQuery(body.query);
    const resultCount = typeof body.resultCount === 'number' ? body.resultCount : Number.NaN;
    const clientIp = telemetryClientAddress(context.request);
    if (body.operationalConsent !== true || !search || !Number.isFinite(resultCount) || resultCount < 0 || !clientIp) {
      return Response.json({ ok: false, error: '분석 요청이 유효하지 않습니다.' }, { status: 400 });
    }
    await purgeExpiredTelemetry(context.env.DB);
    if (await countHourlyTelemetryRequest(context.env.DB, clientIp, 'search-log') > RATE_LIMIT_MAX_REQUESTS_PER_HOUR) {
      return Response.json({ ok: false, error: '요청이 너무 많습니다.' }, { status: 429, headers: { 'Retry-After': '3600' } });
    }
    await context.env.DB.prepare('INSERT INTO search_logs (query, normalized_query, result_count, path) VALUES (?, ?, ?, ?)')
      .bind(search.query, search.normalizedQuery, Math.min(Math.round(resultCount), 100000), '/calculator').run();
    return Response.json({ ok: true });
  } catch (error) {
    console.error('search-log error', error);
    return Response.json({ ok: false, error: '검색 로그 저장 중 오류가 발생했습니다.' }, { status: 500 });
  }
};
