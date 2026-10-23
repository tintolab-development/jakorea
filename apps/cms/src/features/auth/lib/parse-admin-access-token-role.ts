import { parseAdminRoleCode, type AdminRoleCode } from '@/shared/lib/admin-role-policy'

function decodeJwtPayload(accessToken: string): Record<string, unknown> | null {
  const parts = accessToken.trim().split('.')
  if (parts.length < 2) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const json = atob(padded)
    const payload = JSON.parse(json)
    return payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function roleFromClaimValue(value: unknown): AdminRoleCode | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const withoutRolePrefix = trimmed.replace(/^ROLE_/i, '')
  return parseAdminRoleCode(withoutRolePrefix) ?? parseAdminRoleCode(trimmed)
}

/** access JWT payload에서 roleCode를 추정한다. 없으면 null. */
export function parseAdminRoleCodeFromAccessToken(accessToken: string): AdminRoleCode | null {
  const payload = decodeJwtPayload(accessToken)
  if (!payload) return null

  const directKeys = ['roleCode', 'role', 'adminRole', 'authority', 'adminRoleCode'] as const
  for (const key of directKeys) {
    const parsed = roleFromClaimValue(payload[key])
    if (parsed) return parsed
  }

  const authorities = payload.authorities ?? payload.roles ?? payload.scope
  if (Array.isArray(authorities)) {
    for (const entry of authorities) {
      const parsed = roleFromClaimValue(entry)
      if (parsed) return parsed
    }
  }

  return null
}
