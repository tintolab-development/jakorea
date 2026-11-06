/** 원천징수 설정 상세 입력값의 화면 검증 규칙. */

export const WITHHOLDING_RATE_MIN = 0
export const WITHHOLDING_RATE_MAX = 100
export const WITHHOLDING_RATE_PRECISION = 2

/** 금액은 API의 정수 계약을 JS에서 안전하게 표현할 수 있는 범위까지만 허용한다. */
export const WITHHOLDING_AMOUNT_MIN = 0
export const WITHHOLDING_AMOUNT_MAX = Number.MAX_SAFE_INTEGER

function isBlank(value: string): boolean {
  return value.trim() === ''
}

function decimalPlaces(value: string): number {
  const [, fraction = ''] = value.trim().split('.')
  return fraction.length
}

export function validateWithholdingRate(value: string): string | null {
  const normalized = value.trim()
  if (isBlank(normalized)) return null

  const numeric = Number(normalized)
  if (
    !Number.isFinite(numeric) ||
    numeric < WITHHOLDING_RATE_MIN ||
    numeric > WITHHOLDING_RATE_MAX ||
    decimalPlaces(normalized) > WITHHOLDING_RATE_PRECISION
  ) {
    return '0~100 사이의 숫자를 소수 둘째 자리까지 입력해 주세요.'
  }
  return null
}

export function validateWithholdingAmount(value: string): string | null {
  const normalized = value.trim().replace(/,/g, '')
  if (isBlank(normalized)) return null

  const numeric = Number(normalized)
  if (
    !Number.isSafeInteger(numeric) ||
    numeric < WITHHOLDING_AMOUNT_MIN ||
    numeric > WITHHOLDING_AMOUNT_MAX
  ) {
    return `0원 이상 ${WITHHOLDING_AMOUNT_MAX.toLocaleString('ko-KR')}원 이하의 정수를 입력해 주세요.`
  }
  return null
}

/** Figma 원천징수 모달에 노출되는 필드만 검증 (근로소득공제 UI 제거) */
export type WithholdingInputErrors = {
  exclusionMax: string | null
  rateBusiness: string | null
  rateOther: string | null
  ratePrize: string | null
  rateInterview: string | null
}

export const EMPTY_WITHHOLDING_INPUT_ERRORS: WithholdingInputErrors = {
  exclusionMax: null,
  rateBusiness: null,
  rateOther: null,
  ratePrize: null,
  rateInterview: null,
}
