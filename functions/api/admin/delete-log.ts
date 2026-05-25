interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as {
      type?: string;
      value?: string | number;
      hospitalClass?: string;
      treatmentType?: string;
      nonbenefitRegion?: string;
    };

    const type = body.type;
    if (!type) {
      return Response.json({ ok: false, error: "삭제 타입이 유효하지 않습니다." }, { status: 400 });
    }

    let queryStr = '';
    let params: any[] = [];

    if (type === 'all') {
      await context.env.DB.batch([
        context.env.DB.prepare(`DELETE FROM search_logs`),
        context.env.DB.prepare(`DELETE FROM search_click_logs`),
        context.env.DB.prepare(`DELETE FROM calculation_logs`),
      ]);

      return Response.json({ ok: true, deleted: 'all' }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
    } else if (type === 'top-search' || type === 'zero-search') {
      // 쿼리(normalized_query) 기준 search_logs 일괄 삭제
      queryStr = `DELETE FROM search_logs WHERE normalized_query = ?`;
      params = [String(body.value).trim().toLowerCase()];
    } else if (type === 'click-log') {
      // 클릭한 아이템 기준 search_click_logs 일괄 삭제
      queryStr = `DELETE FROM search_click_logs WHERE clicked_item_name = ?`;
      params = [String(body.value)];
    } else if (type === 'recent-search') {
      // 개별 최근 검색 로그 행 삭제
      queryStr = `DELETE FROM search_logs WHERE id = ?`;
      params = [Number(body.value)];
    } else if (type === 'calc-log') {
      // 특정 병원/진료형태/지역 조건 로그 삭제
      queryStr = `DELETE FROM calculation_logs WHERE hospital_class = ? AND treatment_type = ? AND nonbenefit_region = ?`;
      params = [body.hospitalClass, body.treatmentType, body.nonbenefitRegion];
    } else {
      return Response.json({ ok: false, error: "알 수 없는 삭제 타입입니다." }, { status: 400 });
    }

    await context.env.DB.prepare(queryStr).bind(...params).run();

    return Response.json({ ok: true }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("delete-log error", message);
    return Response.json(
      { ok: false, error: "로그 삭제 중 오류가 발생했습니다.", detail: message },
      { status: 500 }
    );
  }
};
