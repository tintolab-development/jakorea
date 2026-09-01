import type { ListAdminApprovalRequestsParams } from '@/features/user/api/admin-approval-requests.types'
import { mapUiApprovalFilterToApiStatus } from '@/features/user/api/lib/map-permission-approval-status'
import type { ListInstructorRoleRequestsParams } from '@/shared/api/generated/members/schemas'
import type { MemberPermissionApplicationStatus } from '@/types/member-permission-application'

const DEFAULT_PAGE_SIZE = 50

function parseApproval(raw: string | null): MemberPermissionApplicationStatus | 'ALL' {
  if (!raw || raw === 'ALL') return 'ALL'
  if (raw === 'PENDING' || raw === 'APPROVED' || raw === 'REJECTED') return raw
  return 'ALL'
}

/** 강사 탭 — 서버 지원 필터(keyword, status)만 API params로 변환 */
export function parseInstructorRoleRequestListParams(
  searchParams: URLSearchParams
): ListInstructorRoleRequestsParams {
  const keyword = (searchParams.get('permI_search') ?? '').trim()
  const approvalStatus = parseApproval(searchParams.get('permI_approval'))

  return {
    keyword: keyword.length > 0 ? keyword : undefined,
    status: mapUiApprovalFilterToApiStatus(approvalStatus),
    page: 0,
    size: DEFAULT_PAGE_SIZE,
  }
}

/** 관리자 탭 — 서버 지원 필터(keyword, status)를 API params로 변환 */
export function parseAdminApprovalRequestListParams(
  searchParams: URLSearchParams
): ListAdminApprovalRequestsParams {
  const keyword = (searchParams.get('permA_search') ?? '').trim()
  const approvalStatus = parseApproval(searchParams.get('permA_approval'))

  return {
    keyword: keyword.length > 0 ? keyword : undefined,
    status: mapUiApprovalFilterToApiStatus(approvalStatus),
    page: 0,
    size: DEFAULT_PAGE_SIZE,
  }
}
