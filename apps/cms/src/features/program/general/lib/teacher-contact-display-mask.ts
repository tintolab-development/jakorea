/**
 * 학교 상세 등 표시용 개인정보 마스킹 (TD 노출)
 */

/**
 * 휴대폰: 가운데 번호를 **** 로 고정 (예: 010-****-5678, 010-123-4567 → 010-****-4567)
 */
export function maskMobilePhoneMiddleStars(phone: string): string {
  if (!phone?.trim()) return phone
  const t = phone.trim()
  const parts = t.split('-').map(s => s.trim()).filter(Boolean)
  if (parts.length === 3) {
    return `${parts[0]}-****-${parts[2]}`
  }
  const digits = t.replace(/\D/g, '')
  if (digits.length >= 9) {
    const head = digits.slice(0, 3)
    const tail = digits.slice(-4)
    return `${head}-****-${tail}`
  }
  return t
}

/**
 * 이메일: @ 앞 로컬파트에서 앞 2글자(Unicode 코드 포인트)만 노출, 이후는 글자당 *
 */
export function maskEmailLocalAfterTwoChars(email: string): string {
  if (!email?.trim()) return email
  const trimmed = email.trim()
  const at = trimmed.indexOf('@')
  if (at <= 0) return trimmed
  const local = trimmed.slice(0, at)
  const domain = trimmed.slice(at)
  const chars = Array.from(local)
  if (chars.length === 0) return trimmed
  if (chars.length === 1) {
    return `${chars[0]}*${domain}`
  }
  if (chars.length === 2) {
    return `${chars.join('')}${domain}`
  }
  return `${chars.slice(0, 2).join('')}${'*'.repeat(chars.length - 2)}${domain}`
}
