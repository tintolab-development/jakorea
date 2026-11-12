/**
 * 프로그램 등록 강사비(시간당) 입력 규칙 — QA-0383-ab40.
 *
 * 예전에는 한도를 넘으면 한도로 바꾸고 음수는 절댓값으로 바꿔 사용자가 값이 바뀐 이유를 알 수 없었다.
 * 이제 값을 임의로 바꾸지 않는다: 숫자 외 문자(음수 부호 포함)·자릿수 초과 입력은 거부하고,
 * 허용 범위(0 ~ 최대) 밖 값은 그대로 두고 오류를 안내하며 등록 필수 검사에서 막는다.
 */

export type WageFeeRejectReason = 'invalid-char' | 'too-long'

/** 최댓값 자릿수 — 이보다 긴 입력은 거부한다(예: 최대 500,000원 → 6자리) */
export function wageFeeMaxDigits(max: number): number {
  return String(Math.trunc(Math.abs(max))).length
}

export function formatWageFeeAmount(value: number): string {
  return value.toLocaleString('ko-KR')
}

/** 허용 범위(0 이상 max 이하) 밖이면 true. 빈 값은 범위 검사 대상이 아니다(필수 검사가 따로 막는다). */
export function isWageFeeOutOfRange(value: unknown, max: number): boolean {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false
  return value < 0 || value > max || !Number.isInteger(value)
}

export function wageFeeRangeMessage(max: number): string {
  return `0원 이상 ${formatWageFeeAmount(max)}원 이하로 입력해 주세요.`
}

export function wageFeeRejectMessage(reason: WageFeeRejectReason, max: number): string {
  if (reason === 'too-long') {
    return `최대 ${wageFeeMaxDigits(max)}자리(${formatWageFeeAmount(max)}원)까지 입력할 수 있습니다.`
  }
  return '숫자만 입력해 주세요. 음수는 입력할 수 없습니다.'
}

/** 입력칸 아래 안내 문구 — 거부된 입력이 우선, 그다음 범위 초과 */
export function resolveWageFeeInputMessage(
  value: unknown,
  max: number,
  rejected: WageFeeRejectReason | null
): string | undefined {
  if (rejected) return wageFeeRejectMessage(rejected, max)
  if (isWageFeeOutOfRange(value, max)) return wageFeeRangeMessage(max)
  return undefined
}

/** 등록 화면 강사비 한도 — 일반·1사1교 공통(1·2·3급) */
export const REGISTRATION_WAGE_GRADE_FEE_MAX = {
  1: 500_000,
  2: 400_000,
  3: 300_000,
} as const
