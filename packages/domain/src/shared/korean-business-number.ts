/** 사업자등록번호 숫자 최대 길이 (XXX-XX-XXXXX) */
export const MAX_KOREAN_BUSINESS_NUMBER_DIGITS = 10

function toHalfWidthDigits(value: string): string {
  return value.replace(/[０-９]/g, digit => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
}

export function countKoreanBusinessNumberDigits(value: string, end = value.length): number {
  let count = 0
  const limit = Math.min(end, value.length)
  for (let i = 0; i < limit; i += 1) {
    if (/\d/.test(value[i]!)) count += 1
  }
  return count
}

export function caretIndexForBusinessNumberDigitCount(
  formatted: string,
  digitCount: number
): number {
  if (digitCount <= 0) return 0
  let seen = 0
  for (let i = 0; i < formatted.length; i += 1) {
    if (/\d/.test(formatted[i]!)) {
      seen += 1
      if (seen === digitCount) return i + 1
    }
  }
  return formatted.length
}

/** 숫자만 남기고 최대 10자리로 자릅니다. */
export function normalizeKoreanBusinessNumberDigits(value: string): string {
  return toHalfWidthDigits(value)
    .replace(/\D/g, '')
    .slice(0, MAX_KOREAN_BUSINESS_NUMBER_DIGITS)
}

/** 입력 중·완성 모두 하이픈을 붙입니다. 형식: XXX-XX-XXXXX */
export function formatKoreanBusinessNumber(value: string): string {
  const digits = normalizeKoreanBusinessNumberDigits(value)
  if (!digits) return ''
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

/** 10자리 숫자(하이픈 허용)인지 확인합니다. 빈 값은 false입니다. */
export function isValidKoreanBusinessNumber(value: string): boolean {
  const digits = normalizeKoreanBusinessNumberDigits(value)
  return digits.length === MAX_KOREAN_BUSINESS_NUMBER_DIGITS
}

export type KoreanBusinessNumberInputChangeResult = {
  formatted: string
  caret: number
}

/**
 * 입력/붙여넣기/Backspace 후 표시값과 캐럿 위치를 계산합니다.
 * 하이픈만 지운 경우에는 바로 앞 숫자를 함께 지웁니다.
 */
export function applyKoreanBusinessNumberInputChange(
  previousValue: string,
  nextRawValue: string,
  selectionStart: number | null
): KoreanBusinessNumberInputChangeResult {
  const prevDigits = toHalfWidthDigits(previousValue).replace(/\D/g, '')
  const nextDigitsRaw = toHalfWidthDigits(nextRawValue).replace(/\D/g, '')
  const caretInRaw = selectionStart ?? nextRawValue.length
  let digits = nextDigitsRaw.slice(0, MAX_KOREAN_BUSINESS_NUMBER_DIGITS)
  let targetDigitCount = countKoreanBusinessNumberDigits(nextRawValue, caretInRaw)

  if (nextDigitsRaw === prevDigits && nextRawValue.length < previousValue.length) {
    const removeAt = Math.max(0, countKoreanBusinessNumberDigits(nextRawValue, caretInRaw) - 1)
    digits = `${prevDigits.slice(0, removeAt)}${prevDigits.slice(removeAt + 1)}`.slice(
      0,
      MAX_KOREAN_BUSINESS_NUMBER_DIGITS
    )
    targetDigitCount = removeAt
  }

  if (targetDigitCount > digits.length) targetDigitCount = digits.length

  const formatted = formatKoreanBusinessNumber(digits)
  return {
    formatted,
    caret: caretIndexForBusinessNumberDigitCount(formatted, targetDigitCount),
  }
}
