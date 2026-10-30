/**
 * 프로그램 생성 시 `adminAssignments` — BE N-16
 * - 담당자 생략: BE가 생성자 PM을 자동 배정한다. FE는 본인을 PM으로 넣지 않는다.
 * - 명시 목록: 생성자 PM(PM/OWNER)이 정확히 1건이어야 한다.
 * - MASTER를 명시 목록의 생성자 PM으로 넣지 않는다. 최초 생성자 PM 기록은 생략 경로의 BE 배정이다.
 * - PROGRAM_VIEWER / VIEWER: 생성 차단
 */

import type { ProgramAdminAssignmentRequest } from '@/shared/api/generated/dashboard/schemas/programAdminAssignmentRequest'
import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import type { User } from '@/types/user'
import { isCmsMasterAdminRole, isCmsViewerAdminRole } from '@/shared/lib/cms-global-role-code'

export {
  isCmsMasterAdminRole,
  isCmsRoleEligibleProgramOwner,
  isCmsRoleForbiddenProgramOwner,
} from '@/shared/lib/cms-global-role-code'

export const PROGRAM_CREATE_VIEWER_CANNOT_OWN_MESSAGE =
  '조회 전용(Program Viewer) 관리자는 프로그램 담당(PM)으로 등록할 수 없습니다. Accounting Manager 또는 Program Manager 계정으로 등록해 주세요.'

export const PROGRAM_CREATE_EXPLICIT_PM_REQUIRED_MESSAGE =
  '프로그램 생성 시 담당자를 지정하면 생성자 PM은 정확히 1명이어야 합니다.'

export const PROGRAM_CREATE_MASTER_NOT_ASSIGNEE_PM_MESSAGE =
  'Master는 생성 담당자 목록의 PM으로 지정할 수 없습니다. 담당자를 비우면 서버가 생성자 PM을 기록합니다.'

export function buildSelfProgramOwnerAssignment(
  adminAccountId: number | undefined | null
): ProgramAdminAssignmentRequest | null {
  if (adminAccountId == null || !Number.isFinite(adminAccountId) || adminAccountId <= 0) {
    return null
  }
  return { adminId: adminAccountId, role: 'PM' }
}

function countCreatorPmAssignments(
  assignments: ProgramAdminAssignmentRequest[] | undefined
): number {
  if (!assignments?.length) return 0
  return assignments.filter(row => {
    const role = (row.role ?? '').trim().toUpperCase()
    return role === 'PM' || role === 'OWNER'
  }).length
}

/**
 * 담당자 생략은 BE 생성자 PM 자동 배정에 맡긴다.
 * 명시 목록은 생성자 PM 1건. Master 본인을 그 PM으로 넣지 않는다.
 */
export function withProgramCreateAdminAssignments(
  request: ProgramCreateRequest,
  sessionUser: Pick<User, 'roleCode' | 'adminAccountId'> | null | undefined
): ProgramCreateRequest {
  const roleCode = sessionUser?.roleCode
  if (isCmsViewerAdminRole(roleCode)) {
    throw new Error(PROGRAM_CREATE_VIEWER_CANNOT_OWN_MESSAGE)
  }

  const assignments = request.adminAssignments
  if (!assignments?.length) {
    return request
  }

  if (countCreatorPmAssignments(assignments) !== 1) {
    throw new Error(PROGRAM_CREATE_EXPLICIT_PM_REQUIRED_MESSAGE)
  }

  if (isCmsMasterAdminRole(roleCode)) {
    const selfId = sessionUser?.adminAccountId
    const masterIsCreatorPm = assignments.some(row => {
      const role = (row.role ?? '').trim().toUpperCase()
      return (role === 'PM' || role === 'OWNER') && selfId != null && row.adminId === selfId
    })
    if (masterIsCreatorPm) {
      throw new Error(PROGRAM_CREATE_MASTER_NOT_ASSIGNEE_PM_MESSAGE)
    }
  }

  return request
}
