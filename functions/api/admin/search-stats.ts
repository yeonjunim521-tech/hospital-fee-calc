interface Env {
  DB: D1Database;
}

type Period = "today" | "24h" | "3" | "7" | "30" | "90";

type PeriodRange = {
  readonly period: Period;
  readonly label: string;
  readonly sql:
    | "datetime('now', '+9 hours', 'start of day', '-9 hours')"
    | "datetime('now', ?)";
  readonly bindValue: string | null;
};

const PERIOD_RANGES: Record<Period, PeriodRange> = {
  today: {
    period: "today",
    label: "today",
    sql: "datetime('now', '+9 hours', 'start of day', '-9 hours')",
    bindValue: null,
  },
  "24h": { period: "24h", label: "24h", sql: "datetime('now', ?)", bindValue: "-24 hours" },
  "3": { period: "3", label: "3 days", sql: "datetime('now', ?)", bindValue: "-3 days" },
  "7": { period: "7", label: "7 days", sql: "datetime('now', ?)", bindValue: "-7 days" },
  "30": { period: "30", label: "30 days", sql: "datetime('now', ?)", bindValue: "-30 days" },
  "90": { period: "90", label: "90 days", sql: "datetime('now', ?)", bindValue: "-90 days" },
} as const;

function isPeriod(value: string): value is Period {
  switch (value) {
    case "today":
    case "24h":
    case "3":
    case "7":
    case "30":
    case "90":
      return true;
    default:
      return false;
  }
}

function rows(result: { readonly results?: unknown }) {
  return Array.isArray(result.results) ? result.results : [];
}

function parsePeriod(url: URL): PeriodRange | null {
  const period = url.searchParams.get("period");
  if (period && isPeriod(period)) {
    return PERIOD_RANGES[period];
  }
  if (period) {
    return null;
  }

  const days = url.searchParams.get("days");
  if (days && isPeriod(days)) {
    return PERIOD_RANGES[days];
  }
  if (days) {
    return null;
  }

  return PERIOD_RANGES["30"];
}

function bindRange(statement: D1PreparedStatement, range: PeriodRange): D1PreparedStatement {
  return range.bindValue ? statement.bind(range.bindValue) : statement;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const range = parsePeriod(url);
    if (!range) {
      return Response.json(
        { ok: false, error: "period는 today, 24h, 3, 7, 30, 90만 가능합니다." },
        { status: 400 }
      );
    }

    const topSearches = await bindRange(context.env.DB.prepare(`
      SELECT
        normalized_query,
        COUNT(*) AS search_count,
        AVG(result_count) AS avg_result_count,
        SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END) AS zero_result_count
      FROM search_logs
      WHERE created_at >= ${range.sql}
      GROUP BY normalized_query
      ORDER BY search_count DESC
      LIMIT 50
    `), range)
      .all();

    const zeroResultSearches = await bindRange(context.env.DB.prepare(`
      SELECT
        normalized_query,
        COUNT(*) AS zero_result_count
      FROM search_logs
      WHERE result_count = 0
        AND created_at >= ${range.sql}
      GROUP BY normalized_query
      ORDER BY zero_result_count DESC
      LIMIT 50
    `), range)
      .all();

    const clickedItems = await bindRange(context.env.DB.prepare(`
      SELECT
        clicked_item_name,
        COUNT(*) AS click_count
      FROM search_click_logs
      WHERE created_at >= ${range.sql}
        AND clicked_item_name IS NOT NULL
      GROUP BY clicked_item_name
      ORDER BY click_count DESC
      LIMIT 50
    `), range)
      .all();

    const recentSearches = await bindRange(context.env.DB.prepare(`
      SELECT
        id,
        query,
        normalized_query,
        result_count,
        path,
        user_agent,
        created_at
      FROM search_logs
      WHERE created_at >= ${range.sql}
      ORDER BY created_at DESC
      LIMIT 50
    `), range)
      .all();

    const calculationConditions = await bindRange(context.env.DB.prepare(`
      SELECT
        hospital_class,
        treatment_type,
        nonbenefit_region,
        COUNT(*) AS calculation_count
      FROM calculation_logs
      WHERE created_at >= ${range.sql}
      GROUP BY hospital_class, treatment_type, nonbenefit_region
      ORDER BY calculation_count DESC
      LIMIT 50
    `), range)
      .all();

    return Response.json({
      ok: true,
      period: range.period,
      periodLabel: range.label,
      topSearches: rows(topSearches),
      zeroResultSearches: rows(zeroResultSearches),
      clickedItems: rows(clickedItems),
      recentSearches: rows(recentSearches),
      calculationConditions: rows(calculationConditions),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("search-stats error", message);

    return Response.json(
      { ok: false, error: "검색 통계 조회 중 오류가 발생했습니다.", detail: message },
      { status: 500 }
    );
  }
};
