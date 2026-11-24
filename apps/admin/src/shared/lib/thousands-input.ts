/**
 * 정수 입력란 세 자리 콤마 — 입력 중 즉시 콤마를 붙이고 커서 위치를 숫자 기준으로 유지한다.
 * 저장값은 호출부에서 콤마를 뺀 정수(`value`)를 쓴다.
 */

import type { ChangeEvent } from 'react'

export function formatThousands(value: number): string {
  return value.toLocaleString('en-US')
}

/** 콤마가 붙은 문자열에서 앞에서부터 digitCount개 숫자 바로 뒤의 위치 */
function caretAfterDigits(formatted: string, digitCount: number): number {
  if (digitCount <= 0) return 0
  let seen = 0
  for (let i = 0; i < formatted.length; i += 1) {
    if (/\d/.test(formatted[i])) seen += 1
    if (seen === digitCount) return i + 1
  }
  return formatted.length
}

export type ThousandsInputResult =
  | { formatted: ''; value: null; caret: 0 }
  | { formatted: string; value: number; caret: number }

/** 전각 숫자(０-９)를 반각으로 */
function toHalfWidthDigits(value: string): string {
  return value.replace(/[０-９]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
}

/**
 * 입력 문자열 → 콤마 문자열·정수·다음 커서.
 * - 숫자 외 문자(단위·공백·콤마 등)는 버리고 숫자만 쓴다 — `2300만` 붙여넣기 → `2,300`
 * - 소수점·음수 기호(`.` `-`)가 섞이면 값이 달라지므로(1.5 → 15) 입력을 무시(null)
 * - 자릿수·안전 정수 범위를 넘어도 null
 */
export function applyThousandsInputChange(
  raw: string,
  caret: number | null,
  options: { maxDigits?: number } = {}
): ThousandsInputResult | null {
  const maxDigits = options.maxDigits ?? 15
  const normalized = toHalfWidthDigits(raw)
  if (/[.\-－．]/.test(normalized)) return null
  const digits = normalized.replace(/\D/g, '')
  if (digits.length > maxDigits) return null
  if (digits === '') return { formatted: '', value: null, caret: 0 }
  const value = Number(digits)
  if (!Number.isSafeInteger(value) || value < 0) return null

  const caretPos = caret ?? raw.length
  const digitsBeforeCaret = normalized.slice(0, caretPos).replace(/\D/g, '').length
  // 앞자리 0은 숫자로 바뀌며 사라지므로 그만큼 커서 기준에서 뺀다.
  const leadingZeros = digits.length - String(value).length
  const formatted = formatThousands(value)
  return {
    formatted,
    value,
    caret: caretAfterDigits(formatted, digitsBeforeCaret - leadingZeros),
  }
}

/**
 * onChange 이벤트용 — 입력란 값·커서를 바로 맞추고 결과를 돌려준다.
 * 무시해야 하는 입력이면 null (제어 컴포넌트가 이전 값으로 되돌린다).
 */
export function handleThousandsInputEvent(
  e: ChangeEvent<HTMLInputElement>,
  options?: { maxDigits?: number }
): ThousandsInputResult | null {
  const input = e.target
  const result = applyThousandsInputChange(input.value, input.selectionStart, options)
  if (!result) return null
  input.value = result.formatted
  input.setSelectionRange(result.caret, result.caret)
  return result
}
