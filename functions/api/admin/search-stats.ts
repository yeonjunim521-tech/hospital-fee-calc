interface Env {
  DB: D1Database;
}

type Period = 'today' | '24h' | '3' | '7' | '30' | '90';

type PeriodRange = {
  readonly period: Period;
  readonly label: string;
  readonly searchSql:
    | "datetime('now', '+9 hours', 'start of day', '-9 hours')"
    | "datetime('now', ?)";
  readonly searchBindValue: string | null;
  readonly visitorDaySql: string;
};

const PERIOD_RANGES: Record<Period, PeriodRange> = {
  today: {
    period: 'today',
    label: '오늘',
    searchSql: "datetime('now', '+9 hours', 'start of day', '-9 hours')",
    searchBindValue: null,
    visitorDaySql: "date('now', '+9 hours')",
  },
  '24h': {
    period: '24h',
    label: '24시간',
    searchSql: "datetime('now', ?)",
    searchBindValue: '-24 hours',
    visitorDaySql: "date('now', '+9 hours', '-1 day')",
  },
  '3': {
    period: '3',
    label: '3일',
    searchSql: "datetime('now', ?)",
    searchBindValue: '-3 days',
    visitorDaySql: "date('now', '+9 hours', '-2 days')",
  },
  '7': {
    period: '7',
    label: '7일',
    searchSql: "datetime('now', ?)",
    searchBindValue: '-7 days',
    visitorDaySql: "date('now', '+9 hours', '-6 days')",
  },
  '30': {
    period: '30',
    label: '30일',
    searchSql: "datetime('now', ?)",
    searchBindValue: '-30 days',
    visitorDaySql: "date('now', '+9 hours', '-29 days')",
  },
  '90': {
    period: '90',
    label: '90일',
    searchSql: "datetime('now', ?)",
    searchBindValue: '-90 days',
    visitorDaySql: "date('now', '+9 hours', '-89 days')",
  },
};

function isPeriod(value: string): value is Period {
  return Object.prototype.hasOwnProperty.call(PERIOD_RANGES, value);
}

function parsePeriod(url: URL): PeriodRange | null {
  const value = url.searchParams.get('period') ?? url.searchParams.get('days');
  if (!value) return PERIOD_RANGES['30'];
  return isPeriod(value) ? PERIOD_RANGES[value] : null;
}

function bindSearchRange(statement: D1PreparedStatement, range: PeriodRange): D1PreparedStatement {
  return range.searchBindValue ? statement.bind(range.searchBindValue) : statement;
}

function resultRows(result: { readonly results?: unknown }): readonly Record<string, unknown>[] {
  return Array.isArray(result.results)
    ? result.results.filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null)
    : [];
}

