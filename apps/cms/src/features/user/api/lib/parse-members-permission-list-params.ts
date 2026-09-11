import type { ListAdminApprovalRequestsParams } from '@/features/user/api/admin-approval-requests.types'
import { mapUiApprovalFilterToApiStatus } from '@/features/user/api/lib/map-permission-approval-status'
import type { ListInstructorRoleRequestsParams } from '@/shared/api/generated/members/schemas'
import type { MemberPermissionApplicationStatus } from '@/types/member-permission-application'
import type { UserRole } from '@/types/user'

const DEFAULT_PAGE_SIZE = 50

function parseApproval(raw: string | null): MemberPermissionApplicationStatus | 'ALL' {
  if (!raw || raw === 'ALL') return 'ALL'
  if (raw === 'PENDING' || raw === 'APPROVED' || raw === 'REJECTED') return raw
  return 'ALL'
}

function parseRole(raw: string | null): UserRole | 'ALL' {
  if (!raw || raw === 'ALL') return 'ALL'
  if (raw === 'INDIVIDUAL' || raw === 'SCHOOL' || raw === 'INSTRUCTOR' || raw === 'ADMIN') {
    return raw
  }
  return 'ALL'
}

/** UI 회원 유형 → 강사 권한승인 `memberType` query */
function mapUiRoleToInstructorMemberType(role: UserRole | 'ALL'): string | undefined {
  if (role === 'ALL') return undefined
  if (role === 'SCHOOL') return 'SCHOOL_TEACHER'
  return role
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

/** 강사 탭 — keyword · status · memberType · requestedAt 서버 필터 */
export function parseInstructorRoleRequestListParams(
  searchParams: URLSearchParams
): ListInstructorRoleRequestsParams {
  const keyword = (searchParams.get('permI_search') ?? '').trim()
  const approvalStatus = parseApproval(searchParams.get('permI_approval'))
  const role = parseRole(searchParams.get('permI_role'))
  const requestedAt = requestedAtBoundsFromUrl(
    searchParams.get('permI_from'),
    searchParams.get('permI_to')
  )

  return {
    keyword: keyword.length > 0 ? keyword : undefined,
    status: mapUiApprovalFilterToApiStatus(approvalStatus),
    memberType: mapUiRoleToInstructorMemberType(role),
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
