/**
 * 프로그램 생성 시 `adminAssignments` — BE N-16
 * - ACCOUNTING_MANAGER / PROGRAM_MANAGER(및 레거시 MIDDLE·PM·PARTNER): 생성자 본인을 PM으로 배정 가능
 * - MASTER: 본인 PM 자동배정 불가. 등록 위저드에 담당자 지정 UI는 없음 → assignments 없이 생성하고
 *   등록 후 프로그램 상세 담당자 탭에서 적격 PM을 지정한다.
 * - PROGRAM_VIEWER / VIEWER: PM 배정 불가(생성 차단)
 */

import type { ProgramAdminAssignmentRequest } from '@/shared/api/generated/dashboard/schemas/programAdminAssignmentRequest'
import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import type { User } from '@/types/user'
import {
  isCmsMasterAdminRole,
  isCmsRoleEligibleProgramOwner,
  isCmsRoleForbiddenProgramOwner,
} from '@/shared/lib/cms-global-role-code'

export {
  isCmsMasterAdminRole,
  isCmsRoleEligibleProgramOwner,
  isCmsRoleForbiddenProgramOwner,
} from '@/shared/lib/cms-global-role-code'

export const PROGRAM_CREATE_VIEWER_CANNOT_OWN_MESSAGE =
  '조회 전용(Program Viewer) 관리자는 프로그램 담당(PM)으로 등록할 수 없습니다. Accounting Manager 또는 Program Manager 계정으로 등록해 주세요.'

export function buildSelfProgramOwnerAssignment(
  adminAccountId: number | undefined | null
): ProgramAdminAssignmentRequest | null {
  if (adminAccountId == null || !Number.isFinite(adminAccountId) || adminAccountId <= 0) {
    return null
  }
  return { adminId: adminAccountId, role: 'PM' }
}

function hasProgramOwnerAssignment(
  assignments: ProgramAdminAssignmentRequest[] | undefined
): boolean {
  if (!assignments?.length) return false
  return assignments.some(row => {
    const role = (row.role ?? '').trim().toUpperCase()
    return role === 'PM' || role === 'OWNER'
  })
}

/**
 * 생성 요청에 `adminAssignments`가 없으면 세션 역할 기준으로 보완한다.
 * 이미 PM이 있으면 그대로 둔다.
 * Master는 본인 PM을 넣지 않고 요청을 그대로 둔다(등록 후 담당자 탭에서 지정).
 */
export function withProgramCreateAdminAssignments(
  request: ProgramCreateRequest,
  sessionUser: Pick<User, 'roleCode' | 'adminAccountId'> | null | undefined
): ProgramCreateRequest {
  if (hasProgramOwnerAssignment(request.adminAssignments)) {
    return request
  }

  const roleCode = sessionUser?.roleCode
  if (isCmsRoleEligibleProgramOwner(roleCode)) {
    const self = buildSelfProgramOwnerAssignment(sessionUser?.adminAccountId)
    if (self) {
      return { ...request, adminAssignments: [self] }
    }
    // adminAccountId 없으면 BE default actor PM에 맡김
    return request
  }

  // Master: 등록 위저드에 담당자 지정 플로우 없음 → self PM / FE throw 없이 생성
  if (isCmsMasterAdminRole(roleCode)) {
    return request
  }

  if (isCmsRoleForbiddenProgramOwner(roleCode)) {
    throw new Error(PROGRAM_CREATE_VIEWER_CANNOT_OWN_MESSAGE)
  }

  return request
}
