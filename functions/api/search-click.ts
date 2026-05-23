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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as {
      searchQuery?: string;
      clickedItemId?: string;
      clickedItemName?: string;
      path?: string;
    };

    const searchQuery = typeof body.searchQuery === "string" ? body.searchQuery : "";
    const normalizedQuery = normalizeQuery(searchQuery);

    if (!normalizedQuery) {
      return Response.json(
        { ok: false, error: "검색어가 비어 있습니다." },
        { status: 400 }
      );
    }

    const clickedItemId = typeof body.clickedItemId === "string"
      ? body.clickedItemId.slice(0, 100)
      : null;

    const clickedItemName = typeof body.clickedItemName === "string"
      ? body.clickedItemName.slice(0, 200)
      : null;

    const path = typeof body.path === "string"
      ? body.path.slice(0, 200)
      : null;

    await context.env.DB.prepare(`
      INSERT INTO search_click_logs (
        search_query,
        normalized_query,
        clicked_item_id,
        clicked_item_name,
        path
      ) VALUES (?, ?, ?, ?, ?)
    `)
      .bind(
        searchQuery.slice(0, 100),
        normalizedQuery,
        clickedItemId,
        clickedItemName,
        path
      )
      .run();

    return Response.json({ ok: true });
  } catch (error) {
    console.error("search-click error", error);

    return Response.json(
      { ok: false, error: "클릭 로그 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
