const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * `UserResponse.id` 목록 표시용 키 (`local-admin-member-viewer` 등).
 * `GET /api/admin/admin-accounts/{adminId}` path id(int64)가 아님.
 */
export function isUserResponseDisplayRowId(id: string): boolean {
  const trimmed = id.trim()
  if (!trimmed) return true
  if (UUID_RE.test(trimmed)) return false
  if (/^\d+$/.test(trimmed)) return false
  if (trimmed.startsWith('admin-account-')) return false
  if (trimmed.startsWith('member-')) return false
  if (trimmed.startsWith('local-')) return true
  return false
}

export function coercePositiveInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.trunc(value)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^\d+$/.test(trimmed)) {
      const numeric = Number(trimmed)
      if (numeric > 0) return numeric
    }
  }
  return undefined
}

type CanonicalUserDetailIdSource = {
  id?: string
  adminAccountId?: number
  memberId?: number
}

/**
 * 상세·URL에 쓸 canonical User.id.
 * 목록 slug(`local-demo-admin-viewer`) 대신 `admin-account-{adminAccountId}` 등 API 식별자 우선.
 */
export function resolveCanonicalUserDetailId(
  listUser: CanonicalUserDetailIdSource,
  fetched: CanonicalUserDetailIdSource
): string {
  const adminAccountId =
    coercePositiveInt(fetched.adminAccountId) ?? coercePositiveInt(listUser.adminAccountId)
  if (adminAccountId != null) {
    return `admin-account-${adminAccountId}`
  }

  for (const candidate of [listUser.id, fetched.id]) {
    const trimmed = candidate?.trim()
    if (trimmed && !isUserResponseDisplayRowId(trimmed)) {
      return trimmed
    }
  }

  const memberId = coercePositiveInt(fetched.memberId) ?? coercePositiveInt(listUser.memberId)
  if (memberId != null) {
    return `member-${memberId}`
  }

  return fetched.id?.trim() || listUser.id?.trim() || 'member-unknown'
}
