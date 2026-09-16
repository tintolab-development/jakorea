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

function requestedAtBoundsFromUrl(
  fromStr: string | null,
  toStr: string | null
): { from?: string; to?: string } {
  const from = fromStr?.trim() || undefined
  const to = toStr?.trim() || undefined
  if (!from && !to) return {}
  if (from && to) return { from, to }
  if (from) return { from, to: from }
  return { from: to, to }
}

/**
 * 강사 탭 — keyword · status · requestedAt 서버 필터.
 * 회원 유형(`permI_role`)은 API `memberType`으로 보내지 않는다.
 * BE 라벨(`개인`|`학교/기관`)과 query enum이 불일치해 서버 필터 시 결과가 비거나 잘못 잘림.
 * → `members-permission-table.config`에서 `memberCategory` 클라 필터.
 */
export function parseInstructorRoleRequestListParams(
  searchParams: URLSearchParams
): ListInstructorRoleRequestsParams {
  const keyword = (searchParams.get('permI_search') ?? '').trim()
  const approvalStatus = parseApproval(searchParams.get('permI_approval'))
  const requestedAt = requestedAtBoundsFromUrl(
    searchParams.get('permI_from'),
    searchParams.get('permI_to')
  )

  return {
    keyword: keyword.length > 0 ? keyword : undefined,
    status: mapUiApprovalFilterToApiStatus(approvalStatus),
    memberType: undefined,
    requestedAtFrom: requestedAt.from,
    requestedAtTo: requestedAt.to,
    page: 0,
    size: DEFAULT_PAGE_SIZE,
  }
}

/** 관리자 탭 — keyword · status · requestedAt 서버 필터 */
export function parseAdminApprovalRequestListParams(
  searchParams: URLSearchParams
): ListAdminApprovalRequestsParams {
  const keyword = (searchParams.get('permA_search') ?? '').trim()
  const approvalStatus = parseApproval(searchParams.get('permA_approval'))
  const requestedAt = requestedAtBoundsFromUrl(
    searchParams.get('permA_from'),
    searchParams.get('permA_to')
  )

  return {
    keyword: keyword.length > 0 ? keyword : undefined,
    status: mapUiApprovalFilterToApiStatus(approvalStatus),
    requestedAtFrom: requestedAt.from,
    requestedAtTo: requestedAt.to,
    page: 0,
    size: DEFAULT_PAGE_SIZE,
  }
}
