import type { User } from '@/types/user'
import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'
import { parseAdminAccountIdFromUserId } from '@/features/user/api/fetch-admin-member-detail'

/**
 * 권한 유형 PATCH 후 상세 GET 없이 UI·캐시에 반영할 overlay.
 * role 변경은 adminAccountId만 필요하므로 기존 상세 객체를 재사용한다.
 */
export function applyAdminPermissionVariantToUser(
  existing: Omit<User, 'password'>,
  variant: AdminPermissionTagVariant,
  adminId: number
): Omit<User, 'password'> {
  return {
    ...existing,
    adminAccountId: existing.adminAccountId ?? adminId,
    listMetrics: {
      ...existing.listMetrics,
      adminPermissionVariant: variant,
    },
  }
}

/** 이미 로드된 관리자 상세·목록 행에서 PATCH path id를 찾는다. */
export function resolveAdminAccountIdForPermissionPatch(params: {
  userId: string
  existing?: Pick<User, 'adminAccountId'> | null
}): number | undefined {
  const fromUser = params.existing?.adminAccountId
  if (fromUser != null && fromUser > 0) return fromUser
  return parseAdminAccountIdFromUserId(params.userId)
}
