import type { VerifiedIdentityProfileResponse } from './types'

function readString(
  source: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return undefined
}

export function normalizeVerifiedIdentityProfile(
  raw: unknown
): VerifiedIdentityProfileResponse {
  if (!raw || typeof raw !== 'object') {
    return {}
  }

  const o = raw as Record<string, unknown>

  return {
    sessionId: typeof o.sessionId === 'number' ? o.sessionId : undefined,
    provider: readString(o, 'provider'),
    status: readString(o, 'status'),
    flow: readString(o, 'flow'),
    name: readString(o, 'name', 'verifiedName'),
    phone: readString(o, 'phone', 'verifiedPhone', 'mobile'),
    birthDate: readString(o, 'birthDate', 'verifiedBirthDate'),
    birthDateRaw: readString(o, 'birthDateRaw'),
    gender: readString(o, 'gender'),
    genderLabel: readString(o, 'genderLabel'),
    nationalInfo: readString(o, 'nationalInfo'),
    mobileCarrier: readString(o, 'mobileCarrier'),
    verifiedAt: readString(o, 'verifiedAt'),
    expiresAt: readString(o, 'expiresAt'),
    usedAt: readString(o, 'usedAt'),
  }
}

export function pickProfileTokenFromSearchParams(params: URLSearchParams): string | undefined {
  return (
    params.get('profileToken')?.trim() ||
    params.get('profile_token')?.trim() ||
    undefined
  )
}
