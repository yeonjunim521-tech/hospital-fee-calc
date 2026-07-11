interface Env {
  DB: D1Database;
}

type AliasRow = Readonly<Record<string, unknown>>;

function isAliasRow(value: unknown): value is AliasRow {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(row: AliasRow, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value : "";
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const result = await context.env.DB.prepare(`
      SELECT normalized_query, item_id
      FROM search_candidates
      WHERE status = 'approved'
        AND item_id IS NOT NULL
        AND item_id != ''
      ORDER BY updated_at DESC, id DESC
      LIMIT 500
    `).all();
    const aliases = (Array.isArray(result.results) ? result.results : []).flatMap((row) => {
      if (!isAliasRow(row)) return [];
      const alias = readText(row, "normalized_query");
      const code = readText(row, "item_id");
      return alias && code ? [{ alias, code }] : [];
    });

    return Response.json({ ok: true, aliases }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("search-aliases get error", error instanceof Error ? error.message : "unknown");
    return Response.json({ ok: false, error: "검색 별칭 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
};
