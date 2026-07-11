import { purgeExpiredTelemetry } from '../telemetry.ts';

interface Env { DB: D1Database; }

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    return Response.json({ ok: true, deleted: await purgeExpiredTelemetry(context.env.DB) });
  } catch (error) {
    console.error('purge-telemetry error', error);
    return Response.json({ ok: false, error: '분석 로그 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
};
