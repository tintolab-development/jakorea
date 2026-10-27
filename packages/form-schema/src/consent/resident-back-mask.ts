/** 주민등록번호 뒷자리 7자 — 첫 자리 평문 + 나머지 `*` 표시. 저장값은 숫자만. */

function digitsOnly(value: string | undefined): string {
  return (value ?? '').replace(/\D/g, '')
}

export function sanitizeResidentBackDigits(raw: string | undefined): string {
  return digitsOnly(raw).slice(0, 7)
}

/** 표시용: 첫 자리 평문 + 나머지 `*` (저장값에는 쓰지 않음) */
export function formatResidentBackMaskedDisplay(
  raw: string | undefined,
  revealed = false
): string {
  const digits = sanitizeResidentBackDigits(raw)
  if (revealed || digits.length <= 1) return digits
  return `${digits.slice(0, 1)}${'*'.repeat(digits.length - 1)}`
}

/** 인풋 표시용 — 서버·동의서에 `*`가 포함된 마스킹 값은 숫자만 추출하지 않는다. */
export function formatResidentBackDisplayForInput(
  raw: string | undefined,
  revealed = false
): string {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return ''
  if (trimmed.includes('*')) {
    if (revealed) return sanitizeResidentBackDigits(trimmed)
    const first = sanitizeResidentBackDigits(trimmed).slice(0, 1)
    if (!first) return trimmed.replace(/[^0-9*]/g, '').slice(0, 7)
    return `${first}${'*'.repeat(6)}`
  }
  return formatResidentBackMaskedDisplay(trimmed, revealed)
}

/** 서버가 이미 `*`로 가렸으면 그대로, 평문이면 첫 자리만 남긴다. */
export function maskResidentBackForPreview(back: string | undefined): string {
  const raw = (back ?? '').trim()
  if (!raw) return ''
  if (raw.includes('*')) return raw
  return formatResidentBackMaskedDisplay(raw)
}

/** 미리보기 문서용 `앞6-1******`. 이미 마스킹된 값은 다시 가리지 않는다. */
export function formatResidentNumberForPreview(
  front?: string,
  back?: string
): string {
  const f = (front ?? '').trim()
  const b = maskResidentBackForPreview(back)
  if (!f && !b) return ''
  if (!b) return f
  if (!f) return b
  return `${f}-${b}`
}

/** 단일 문자열(`9707211234567` / `970721-1234567` / `970721-1******`) */
export function formatResidentNumberRawForPreview(raw: string | undefined): string {
  const text = (raw ?? '').trim()
  if (!text) return ''
  const hyphen = text.indexOf('-')
  if (hyphen >= 0) {
    return formatResidentNumberForPreview(text.slice(0, hyphen), text.slice(hyphen + 1))
  }
  if (text.includes('*')) return text
  const digits = digitsOnly(text)
  return formatResidentNumberForPreview(digits.slice(0, 6), digits.slice(6, 13))
}

/** 마스킹된 표시 문자열 입력을 숫자 7자리로 되돌린다. */
export function applyResidentBackMaskedDisplayChange(
  prevDigits: string | undefined,
  nextDisplay: string,
  revealed: boolean
): string {
  const prev = sanitizeResidentBackDigits(prevDigits)
  if (revealed) return sanitizeResidentBackDigits(nextDisplay)

  if (!nextDisplay.includes('*')) {
    return sanitizeResidentBackDigits(nextDisplay)
  }

  if (nextDisplay.length < prev.length) {
    return prev.slice(0, nextDisplay.length)
  }
  if (nextDisplay.length > prev.length) {
    const extra = digitsOnly(nextDisplay.slice(prev.length))
    return sanitizeResidentBackDigits(prev + extra)
  }

  const nextFirst = digitsOnly(nextDisplay.slice(0, 1)).slice(0, 1)
  if (nextFirst && nextFirst !== prev.slice(0, 1)) {
    return sanitizeResidentBackDigits(`${nextFirst}${prev.slice(1)}`)
  }
  return prev
}
