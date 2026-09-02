interface Env {
  DB: D1Database;
}

type DeleteBody = {
  type?: unknown;
  value?: unknown;
  hospitalClass?: unknown;
  treatmentType?: unknown;
  nonbenefitRegion?: unknown;
};

function normalizedTerm(value: unknown): string {
  return typeof value === 'string'
    ? value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('ko-KR').slice(0, 80)
    : '';
}

function safeInteger(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as DeleteBody;
    const type = typeof body.type === 'string' ? body.type : '';

    if (type === 'all') {
      return Response.json({ ok: false, error: '전체 로그 삭제는 지원하지 않습니다.' }, { status: 400 });
    }

    if (type === 'search-term' || type === 'top-search' || type === 'zero-search') {
      const term = normalizedTerm(body.value);
      if (!term) return Response.json({ ok: false, error: '삭제할 검색어가 유효하지 않습니다.' }, { status: 400 });
      if (term === 'aggregate') {
        return Response.json({ ok: false, error: '기존 집계 기록은 삭제할 수 없습니다.' }, { status: 400 });
      }
      const result = await context.env.DB.prepare('DELETE FROM search_logs WHERE normalized_query = ?').bind(term).run();
      return Response.json({ ok: true, deleted: result.meta?.changes ?? 0 });
    }

    if (type === 'candidate-history') {
      const candidateId = safeInteger(body.value);
      if (!candidateId) return Response.json({ ok: false, error: '삭제할 완료 이력이 유효하지 않습니다.' }, { status: 400 });
      const result = await context.env.DB.prepare("DELETE FROM search_candidates WHERE id = ? AND status = 'approved'")
        .bind(candidateId).run();
      return Response.json({
        ok: true,
        deleted: result.meta?.changes ?? 0,
        publishedItemPreserved: true,
      });
    }

    if (type === 'recent-search') {
      const searchId = safeInteger(body.value);
      if (!searchId) return Response.json({ ok: false, error: '삭제할 검색 기록이 유효하지 않습니다.' }, { status: 400 });
      const result = await context.env.DB.prepare("DELETE FROM search_logs WHERE id = ? AND normalized_query <> 'aggregate'")
        .bind(searchId).run();
      return Response.json({ ok: true, deleted: result.meta?.changes ?? 0 });
    }

    if (type === 'click-log' && typeof body.value === 'string') {
      const result = await context.env.DB.prepare('DELETE FROM search_click_logs WHERE clicked_item_name = ?')
        .bind(body.value.slice(0, 200)).run();
      return Response.json({ ok: true, deleted: result.meta?.changes ?? 0 });
    }

    if (type === 'calc-log'
      && typeof body.hospitalClass === 'string'
      && typeof body.treatmentType === 'string'
      && typeof body.nonbenefitRegion === 'string') {
      const result = await context.env.DB.prepare(`
        DELETE FROM calculation_logs
        WHERE hospital_class = ? AND treatment_type = ? AND nonbenefit_region = ?
      `).bind(body.hospitalClass, body.treatmentType, body.nonbenefitRegion).run();
      return Response.json({ ok: true, deleted: result.meta?.changes ?? 0 });
    }

    return Response.json({ ok: false, error: '삭제 타입이 유효하지 않습니다.' }, { status: 400 });
  } catch (error) {
    console.error('delete-log error', error instanceof Error ? error.message : 'unknown');
    return Response.json({ ok: false, error: '로그 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
};
