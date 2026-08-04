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

const UNSUPPORTED_LIST_FILTER_LABELS: Record<string, string> = {
  createdAtFrom: '가입일(시작)',
  createdAtTo: '가입일(종료)',
  institutionLocation: '기관 지역',
  jaEvaluationGrade: 'JA 평가 등급',
  settlementStatus: '정산 현황',
  adminPermissionVariant: '관리자 권한 유형',
  instructorListPureOnly: '순수 강사만',
}

export function getUnsupportedMemberListFilterLabels(
  filters: GetUsersPageParams | undefined
): string[] {
  if (!isMembersRemoteEnabled() || !filters) return []
  const labels: string[] = []
  if (filters.createdAtFrom || filters.createdAtTo) {
    labels.push(UNSUPPORTED_LIST_FILTER_LABELS.createdAtFrom)
  }
  if (filters.institutionLocation?.trim()) {
    labels.push(UNSUPPORTED_LIST_FILTER_LABELS.institutionLocation)
  }
  if (filters.jaEvaluationGrade?.trim()) {
    labels.push(UNSUPPORTED_LIST_FILTER_LABELS.jaEvaluationGrade)
  }
  if (filters.settlementStatus?.trim()) {
    labels.push(UNSUPPORTED_LIST_FILTER_LABELS.settlementStatus)
  }
  if (filters.adminPermissionVariant) {
    labels.push(UNSUPPORTED_LIST_FILTER_LABELS.adminPermissionVariant)
  }
  if (filters.instructorListPureOnly) {
    labels.push(UNSUPPORTED_LIST_FILTER_LABELS.instructorListPureOnly)
  }
  return labels
}

export function stripUnsupportedMemberListFilters(
  filters: GetUsersPageParams | undefined
): GetUsersPageParams {
  if (!filters || !isMembersRemoteEnabled()) return filters ?? {}
  const {
    createdAtFrom: _a,
    createdAtTo: _b,
    institutionLocation: _c,
    jaEvaluationGrade: _d,
    settlementStatus: _e,
    adminPermissionVariant: _f,
    instructorListPureOnly: _g,
    ...rest
  } = filters
  return rest
}
