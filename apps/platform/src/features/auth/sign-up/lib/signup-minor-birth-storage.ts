/** step 2에서 확정한 미성년 가입자 생년월일 — 보호자 NICE 등으로 덮어쓰지 않음 */
const STORAGE_KEY = 'platform_signup_minor_member_birth_date'

function hasSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function writeMinorMemberBirthDate(birthDate: string): void {
  if (!hasSessionStorage()) return
  const trimmed = birthDate.trim()
  if (!trimmed) return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, trimmed)
  } catch {
    // ignore
  }
}

export function readMinorMemberBirthDate(): string | null {
  if (!hasSessionStorage()) return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)?.trim()
    return raw || null
  } catch {
    return null
  }
}

export function clearMinorMemberBirthDate(): void {
  if (!hasSessionStorage()) return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
