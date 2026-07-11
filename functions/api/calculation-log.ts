import { countHourlyTelemetryRequest, limitedText, purgeExpiredTelemetry, RATE_LIMIT_MAX_REQUESTS_PER_HOUR } from './telemetry.ts';

interface Env { DB: D1Database; }
const HOSPITAL_CLASSES = new Set(['clinic', 'hospital', 'general_hospital', 'tertiary_hospital']);
const TREATMENT_TYPES = new Set(['outpatient', 'er', 'inpatient']);
const REGION_CODES = new Set(['national', '11', '26', '27', '28', '29', '30', '31', '36', '41', '42', '43', '44', '45', '46', '47', '48', '50']);
const STAY_DAY_BUCKETS = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8_or_more']);
const COST_BUCKETS = new Set(['under_50k', '50k_to_199k', '200k_or_more']);

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as { hospitalClass?: unknown; treatmentType?: unknown; nonBenefitRegion?: unknown; stayDaysBucket?: unknown; hasInsurance?: unknown; finalCostBucket?: unknown };
    const hospitalClass = limitedText(body.hospitalClass, 30);
    const treatmentType = limitedText(body.treatmentType, 20);
    const nonBenefitRegion = limitedText(body.nonBenefitRegion, 10);
    const stayDaysBucket = limitedText(body.stayDaysBucket, 20);
    const finalCostBucket = limitedText(body.finalCostBucket, 20);
    const clientIp = context.request.headers.get('CF-Connecting-IP');
    if (!hospitalClass || !treatmentType || !nonBenefitRegion || !stayDaysBucket || !finalCostBucket || !clientIp || !HOSPITAL_CLASSES.has(hospitalClass) || !TREATMENT_TYPES.has(treatmentType) || !REGION_CODES.has(nonBenefitRegion) || !STAY_DAY_BUCKETS.has(stayDaysBucket) || !COST_BUCKETS.has(finalCostBucket) || typeof body.hasInsurance !== 'boolean') {
      return Response.json({ ok: false, error: '분석 요청이 유효하지 않습니다.' }, { status: 400 });
    }
    await purgeExpiredTelemetry(context.env.DB);
    if (await countHourlyTelemetryRequest(context.env.DB, clientIp, 'calculation-log') > RATE_LIMIT_MAX_REQUESTS_PER_HOUR) {
      return Response.json({ ok: false, error: '요청이 너무 많습니다.' }, { status: 429, headers: { 'Retry-After': '3600' } });
    }
    await context.env.DB.prepare('INSERT INTO calculation_logs (hospital_class, treatment_type, nonbenefit_region, stay_days, has_insurance, final_cost, path) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(hospitalClass, treatmentType, nonBenefitRegion, stayDaysBucket === '8_or_more' ? 8 : Number(stayDaysBucket), body.hasInsurance ? 1 : 0, ['under_50k', '50k_to_199k', '200k_or_more'].indexOf(finalCostBucket) + 1, '/calculator').run();
    return Response.json({ ok: true });
  } catch (error) {
    console.error('calculation-log error', error);
    return Response.json({ ok: false, error: '계산 로그 저장 중 오류가 발생했습니다.' }, { status: 500 });
  }
};
