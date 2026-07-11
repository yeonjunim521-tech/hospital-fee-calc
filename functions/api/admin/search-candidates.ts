interface Env {
  DB: D1Database;
}

type CandidateStatus = "pending" | "approved" | "rejected";
type JsonRecord = Readonly<Record<string, unknown>>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeQuery(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 100);
}

function parseStatus(value: unknown): CandidateStatus | null {
  switch (value) {
    case "pending":
    case "approved":
    case "rejected":
      return value;
    default:
      return null;
  }
}

function rows(result: { readonly results?: unknown }): readonly unknown[] {
  return Array.isArray(result.results) ? result.results : [];
}

function parseNonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function isOfficialHiraUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (url.hostname === "hira.or.kr" || url.hostname.endsWith(".hira.or.kr"));
  } catch (error) {
    if (error instanceof TypeError) return false;
    throw error;
  }
}

function parseKeywords(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.flatMap((entry) => {
    const keyword = normalizeQuery(clampText(entry, 100));
    return keyword ? [keyword] : [];
  }))].slice(0, 20);
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const statusParam = url.searchParams.get("status");
    const status = statusParam ? parseStatus(statusParam) : null;
    const normalizedQuery = normalizeQuery(url.searchParams.get("query") ?? "");

    if (statusParam && !status) {
      return Response.json({ ok: false, error: "허용되지 않은 상태입니다." }, { status: 400 });
    }

    const statusClause = status ? "status = ? AND" : "";
    const statement = context.env.DB.prepare(`
      SELECT id, query, normalized_query, item_id, item_name, item_category,
             status, created_at, updated_at
      FROM search_candidates
      WHERE ${statusClause} (? = '' OR normalized_query = ?)
      ORDER BY updated_at DESC, id DESC
      LIMIT 100
    `);
    const result = status
      ? await statement.bind(status, normalizedQuery, normalizedQuery).all()
      : await statement.bind(normalizedQuery, normalizedQuery).all();

    return Response.json({ ok: true, candidates: rows(result) });
  } catch (error) {
    console.error("search-candidates get error", error instanceof Error ? error.message : "unknown");
    return Response.json({ ok: false, error: "후보 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const unknownBody: unknown = await context.request.json();
    if (!isRecord(unknownBody)) {
      return Response.json({ ok: false, error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
    }

    const query = clampText(unknownBody.query, 100);
    const normalizedQuery = normalizeQuery(query);
    const code = clampText(unknownBody.code, 100) || clampText(unknownBody.itemId, 100);
    const name = clampText(unknownBody.name, 200) || clampText(unknownBody.itemName, 200);
    const category = clampText(unknownBody.category, 100) || clampText(unknownBody.itemCategory, 100);
    const status = unknownBody.status === undefined ? "pending" : parseStatus(unknownBody.status);

    if (normalizedQuery.length < 2 || !name) {
      return Response.json({ ok: false, error: "검색어와 항목명은 필수입니다." }, { status: 400 });
    }
    if (!status) {
      return Response.json({ ok: false, error: "허용되지 않은 상태입니다." }, { status: 400 });
    }

    if (status !== "approved") {
      await context.env.DB.prepare(`
        INSERT INTO search_candidates (
          query, normalized_query, item_id, item_name, item_category, status, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(query, normalizedQuery, code || null, name, category || null, status).run();
      return Response.json({ ok: true });
    }

    const group = clampText(unknownBody.group, 50);
    const type = clampText(unknownBody.type, 50);
    const clinicPrice = parseNonNegativeInteger(unknownBody.clinicPrice);
    const hospitalPrice = parseNonNegativeInteger(unknownBody.hospitalPrice);
    const isBenefit = typeof unknownBody.isBenefit === "boolean" ? unknownBody.isBenefit : null;
    const sourceUrl = clampText(unknownBody.sourceUrl, 500);
    const sourceDate = clampText(unknownBody.sourceDate, 10);

    if (!code || !category || !group || !type || clinicPrice === null || hospitalPrice === null
      || isBenefit === null || !isOfficialHiraUrl(sourceUrl) || !/^\d{4}-\d{2}-\d{2}$/.test(sourceDate)) {
      return Response.json({ ok: false, error: "승인에는 코드, 분류, 가격, 급여 구분, HIRA 출처가 필요합니다." }, { status: 400 });
    }

    const aliases = [...new Set([normalizedQuery, ...parseKeywords(unknownBody.keywords)])];
    const statements = [
      context.env.DB.prepare(`
        INSERT INTO search_candidates (
          query, normalized_query, item_id, item_name, item_category, status, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'approved', CURRENT_TIMESTAMP)
      `).bind(query, normalizedQuery, code, name, category),
      context.env.DB.prepare(`
        INSERT INTO medical_items (
          code, name, category, item_group, item_type, clinic_price, hospital_price,
          is_benefit, source_url, source_date, status, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', CURRENT_TIMESTAMP)
        ON CONFLICT(code) DO UPDATE SET
          name = excluded.name, category = excluded.category, item_group = excluded.item_group,
          item_type = excluded.item_type, clinic_price = excluded.clinic_price,
          hospital_price = excluded.hospital_price, is_benefit = excluded.is_benefit,
          source_url = excluded.source_url, source_date = excluded.source_date,
          status = 'approved', updated_at = CURRENT_TIMESTAMP
      `).bind(code, name, category, group, type, clinicPrice, hospitalPrice, isBenefit ? 1 : 0, sourceUrl, sourceDate),
      context.env.DB.prepare("DELETE FROM medical_item_aliases WHERE item_code = ?").bind(code),
      ...aliases.map((alias) => context.env.DB.prepare(`
        INSERT INTO medical_item_aliases (item_code, normalized_alias) VALUES (?, ?)
      `).bind(code, alias)),
    ];

    await context.env.DB.batch(statements);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("search-candidates post error", error instanceof Error ? error.message : "unknown");
    return Response.json({ ok: false, error: "후보 저장 중 오류가 발생했습니다." }, { status: 500 });
  }
};
