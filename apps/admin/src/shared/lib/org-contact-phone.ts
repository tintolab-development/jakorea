/**
 * 기관 연락처(대표전화·팩스) 입력 — 국내 일반 번호 + 대표번호(15xx·16xx·18xx) + 050 안심번호.
 * 일반 번호는 공용 `@jakorea/domain/shared/korean-phone` 규칙을 그대로 쓰고,
 * 그 유틸이 다루지 않는 번호만 여기서 처리한다(공용 유틸은 회원 휴대폰 등에도 쓰여 넓히지 않는다).
 */

import {
  applyKoreanPhoneInputChange,
  caretIndexForDigitCount,
  formatKoreanPhoneNumber,
  isValidKoreanPhoneNumber,
  type KoreanPhoneInputChangeResult,
} from '@jakorea/domain/shared/korean-phone'

/** 대표번호 1588-0000 (8자리) */
const REPRESENTATIVE_RE = /^1[568]/
const REPRESENTATIVE_DIGITS = 8
/** 050 안심번호 0505-123-4567 (11자리) / 0505-1234-5678 (12자리) */
const SAFE_050_RE = /^050[2-8]/
const SAFE_050_MAX_DIGITS = 12

function toDigits(value: string): string {
  return value
    .replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
    .replace(/\D/g, '')
}

function countDigits(value: string, end: number): number {
  return value.slice(0, end).replace(/\D/g, '').length
}

type SpecialKind = 'representative' | 'safe050'

function detectSpecial(digits: string): SpecialKind | null {
  if (REPRESENTATIVE_RE.test(digits)) return 'representative'
  if (SAFE_050_RE.test(digits)) return 'safe050'
  return null
}

function formatSpecial(kind: SpecialKind, digits: string): string {
  if (kind === 'representative') {
    const d = digits.slice(0, REPRESENTATIVE_DIGITS)
    return d.length <= 4 ? d : `${d.slice(0, 4)}-${d.slice(4)}`
  }
  const d = digits.slice(0, SAFE_050_MAX_DIGITS)
  const rest = d.slice(4)
  if (!rest) return d
  if (rest.length <= 3) return `${d.slice(0, 4)}-${rest}`
  // 11자리까지는 3-4, 12자리는 4-4
  if (rest.length <= 7) return `${d.slice(0, 4)}-${rest.slice(0, 3)}-${rest.slice(3)}`
  return `${d.slice(0, 4)}-${rest.slice(0, 4)}-${rest.slice(4)}`
}

function maxDigitsOf(kind: SpecialKind): number {
  return kind === 'representative' ? REPRESENTATIVE_DIGITS : SAFE_050_MAX_DIGITS
}

/** 표시용 포맷 — 서버 값을 수정 화면에 처음 띄울 때 */
export function formatOrgContactPhone(value: string): string {
  const digits = toDigits(value)
  const kind = detectSpecial(digits)
  return kind ? formatSpecial(kind, digits) : formatKoreanPhoneNumber(value)
}

/**
 * 입력/붙여넣기/Backspace 후 표시값·커서.
 * 하이픈만 지운 경우 바로 앞 숫자를 함께 지우는 동작은 공용 유틸과 같다.
 */
export function applyOrgContactPhoneInputChange(
  previousValue: string,
  nextRawValue: string,
  selectionStart: number | null
): KoreanPhoneInputChangeResult {
  const prevDigits = toDigits(previousValue)
  const nextDigits = toDigits(nextRawValue)
  const kind = detectSpecial(nextDigits) ?? detectSpecial(prevDigits)
  if (!kind) return applyKoreanPhoneInputChange(previousValue, nextRawValue, selectionStart)

  const caretInRaw = selectionStart ?? nextRawValue.length
  let digits = nextDigits
  let target = countDigits(nextRawValue, caretInRaw)
  if (nextDigits === prevDigits && nextRawValue.length < previousValue.length) {
    const removeAt = Math.max(0, target - 1)
    digits = `${prevDigits.slice(0, removeAt)}${prevDigits.slice(removeAt + 1)}`
    target = removeAt
  }

  // 지우다가 대표번호·050 형태가 아니게 되면 일반 번호 규칙으로 다시 맞춘다.
  const nextKind = detectSpecial(digits)
  if (!nextKind) {
    const formatted = formatKoreanPhoneNumber(digits)
    return { formatted, caret: caretIndexForDigitCount(formatted, Math.min(target, digits.length)) }
  }
  digits = digits.slice(0, maxDigitsOf(nextKind))
  const formatted = formatSpecial(nextKind, digits)
  return { formatted, caret: caretIndexForDigitCount(formatted, Math.min(target, digits.length)) }
}

/** 저장 전 검증 — 일반 번호(공용 규칙) 또는 대표번호 8자리 또는 050 안심번호 11·12자리 */
export function isValidOrgContactPhone(value: string): boolean {
  const digits = toDigits(value)
  if (/^1[568]\d{6}$/.test(digits)) return true
  if (/^050[2-8]\d{7,8}$/.test(digits)) return true
  return isValidKoreanPhoneNumber(value)
}
