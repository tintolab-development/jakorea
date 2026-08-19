/**
 * 목록용 연락처·이메일 마스킹
 */

export function maskPhoneNumber(phone: string): string {
  const raw = phone.trim()
  if (!raw) return '-'

  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-****-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-****-${digits.slice(6)}`
  }

  const parts = raw.split('-')
  if (parts.length === 3) {
    return `${parts[0]}-****-${parts[2]}`
  }

  if (digits.length > 7) {
    const head = digits.slice(0, 3)
    const tail = digits.slice(-4)
    return `${head}-****-${tail}`
  }

  return raw
}

/** 시안: wldnjswk@naver.com → wldnj***@naver.com */
export function maskEmail(email: string): string {
  const raw = email.trim()
  if (!raw) return '-'
  const at = raw.lastIndexOf('@')
  if (at <= 0) return raw

  const local = raw.slice(0, at)
  const domain = raw.slice(at + 1)
  if (!domain) return raw

  const visible = local.slice(0, Math.min(5, local.length))
  return `${visible}***@${domain}`
}
