export const onRequestPost: PagesFunction = async () => Response.json(
  { ok: false, error: '클릭 통계는 더 이상 수집하지 않습니다.' },
  { status: 410 }
);
