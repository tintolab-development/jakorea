/** 국내 전화번호 숫자 최대 길이 */
export const MAX_KOREAN_PHONE_DIGITS = 11

export const KOREAN_MOBILE_PREFIX = '010'
export const KOREAN_SEOUL_PREFIX = '02'
export const KOREAN_VOIP_PREFIX = '070'

export const KOREAN_AREA_PREFIXES = [
  '031',
  '032',
  '033',
  '041',
  '042',
  '043',
  '044',
  '051',
  '052',
  '053',
  '054',
  '055',
  '061',
  '062',
  '063',
  '064',
] as const

const THREE_DIGIT_PREFIXES = new Set<string>([
  KOREAN_MOBILE_PREFIX,
  KOREAN_VOIP_PREFIX,
  ...KOREAN_AREA_PREFIXES,
])

function toHalfWidthDigits(value: string): string {
  return value.replace(/[０-９]/g, digit => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
}

export function countKoreanPhoneDigits(value: string, end = value.length): number {
  let count = 0
  const limit = Math.min(end, value.length)
  for (let i = 0; i < limit; i += 1) {
    if (/\d/.test(value[i]!)) count += 1
  }
  return count
}

export function caretIndexForDigitCount(formatted: string, digitCount: number): number {
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

/** 숫자만 남기고 최대 11자리로 자릅니다. */
export function normalizeKoreanPhoneDigits(value: string): string {
  return toHalfWidthDigits(value)
    .replace(/\D/g, '')
    .slice(0, MAX_KOREAN_PHONE_DIGITS)
}

export function detectKoreanPhonePrefix(digits: string): string | null {
  if (digits.length >= 3) {
    const three = digits.slice(0, 3)
    if (THREE_DIGIT_PREFIXES.has(three)) return three
  }
  if (digits.startsWith(KOREAN_SEOUL_PREFIX)) return KOREAN_SEOUL_PREFIX
  return null
}

function formatLocalNumber(prefix: string, rest: string): string {
  if (!rest) return prefix

  const isSeoul = prefix === KOREAN_SEOUL_PREFIX
  const isFixedThreeFourFour = prefix === KOREAN_MOBILE_PREFIX || prefix === KOREAN_VOIP_PREFIX

  if (isFixedThreeFourFour) {
    if (rest.length <= 4) return `${prefix}-${rest}`
    return `${prefix}-${rest.slice(0, 4)}-${rest.slice(4)}`
  }

  // 02 / 지역번호: 완성 9·10(서울) 또는 10·11(지역)에 맞춰 중간 자리 분기
  if (rest.length <= 4) return `${prefix}-${rest}`
  if (rest.length === 7) return `${prefix}-${rest.slice(0, 3)}-${rest.slice(3)}`
  if (isSeoul && rest.length >= 8) return `${prefix}-${rest.slice(0, 4)}-${rest.slice(4, 8)}`
  return `${prefix}-${rest.slice(0, 4)}-${rest.slice(4)}`
}

/** 입력 중·완성 모두 하이픈을 붙입니다. 미완성은 자르지 않습니다. */
export function formatKoreanPhoneNumber(value: string): string {
  const digits = normalizeKoreanPhoneDigits(value)
  if (!digits) return ''
  const prefix = detectKoreanPhonePrefix(digits)
  if (!prefix) return digits
  return formatLocalNumber(prefix, digits.slice(prefix.length))
}

/** 허용 prefix + 해당 자리수인지 확인합니다. 빈 값은 false입니다. */
export function isValidKoreanPhoneNumber(value: string): boolean {
  const rawDigits = toHalfWidthDigits(value).replace(/\D/g, '')
  if (!rawDigits || rawDigits.length > MAX_KOREAN_PHONE_DIGITS) return false

  const prefix = detectKoreanPhonePrefix(rawDigits)
  if (!prefix || !rawDigits.startsWith(prefix)) return false

  const restLen = rawDigits.length - prefix.length
  if (prefix === KOREAN_MOBILE_PREFIX || prefix === KOREAN_VOIP_PREFIX) return restLen === 8
  if (prefix === KOREAN_SEOUL_PREFIX) return restLen === 7 || restLen === 8
  return restLen === 7 || restLen === 8
}

export type KoreanPhoneInputChangeResult = {
  formatted: string
  caret: number
}

/**
 * 입력/붙여넣기/Backspace 후 표시값과 캐럿 위치를 계산합니다.
 * 하이픈만 지운 경우에는 바로 앞 숫자를 함께 지웁니다.
 */
export function applyKoreanPhoneInputChange(
  previousValue: string,
  nextRawValue: string,
  selectionStart: number | null
): KoreanPhoneInputChangeResult {
  const prevDigits = toHalfWidthDigits(previousValue).replace(/\D/g, '')
  const nextDigitsRaw = toHalfWidthDigits(nextRawValue).replace(/\D/g, '')
  const caretInRaw = selectionStart ?? nextRawValue.length
  let digits = nextDigitsRaw.slice(0, MAX_KOREAN_PHONE_DIGITS)
  let targetDigitCount = countKoreanPhoneDigits(nextRawValue, caretInRaw)

  if (nextDigitsRaw === prevDigits && nextRawValue.length < previousValue.length) {
    const removeAt = Math.max(0, countKoreanPhoneDigits(nextRawValue, caretInRaw) - 1)
    digits = `${prevDigits.slice(0, removeAt)}${prevDigits.slice(removeAt + 1)}`.slice(
      0,
      MAX_KOREAN_PHONE_DIGITS
    )
    targetDigitCount = removeAt
  }

  if (targetDigitCount > digits.length) targetDigitCount = digits.length

  const formatted = formatKoreanPhoneNumber(digits)
  return {
    formatted,
    caret: caretIndexForDigitCount(formatted, targetDigitCount),
  }
}
