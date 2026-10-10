import type { QueryClient } from '@tanstack/react-query'
import { invalidateMemberListQueries } from '@/features/user/api/invalidate-member-list-queries'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import { isMemberListMenuHref } from '@/shared/config/member-list-kinds'
import {
  isPermissionRequestsPath,
  isPermissionSettingsPath,
} from '@/shared/lib/admin-role-policy'

/** 권한 승인 — 강사·관리자 신청 목록 쿼리 */
export function invalidatePermissionApprovalListQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: memberQueryKeys.instructorRoleRequests.all() })
  void queryClient.invalidateQueries({ queryKey: memberQueryKeys.adminApprovalRequests.all() })
}

/** 관리자 권한 설정 — catalog / roles / roleMatrix */
export function invalidateAdminPermissionsQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: memberQueryKeys.adminPermissions.all() })
}

/**
 * LNB·대시보드 바로가기 등 회원·권한 관리 메뉴 진입 시 목록 API를 즉시 다시 치도록 stale 처리.
 * 대상이 아니면 no-op.
 */
export function invalidateQueriesForMemberManagementNavigation(
  queryClient: QueryClient,
  hrefOrKey: string
): void {
  if (isMemberListMenuHref(hrefOrKey)) {
    invalidateMemberListQueries(queryClient)
    return
  }

  const pathname = hrefOrKey.split('?')[0]

  if (isPermissionRequestsPath(pathname)) {
    invalidatePermissionApprovalListQueries(queryClient)
    return
  }

  if (isPermissionSettingsPath(pathname)) {
    invalidateAdminPermissionsQueries(queryClient)
  }
}
