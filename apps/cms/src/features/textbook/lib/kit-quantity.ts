/** 전역 키트 수량 입력 검증. 기본 24·32권은 정책 안내일 뿐 조회 대체값이 아니다. */

export function isValidKitQuantityInput(value: string): boolean {
  return /^[1-9]\d*$/.test(value.trim())
}

export function parseKitQuantityInput(value: string): number {
  const trimmed = value.trim()
  if (!isValidKitQuantityInput(trimmed)) {
    throw new Error('키트 수량은 1 이상의 정수로 입력해 주세요.')
  }
  const parsed = Number(trimmed)
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error('키트 수량은 1 이상의 정수로 입력해 주세요.')
  }
  return parsed
}
