interface Env {
  DB: D1Database;
}

type JsonRecord = Readonly<Record<string, unknown>>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function integer(value: unknown): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function toPublicItem(row: unknown): JsonRecord | null {
  if (!isRecord(row)) return null;
  const code = text(row.code);
  const name = text(row.name);
  if (!code || !name) return null;

  return {
    code,
    name,
    category: text(row.category),
    group: text(row.item_group),
    type: text(row.item_type),
    clinicPrice: integer(row.clinic_price),
    hospitalPrice: integer(row.hospital_price),
    isBenefit: integer(row.is_benefit) === 1,
    sourceUrl: text(row.source_url),
    sourceDate: text(row.source_date),
    keywords: text(row.keywords).split("|").filter(Boolean),
  };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const query = new URL(context.request.url).searchParams.get("q")?.trim().toLowerCase().slice(0, 100) ?? "";
    const pattern = `%${query}%`;
    const result = await context.env.DB.prepare(`
      SELECT
        item.code,
        item.name,
        item.category,
        item.item_group,
        item.item_type,
        item.clinic_price,
        item.hospital_price,
        item.is_benefit,
        item.source_url,
        item.source_date,
        COALESCE(GROUP_CONCAT(alias.normalized_alias, '|'), '') AS keywords
      FROM medical_items AS item
      LEFT JOIN medical_item_aliases AS alias ON alias.item_code = item.code
      WHERE status = 'approved'
        AND (? = '%%' OR LOWER(item.code) LIKE ? OR LOWER(item.name) LIKE ?
          OR EXISTS (
            SELECT 1 FROM medical_item_aliases AS matched_alias
            WHERE matched_alias.item_code = item.code
              AND matched_alias.normalized_alias LIKE ?
          ))
      GROUP BY item.code
      ORDER BY item.name, item.code
      LIMIT 500
    `).bind(pattern, pattern, pattern, pattern).all();

    const sourceRows = Array.isArray(result.results) ? result.results : [];
    return Response.json({ ok: true, items: sourceRows.flatMap((row) => {
      const item = toPublicItem(row);
      return item ? [item] : [];
    }) }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300",
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("medical-items get error", error instanceof Error ? error.message : "unknown");
    return Response.json({ ok: false, error: "의료 항목 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
};
