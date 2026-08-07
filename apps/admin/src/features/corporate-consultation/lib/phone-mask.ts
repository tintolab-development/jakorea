/**
 * 목록용 연락처 마스킹
 * - 010-1234-5678 → 010-****-5678
 * - 비정형 문자열은 best-effort
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

  // 하이픈 3-part (가운데 블록 마스킹)
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
