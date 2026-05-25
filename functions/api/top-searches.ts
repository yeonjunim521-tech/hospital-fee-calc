interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const result = await context.env.DB.prepare(`
      SELECT
        query,
        normalized_query,
        COUNT(*) AS search_count
      FROM search_logs
      WHERE result_count > 0
      GROUP BY normalized_query
      ORDER BY search_count DESC, created_at DESC
      LIMIT 100
    `)
      .all();

    const rows = Array.isArray(result.results) ? result.results : [];

    return Response.json({
      ok: true,
      topSearches: rows
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("top-searches error", message);
    return Response.json(
      { ok: false, error: "인기 검색어 조회 중 오류가 발생했습니다.", detail: message },
      { status: 500 }
    );
  }
};