function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const range = parsePeriod(new URL(context.request.url));
    if (!range) {
      return Response.json(
        { ok: false, error: 'period는 today, 24h, 3, 7, 30, 90만 가능합니다.' },
        { status: 400 }
      );
    }

    const [summaryResult, allTermsResult, missingTermsResult, visitorSummaryResult, dailyVisitorsResult, dailySearchesResult] = await Promise.all([
      bindSearchRange(context.env.DB.prepare(`
        SELECT
          COUNT(*) AS total_searches,
          COUNT(DISTINCT normalized_query) AS unique_terms,
          COALESCE(SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END), 0) AS zero_result_searches
        FROM search_logs
        WHERE normalized_query <> 'aggregate'
          AND created_at >= ${range.searchSql}
      `), range).all(),
      bindSearchRange(context.env.DB.prepare(`
        SELECT
          normalized_query AS query,
          COUNT(*) AS search_count,
          SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END) AS zero_result_count,
          MAX(created_at) AS last_searched_at
        FROM search_logs
        WHERE normalized_query <> 'aggregate'
          AND created_at >= ${range.searchSql}
        GROUP BY normalized_query
        ORDER BY search_count DESC, last_searched_at DESC
        LIMIT 200
      `), range).all(),
      bindSearchRange(context.env.DB.prepare(`
        SELECT
          logs.normalized_query AS query,
          COUNT(*) AS zero_result_count,
          MAX(logs.created_at) AS last_searched_at
        FROM search_logs AS logs
        WHERE logs.normalized_query <> 'aggregate'
          AND logs.result_count = 0
          AND logs.created_at >= ${range.searchSql}
          AND NOT EXISTS (
            SELECT 1
            FROM search_candidates AS candidate
            WHERE candidate.status = 'approved'
              AND candidate.normalized_query = logs.normalized_query
          )
        GROUP BY logs.normalized_query
        ORDER BY zero_result_count DESC, last_searched_at DESC
        LIMIT 200
      `), range).all(),
      context.env.DB.prepare(`
        SELECT
          COUNT(*) AS daily_visitor_total,
          COALESCE(SUM(page_views), 0) AS page_views
        FROM visitor_daily_stats
        WHERE day >= ${range.visitorDaySql}
      `).all(),
      context.env.DB.prepare(`
        SELECT
          day,
          COUNT(*) AS unique_visitors,
          COALESCE(SUM(page_views), 0) AS page_views
        FROM visitor_daily_stats
        WHERE day >= ${range.visitorDaySql}
        GROUP BY day
        ORDER BY day ASC
      `).all(),
      context.env.DB.prepare(`
        SELECT
          date(created_at, '+9 hours') AS day,
          COUNT(*) AS search_count
        FROM search_logs
        WHERE normalized_query <> 'aggregate'
          AND date(created_at, '+9 hours') >= ${range.visitorDaySql}
        GROUP BY date(created_at, '+9 hours')
        ORDER BY day ASC
      `).all(),
    ]);

    const summaryRow = resultRows(summaryResult)[0] ?? {};
    const visitorSummaryRow = resultRows(visitorSummaryResult)[0] ?? {};
    const allSearchTerms = resultRows(allTermsResult);
    const missingTerms = resultRows(missingTermsResult);
    const dailyByDay = new Map(
      resultRows(dailyVisitorsResult).map((row) => [String(row.day ?? ''), { ...row, search_count: 0 }])
    );
    resultRows(dailySearchesResult).forEach((row) => {
      const day = String(row.day ?? '');
      const current = dailyByDay.get(day) ?? { day, unique_visitors: 0, page_views: 0, search_count: 0 };
      dailyByDay.set(day, { ...current, search_count: numberValue(row.search_count) });
    });
    const daily = [...dailyByDay.values()].sort((left, right) => String(left.day).localeCompare(String(right.day)));

    return Response.json({
      ok: true,
      period: range.period,
      periodLabel: range.label,
      summary: {
        totalSearches: numberValue(summaryRow.total_searches),
        uniqueTerms: numberValue(summaryRow.unique_terms),
        zeroResultSearches: numberValue(summaryRow.zero_result_searches),
      },
      missingTerms,
      allSearchTerms,
      visitorStats: {
        dailyVisitorTotal: numberValue(visitorSummaryRow.daily_visitor_total),
        pageViews: numberValue(visitorSummaryRow.page_views),
        daily,
      },
      topSearches: allSearchTerms.map((row) => ({
        normalized_query: row.query,
        search_count: row.search_count,
        zero_result_count: row.zero_result_count,
        last_searched_at: row.last_searched_at,
      })),
      zeroResultSearches: missingTerms.map((row) => ({
        normalized_query: row.query,
        zero_result_count: row.zero_result_count,
        last_searched_at: row.last_searched_at,
      })),
      clickedItems: [],
      clickCount: 0,
      recentSearches: [],
      calculationConditions: [],
    });
  } catch (error) {
    console.error('search-stats error', error instanceof Error ? error.message : 'unknown');
    return Response.json(
      { ok: false, error: '검색·방문 통계 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
};
