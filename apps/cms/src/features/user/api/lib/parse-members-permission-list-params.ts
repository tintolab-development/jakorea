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

/**
 * 강사 탭 — keyword · status 서버 필터.
 * 회원 유형·신청 시기는 API로 보내지 않는다.
 * - 회원 유형: BE 라벨(`개인`|`학교/기관`)과 query enum 불일치
 * - 신청 시기: BE `requestedAtFrom/To`가 날짜를 잘못 잘라 빈 목록이 됨
 * → `members-permission-table.config`에서 `memberCategory`·`appliedAt` 클라 필터.
 */
export function parseInstructorRoleRequestListParams(
  searchParams: URLSearchParams
): ListInstructorRoleRequestsParams {
  const keyword = (searchParams.get('permI_search') ?? '').trim()
  const approvalStatus = parseApproval(searchParams.get('permI_approval'))

  return {
    keyword: keyword.length > 0 ? keyword : undefined,
    status: mapUiApprovalFilterToApiStatus(approvalStatus),
    memberType: undefined,
    requestedAtFrom: undefined,
    requestedAtTo: undefined,
    page: 0,
    size: DEFAULT_PAGE_SIZE,
  }
}

/** 관리자 탭 — keyword · status 서버 필터 (신청 시기는 클라 `appliedAt` 필터) */
export function parseAdminApprovalRequestListParams(
  searchParams: URLSearchParams
): ListAdminApprovalRequestsParams {
  const keyword = (searchParams.get('permA_search') ?? '').trim()
  const approvalStatus = parseApproval(searchParams.get('permA_approval'))

  return {
    keyword: keyword.length > 0 ? keyword : undefined,
    status: mapUiApprovalFilterToApiStatus(approvalStatus),
    requestedAtFrom: undefined,
    requestedAtTo: undefined,
    page: 0,
    size: DEFAULT_PAGE_SIZE,
  }
}
