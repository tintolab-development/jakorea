import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

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
