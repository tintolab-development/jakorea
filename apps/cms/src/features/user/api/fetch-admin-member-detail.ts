import type { User, UserRole } from '@/types/user'
import { fetchAdminAccountDetailRemote } from '@/features/user/api/members-api-client'
import { mapAdminAccountDetailToUser } from '@/features/user/api/map-admin-account-detail-to-user'

export type FetchAdminMemberDetailOptions = {
  memberId?: number
  adminAccountId?: number
  email?: string
}

export const ADMIN_ACCOUNT_ID_REQUIRED_MESSAGE =
  '관리자 계정 ID(adminAccountId)가 없어 상세를 조회할 수 없습니다. 전체 회원 목록 응답에 adminAccountId가 포함되어야 합니다.'

/** `admin-account-123` 형태 userId → adminId */
export function parseAdminAccountIdFromUserId(userId: string): number | undefined {
  const accountMatch = userId.trim().match(/^admin-account-(\d+)$/)
  if (!accountMatch) return undefined
  const parsed = Number(accountMatch[1])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export function canResolveAdminDetailPathId(
  userId: string,
  options?: Pick<FetchAdminMemberDetailOptions, 'adminAccountId'>
): boolean {
  try {
    resolveAdminDetailPathId(userId, options)
    return true
  } catch {
    return false
  }
}

export function shouldUseAdminAccountDetailApi(options?: {
  role?: UserRole
  adminAccountId?: number
  userId?: string
}): boolean {
  return canResolveAdminDetailPathId(options?.userId ?? '', options)
}

/**
 * `GET /api/admin/admin-accounts/{adminId}` path id (int64 only).
 * - 목록 row `adminAccountId` 우선
 * - 관리자 전용 목록 `admin-account-{n}` / 숫자 id
 * - `UserResponse.id` slug(`local-admin-*`)는 사용하지 않음
 */
export function resolveAdminDetailPathId(
  userId: string,
  options?: Pick<FetchAdminMemberDetailOptions, 'adminAccountId'>
): number {
  if (options?.adminAccountId != null && options.adminAccountId > 0) {
    return options.adminAccountId
  }

  const fromUserId = parseAdminAccountIdFromUserId(userId)
  if (fromUserId != null) return fromUserId

  const trimmed = userId.trim()
  const idToken = trimmed.replace(/^(admin-|member-|admin-account-)/, '')
  if (/^\d+$/.test(idToken)) {
    const numeric = Number(idToken)
    if (numeric > 0) return numeric
  }

  throw new Error(ADMIN_ACCOUNT_ID_REQUIRED_MESSAGE)
}

/** PATCH/DELETE 등 numeric adminId 확정 */
export async function resolveAdminAccountIdForDetail(
  userId: string,
  options?: Pick<FetchAdminMemberDetailOptions, 'adminAccountId'>
): Promise<number> {
  return resolveAdminDetailPathId(userId, options)
}

/** 관리자 회원 상세 — `GET /api/admin/admin-accounts/{adminId}` */
export async function fetchAdminMemberDetailAsUser(
  userId: string,
  options?: FetchAdminMemberDetailOptions
): Promise<Omit<User, 'password'>> {
  const adminDetailId = resolveAdminDetailPathId(userId, options)
  const detail = await fetchAdminAccountDetailRemote(adminDetailId)
  return mapAdminAccountDetailToUser(detail, {
    memberId: options?.memberId,
    fallbackId: userId,
  })
}

export function isAdminMemberDetailRole(role?: UserRole): boolean {
  return role === 'ADMIN'
}
