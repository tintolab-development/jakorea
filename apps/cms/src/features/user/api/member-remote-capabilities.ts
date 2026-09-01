import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import type { GetUsersPageParams } from '@/entities/user/api/user-service'

export function isMembersRemoteEnabled(): boolean {
  return isRealApiModuleEnabled('members')
}

/** 권한 승인 — 강사 탭 (`GET /api/admin/instructor-role-requests`) */
export function isInstructorRoleRequestsRemoteEnabled(): boolean {
  return (
    isRealApiModuleEnabled('instructorRoleRequests') || isMembersRemoteEnabled()
  )
}

/** 권한 승인 — 관리자 탭 (`GET /api/admin/admin-approval-requests`, Swagger `listAdminApprovalRequests`) */
export function isAdminApprovalRequestsRemoteEnabled(): boolean {
  return (
    isRealApiModuleEnabled('adminApprovalRequests') || isMembersRemoteEnabled()
  )
}

export function isAdminPermissionsRemoteEnabled(): boolean {
  return isRealApiModuleEnabled('adminPermissions')
}

/** remote 모드에서 PATCH /api/admin/users/{memberId} — 기본정보 일괄 저장 */
export function isMemberBasicInfoPatchRemoteEnabled(): boolean {
  return isMembersRemoteEnabled()
}

/** 관리자 회원 관리 — 권한 유형(목록·상세 드롭다운) 변경 */
export function isAdminPermissionVariantPatchRemoteEnabled(): boolean {
  return isMembersRemoteEnabled()
}

/** 회원 상세 강사 정산 탭 — settlement list API */
export function isMemberInstructorSettlementsRemoteEnabled(): boolean {
  return (
    isMembersRemoteEnabled() &&
    (isRealApiModuleEnabled('paymentOrders') || isRealApiModuleEnabled('accountPayments'))
  )
}

/**
 * remote에서 아직 서버 미지원인 목록 필터 라벨.
 * 회원/학교 목록 필터는 서버 전송으로 전환됨. 관리자 목록의 가입일만 미지원.
 */
export function getUnsupportedMemberListFilterLabels(
  filters: GetUsersPageParams | undefined
): string[] {
  if (!isMembersRemoteEnabled() || !filters) return []
  if (filters.role === 'ADMIN' && (filters.createdAtFrom || filters.createdAtTo)) {
    return ['가입일']
  }
  return []
}
