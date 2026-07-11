interface Env {
  DB: D1Database;
}

const MINIMUM_PUBLIC_SEARCH_COUNT = 5;

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const result = await context.env.DB.prepare(`
      SELECT
        COUNT(*) AS search_count
      FROM search_logs
      WHERE result_count > 0
      GROUP BY normalized_query
      HAVING COUNT(*) >= ${MINIMUM_PUBLIC_SEARCH_COUNT}
      ORDER BY search_count DESC, created_at DESC
      LIMIT 20
    `)
      .all();

    const rows = Array.isArray(result.results) ? result.results : [];
    const topSearches = rows.flatMap((row) => {
      if (!row || typeof row !== "object" || !("search_count" in row)) return [];
      const searchCount = Number(row.search_count);
      return Number.isFinite(searchCount) ? [{ searchCount }] : [];
    });

    return Response.json({
      ok: true,
      topSearches
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  } catch (error) {
    console.error("top-searches error", error);
    return Response.json(
      { ok: false, error: "인기 검색어 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
