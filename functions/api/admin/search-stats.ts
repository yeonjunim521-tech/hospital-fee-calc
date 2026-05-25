interface Env {
  DB: D1Database;
}

function rows(result: any) {
  return Array.isArray(result.results) ? result.results : [];
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const days = Math.max(1, Math.min(Number(url.searchParams.get("days") ?? 30), 365));

    const topSearches = await context.env.DB.prepare(`
      SELECT
        normalized_query,
        COUNT(*) AS search_count,
        AVG(result_count) AS avg_result_count,
        SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END) AS zero_result_count
      FROM search_logs
      WHERE created_at >= datetime('now', ?)
      GROUP BY normalized_query
      ORDER BY search_count DESC
      LIMIT 50
    `)
      .bind(`-${days} days`)
      .all();

    const zeroResultSearches = await context.env.DB.prepare(`
      SELECT
        normalized_query,
        COUNT(*) AS zero_result_count
      FROM search_logs
      WHERE result_count = 0
        AND created_at >= datetime('now', ?)
      GROUP BY normalized_query
      ORDER BY zero_result_count DESC
      LIMIT 50
    `)
      .bind(`-${days} days`)
      .all();

    const clickedItems = await context.env.DB.prepare(`
      SELECT
        clicked_item_name,
        COUNT(*) AS click_count
      FROM search_click_logs
      WHERE created_at >= datetime('now', ?)
        AND clicked_item_name IS NOT NULL
      GROUP BY clicked_item_name
      ORDER BY click_count DESC
      LIMIT 50
    `)
      .bind(`-${days} days`)
      .all();

    const recentSearches = await context.env.DB.prepare(`
      SELECT
        id,
        query,
        normalized_query,
        result_count,
        path,
        created_at
      FROM search_logs
      ORDER BY created_at DESC
      LIMIT 50
    `)
      .all();

    const calculationConditions = await context.env.DB.prepare(`
      SELECT
        hospital_class,
        treatment_type,
        nonbenefit_region,
        COUNT(*) AS calculation_count
      FROM calculation_logs
      WHERE created_at >= datetime('now', ?)
      GROUP BY hospital_class, treatment_type, nonbenefit_region
      ORDER BY calculation_count DESC
      LIMIT 50
    `)
      .bind(`-${days} days`)
      .all();

    return Response.json({
      ok: true,
      days,
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
