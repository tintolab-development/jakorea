/**
 * 프로그램 등록 강사비(시간당) 입력 규칙.
 *
 * 입력칸에는 오류 문구를 띄우지 않는다: 숫자 외 문자는 지우고,
 * 최대 금액을 넘는 값은 입력 즉시 최대 금액으로 맞춘다(`clampWageFee`).
 * 등록 필수 검사의 범위 판정(`isWageFeeOutOfRange`)은 저장된 옛 값 대비 안전장치로 남긴다.
 */

/** 허용 범위(0 이상 max 이하) 밖이면 true. 빈 값은 범위 검사 대상이 아니다(필수 검사가 따로 막는다). */
export function isWageFeeOutOfRange(value: unknown, max: number): boolean {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false
  return value < 0 || value > max || !Number.isInteger(value)
}

/** 입력값을 0 ~ max 로 맞춘다 — 최대 금액 초과는 최대 금액으로 */
export function clampWageFee(value: number, max: number): number {
  return Math.min(Math.max(Math.trunc(value), 0), max)
}

/** 등록 화면 강사비 한도 — 일반·1사1교 공통(1·2·3급) */
export const REGISTRATION_WAGE_GRADE_FEE_MAX = {
  1: 500_000,
  2: 400_000,
  3: 300_000,
} as const
