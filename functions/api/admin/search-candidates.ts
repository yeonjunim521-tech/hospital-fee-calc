interface Env {
  DB: D1Database;
}

type CandidateStatus = "pending" | "approved" | "rejected";

function clampText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeQuery(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 100);
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

function rows(result: { readonly results?: unknown }) {
  return Array.isArray(result.results) ? result.results : [];
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const statusParam = url.searchParams.get("status");
    const status = statusParam ? parseStatus(statusParam) : null;
    const normalizedQuery = normalizeQuery(url.searchParams.get("query") ?? "");

    if (statusParam && !status) {
      return Response.json(
        { ok: false, error: "status는 pending, approved, rejected만 가능합니다." },
        { status: 400 }
      );
    }

    const statement = status
      ? context.env.DB.prepare(`
        SELECT
          id,
          query,
          normalized_query,
          item_id,
          item_name,
          item_category,
          status,
          created_at,
          updated_at
        FROM search_candidates
        WHERE status = ?
          AND (? = '' OR normalized_query = ?)
        ORDER BY updated_at DESC, id DESC
        LIMIT 100
      `).bind(status, normalizedQuery, normalizedQuery)
      : context.env.DB.prepare(`
        SELECT
          id,
          query,
          normalized_query,
          item_id,
          item_name,
          item_category,
          status,
          created_at,
          updated_at
        FROM search_candidates
        WHERE ? = '' OR normalized_query = ?
        ORDER BY updated_at DESC, id DESC
        LIMIT 100
      `).bind(normalizedQuery, normalizedQuery);

    const result = await statement.all();

    return Response.json({ ok: true, candidates: rows(result) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("search-candidates get error", message);

    return Response.json(
      { ok: false, error: "검색 후보 조회 중 오류가 발생했습니다.", detail: message },
      { status: 500 }
    );
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as {
      query?: string;
      itemId?: string;
      itemName?: string;
      itemCategory?: string;
      status?: string;
    };

    const query = clampText(body.query, 100);
    const normalizedQuery = normalizeQuery(query);
    const itemName = clampText(body.itemName, 200);

    if (normalizedQuery.length < 2 || !itemName) {
      return Response.json(
        { ok: false, error: "검색어와 항목명은 필수입니다." },
        { status: 400 }
      );
    }

    const status = body.status ? parseStatus(body.status) : "pending";
    if (!status) {
      return Response.json(
        { ok: false, error: "status는 pending, approved, rejected만 가능합니다." },
        { status: 400 }
      );
    }

    await context.env.DB.prepare(`
      INSERT INTO search_candidates (
        query,
        normalized_query,
        item_id,
        item_name,
        item_category,
        status,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)
      .bind(
        query,
        normalizedQuery,
        clampText(body.itemId, 100) || null,
        itemName,
        clampText(body.itemCategory, 100) || null,
        status
      )
      .run();

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("search-candidates post error", message);

    return Response.json(
      { ok: false, error: "검색 후보 저장 중 오류가 발생했습니다.", detail: message },
      { status: 500 }
    );
  }
};
