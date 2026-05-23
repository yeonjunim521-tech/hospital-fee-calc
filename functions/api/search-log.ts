interface Env {
  DB: D1Database;
}

function normalizeQuery(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 100);
}

function isBlockedQuery(query: string): boolean {
  const blockedPatterns = [
    /\d{6}-\d{7}/,
    /\d{2,3}-\d{3,4}-\d{4}/,
    /[\w.-]+@[\w.-]+\.\w+/,
  ];

  return blockedPatterns.some((pattern) => pattern.test(query));
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as {
      query?: string;
      resultCount?: number;
      path?: string;
    };

    const rawQuery = typeof body.query === "string" ? body.query : "";
    const normalizedQuery = normalizeQuery(rawQuery);

    if (!normalizedQuery) {
      return Response.json(
        { ok: false, error: "검색어가 비어 있습니다." },
        { status: 400 }
      );
    }

    if (normalizedQuery.length < 2) {
      return Response.json(
        { ok: false, error: "검색어가 너무 짧습니다." },
        { status: 400 }
      );
    }

    if (isBlockedQuery(rawQuery)) {
      return Response.json(
        { ok: false, error: "개인정보로 추정되는 검색어는 저장하지 않습니다." },
        { status: 400 }
      );
    }

    const resultCount = Number.isFinite(body.resultCount)
      ? Math.max(0, Math.min(Number(body.resultCount), 100000))
      : 0;

    const path = typeof body.path === "string"
      ? body.path.slice(0, 200)
      : null;

    const userAgent = context.request.headers.get("user-agent")?.slice(0, 300) ?? null;

    await context.env.DB.prepare(`
      INSERT INTO search_logs (
        query,
        normalized_query,
        result_count,
        path,
        user_agent
      ) VALUES (?, ?, ?, ?, ?)
    `)
      .bind(rawQuery.slice(0, 100), normalizedQuery, resultCount, path, userAgent)
      .run();

    return Response.json({ ok: true });
  } catch (error) {
    console.error("search-log error", error);

    return Response.json(
      { ok: false, error: "검색 로그 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
