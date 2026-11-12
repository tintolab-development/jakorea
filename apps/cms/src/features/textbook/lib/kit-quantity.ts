/** 전역 키트 수량 입력 검증. 기본 24·32권은 정책 안내일 뿐 조회 대체값이 아니다. */

/** QA-0111: 키트 1개당 교재 권수 자릿수 상한 (1~999권, 임시안 — 기획 확인 필요) */
export const KIT_QUANTITY_MAX_DIGITS = 3
export const KIT_QUANTITY_MIN = 1
export const KIT_QUANTITY_MAX = 10 ** KIT_QUANTITY_MAX_DIGITS - 1

export const KIT_QUANTITY_RANGE_MESSAGE = `수량은 ${KIT_QUANTITY_MIN}~${KIT_QUANTITY_MAX} 사이의 정수로 입력해 주세요.`
export const KIT_QUANTITY_INVALID_CHAR_MESSAGE = '수량은 숫자만 입력할 수 있습니다.'
export const KIT_QUANTITY_TOO_LONG_MESSAGE = `수량은 최대 ${KIT_QUANTITY_MAX_DIGITS}자리까지 입력할 수 있습니다.`

export function isValidKitQuantityInput(value: string): boolean {
  return new RegExp(`^[1-9]\\d{0,${KIT_QUANTITY_MAX_DIGITS - 1}}$`).test(value.trim())
}

export function parseKitQuantityInput(value: string): number {
  const trimmed = value.trim()
  if (!isValidKitQuantityInput(trimmed)) {
    throw new Error(KIT_QUANTITY_RANGE_MESSAGE)
  }
  return Number(trimmed)
}
