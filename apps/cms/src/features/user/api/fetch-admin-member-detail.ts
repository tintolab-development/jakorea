import type { User, UserRole } from '@/types/user'
import { fetchAdminsPageRemote, fetchAdminAccountDetailRemote } from '@/features/user/api/members-api-client'
import { mapAdminAccountDetailToUser } from '@/features/user/api/map-admin-account-detail-to-user'

export type FetchAdminMemberDetailOptions = {
  memberId?: number
  adminAccountId?: number
  email?: string
}

/** `admin-account-123` 형태 userId → adminId */
export function parseAdminAccountIdFromUserId(userId: string): number | undefined {
  const accountMatch = userId.trim().match(/^admin-account-(\d+)$/)
  if (!accountMatch) return undefined
  const parsed = Number(accountMatch[1])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export function shouldUseAdminAccountDetailApi(options?: {
  role?: UserRole
  adminAccountId?: number
  userId?: string
}): boolean {
  if (isAdminMemberDetailRole(options?.role)) return true
  if (options?.adminAccountId != null && options.adminAccountId > 0) return true
  if (options?.userId && parseAdminAccountIdFromUserId(options.userId) != null) return true
  return false
}

export async function resolveAdminAccountIdForDetail(
  userId: string,
  options?: FetchAdminMemberDetailOptions
): Promise<number> {
  const fromUserId = parseAdminAccountIdFromUserId(userId)
  if (fromUserId != null) return fromUserId

  if (options?.adminAccountId != null && options.adminAccountId > 0) {
    return options.adminAccountId
  }

  const email = options?.email?.trim()
  if (email) {
    const page = await fetchAdminsPageRemote({ keyword: email, page: 0, size: 20 })
    const normalized = email.toLowerCase()
    const match = page.items?.find(item => item.email?.trim().toLowerCase() === normalized)
    if (match?.id != null) return match.id
  }

  throw new Error('관리자 계정(adminId)을 찾을 수 없습니다. 목록에서 다시 열어 주세요.')
}

/** 관리자 회원 상세 — `GET /api/admin/admin-accounts/{adminId}` */
export async function fetchAdminMemberDetailAsUser(
  userId: string,
  options?: FetchAdminMemberDetailOptions
): Promise<Omit<User, 'password'>> {
  const adminId = await resolveAdminAccountIdForDetail(userId, options)
  const detail = await fetchAdminAccountDetailRemote(adminId)
  return mapAdminAccountDetailToUser(detail, {
    memberId: options?.memberId,
    fallbackId: userId,
  })
}

export function isAdminMemberDetailRole(role?: UserRole): boolean {
  return role === 'ADMIN'
}
