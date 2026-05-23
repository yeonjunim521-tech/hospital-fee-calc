interface Env {
  DB: D1Database;
}

function clampText(value: unknown, maxLength: number): string | null {
  return typeof value === "string" ? value.slice(0, maxLength) : null;
}

function clampNumber(value: unknown, maxValue = 1000000000): number {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(0, Math.min(Math.round(numberValue), maxValue));
}

function safeJson(value: unknown): string {
  return JSON.stringify(value ?? []).slice(0, 10000);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as {
      hospitalClass?: string;
      treatmentType?: string;
      nonBenefitRegion?: string;
      roomType?: string;
      stayDays?: number;
      hasInsurance?: boolean;
      insuranceGeneration?: string;
      hasSanjeong?: boolean;
      sanjeongDisease?: string;
      selectedTests?: unknown[];
      selectedSurgeries?: unknown[];
      selectedProcedures?: unknown[];
      finalCost?: number;
      totalCost?: number;
      refundCost?: number;
      path?: string;
    };

    const hospitalClass = clampText(body.hospitalClass, 80);
    const treatmentType = clampText(body.treatmentType, 80);
    const nonBenefitRegion = clampText(body.nonBenefitRegion, 80);

    if (!hospitalClass || !treatmentType || !nonBenefitRegion) {
      return Response.json(
        { ok: false, error: "필수 계산 조건이 누락되었습니다." },
        { status: 400 }
      );
    }

    const userAgent = context.request.headers.get("user-agent")?.slice(0, 300) ?? null;

    await context.env.DB.prepare(`
      INSERT INTO calculation_logs (
        hospital_class,
        treatment_type,
        nonbenefit_region,
        room_type,
        stay_days,
        has_insurance,
        insurance_generation,
        has_sanjeong,
        sanjeong_disease,
        selected_tests_json,
        selected_surgeries_json,
        selected_procedures_json,
        final_cost,
        total_cost,
        refund_cost,
        path,
        user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        hospitalClass,
        treatmentType,
        nonBenefitRegion,
        clampText(body.roomType, 80),
        clampNumber(body.stayDays, 365),
        body.hasInsurance ? 1 : 0,
        clampText(body.insuranceGeneration, 80),
        body.hasSanjeong ? 1 : 0,
        clampText(body.sanjeongDisease, 80),
        safeJson(body.selectedTests),
        safeJson(body.selectedSurgeries),
        safeJson(body.selectedProcedures),
        clampNumber(body.finalCost),
        clampNumber(body.totalCost),
        clampNumber(body.refundCost),
        clampText(body.path, 200),
        userAgent
      )
      .run();

    return Response.json({ ok: true });
  } catch (error) {
    console.error("calculation-log error", error);

    return Response.json(
      { ok: false, error: "계산 로그 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
};
