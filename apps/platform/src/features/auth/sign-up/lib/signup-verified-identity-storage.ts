const MEMBER_STORAGE_KEY = 'platform_signup_member_verified_identity'

export type SignupMemberVerifiedIdentitySnapshot = {
  sessionId: number
  verifiedName: string
  verifiedPhone: string
  verifiedGender?: string
}

function hasSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function isValidSnapshot(value: unknown): value is SignupMemberVerifiedIdentitySnapshot {
  if (!value || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return (
    typeof o.sessionId === 'number' &&
    Number.isFinite(o.sessionId) &&
    o.sessionId > 0 &&
    typeof o.verifiedName === 'string' &&
    typeof o.verifiedPhone === 'string'
  )
}

export function readSignupMemberVerifiedIdentity(): SignupMemberVerifiedIdentitySnapshot | null {
  if (!hasSessionStorage()) return null
  try {
    const raw = window.sessionStorage.getItem(MEMBER_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isValidSnapshot(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeSignupMemberVerifiedIdentity(snapshot: SignupMemberVerifiedIdentitySnapshot): void {
  if (!hasSessionStorage()) return
  try {
    window.sessionStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // ignore quota / private mode
  }
}

export function clearSignupMemberVerifiedIdentity(): void {
  if (!hasSessionStorage()) return
  try {
    window.sessionStorage.removeItem(MEMBER_STORAGE_KEY)
  } catch {
    // ignore
  }
}
