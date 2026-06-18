import type { IdentityVerificationSessionResponse } from './types'

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

function readNestedVerifiedFields(
  source: Record<string, unknown>
): Pick<IdentityVerificationSessionResponse, 'verifiedName' | 'verifiedPhone' | 'verifiedBirthDate'> {
  const nestedKeys = ['verifiedProfile', 'profile', 'personalData', 'identityResult', 'result']
  for (const key of nestedKeys) {
    const nested = source[key]
    if (!nested || typeof nested !== 'object') {
      continue
    }
    const record = nested as Record<string, unknown>
    const verifiedName = readString(
      record,
      'verifiedName',
      'name',
      'userName',
      'maskedName',
      'verified_name'
    )
    const verifiedPhone = readString(
      record,
      'verifiedPhone',
      'phone',
      'mobile',
      'phoneNumber',
      'maskedPhone',
      'verified_phone'
    )
    const verifiedBirthDate = readString(
      record,
      'verifiedBirthDate',
      'birthDate',
      'verified_birth_date'
    )
    if (verifiedName || verifiedPhone || verifiedBirthDate) {
      return { verifiedName, verifiedPhone, verifiedBirthDate }
    }
  }
  return {}
}

export function normalizeVerificationSession(
  raw: unknown
): IdentityVerificationSessionResponse {
  if (!raw || typeof raw !== 'object') {
    return {}
  }

  const o = raw as Record<string, unknown>
  const nested = readNestedVerifiedFields(o)

  return {
    sessionId: typeof o.sessionId === 'number' ? o.sessionId : undefined,
    sessionUuid: readString(o, 'sessionUuid', 'uuid', 'identityVerificationSessionUuid'),
    provider: readString(o, 'provider'),
    status: readString(o, 'status'),
    verifiedAt: readString(o, 'verifiedAt', 'verified_at'),
    expiresAt: readString(o, 'expiresAt', 'expires_at'),
    usedAt: readString(o, 'usedAt', 'used_at'),
    verifiedName:
      readString(
        o,
        'verifiedName',
        'name',
        'userName',
        'maskedName',
        'verified_name',
        'user_name'
      ) ?? nested.verifiedName,
    verifiedPhone:
      readString(
        o,
        'verifiedPhone',
        'phone',
        'mobile',
        'phoneNumber',
        'maskedPhone',
        'verified_phone',
        'mobileNo',
        'telNo'
      ) ?? nested.verifiedPhone,
    verifiedBirthDate:
      readString(o, 'verifiedBirthDate', 'birthDate', 'verified_birth_date') ??
      nested.verifiedBirthDate,
  }
}

function readSearchParam(params: URLSearchParams, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = params.get(key)?.trim()
    if (value) {
      return value
    }
  }
  return undefined
}

export function pickVerifiedFieldsFromSearchParams(
  params: URLSearchParams
): Pick<IdentityVerificationSessionResponse, 'verifiedName' | 'verifiedPhone' | 'verifiedBirthDate'> {
  return {
    verifiedName: readSearchParam(
      params,
      'verifiedName',
      'verified_name',
      'name',
      'userName',
      'user_name',
      'maskedName'
    ),
    verifiedPhone: readSearchParam(
      params,
      'verifiedPhone',
      'verified_phone',
      'phone',
      'mobile',
      'phoneNumber',
      'maskedPhone',
      'mobileNo',
      'telNo'
    ),
    verifiedBirthDate: readSearchParam(
      params,
      'verifiedBirthDate',
      'verified_birth_date',
      'birthDate',
      'birth_date'
    ),
  }
}

export function pickVerifiedFieldsFromCallbackLocation(
  searchParams: URLSearchParams,
  hash = ''
): Pick<IdentityVerificationSessionResponse, 'verifiedName' | 'verifiedPhone' | 'verifiedBirthDate'> {
  const fromSearch = pickVerifiedFieldsFromSearchParams(searchParams)
  if (fromSearch.verifiedName || fromSearch.verifiedPhone || fromSearch.verifiedBirthDate) {
    return fromSearch
  }

  const hashQuery = hash.startsWith('#') ? hash.slice(1) : hash
  const hashParams = hashQuery.startsWith('?') ? hashQuery.slice(1) : hashQuery
  if (!hashParams.includes('=')) {
    return fromSearch
  }

  return pickVerifiedFieldsFromSearchParams(new URLSearchParams(hashParams))
}
