/**
 * 프로그램 생성 시 `adminAssignments` — BE N-16
 * - ACCOUNTING_MANAGER / PROGRAM_MANAGER(및 레거시 MIDDLE·PM·PARTNER): 생성자 본인을 PM으로 배정 가능
 * - MASTER: 본인 PM 자동배정 불가 → 적격 담당자를 `adminAssignments`로 명시해야 함
 * - PROGRAM_VIEWER / VIEWER: PM 배정 불가
 */

import type { ProgramAdminAssignmentRequest } from '@/shared/api/generated/dashboard/schemas/programAdminAssignmentRequest'
import type { ProgramCreateRequest } from '@/shared/api/generated/dashboard/schemas/programCreateRequest'
import type { User } from '@/types/user'

export const PROGRAM_CREATE_OWNER_REQUIRES_ELIGIBLE_PM_MESSAGE =
  '프로그램 담당(PM)은 Accounting Manager 또는 Program Manager만 지정할 수 있습니다. Master 계정은 등록 시 담당자를 지정해 주세요.'

export const PROGRAM_CREATE_VIEWER_CANNOT_OWN_MESSAGE =
  '조회 전용(Program Viewer) 관리자는 프로그램 담당(PM)으로 등록할 수 없습니다. Accounting Manager 또는 Program Manager 계정으로 등록해 주세요.'

function normalizeCmsRoleCode(roleCode: string | undefined | null): string {
  return (roleCode ?? '').trim().toUpperCase().replace(/-/g, '_')
}

/** BE `requireAssignableProgramRole` — PM/PARTNER 배정 가능 전역 역할 */
export function isCmsRoleEligibleProgramOwner(roleCode: string | undefined | null): boolean {
  const upper = normalizeCmsRoleCode(roleCode)
  return (
    upper === 'ACCOUNTING_MANAGER' ||
    upper === 'PROGRAM_MANAGER' ||
    upper === 'MIDDLE' ||
    upper === 'PM' ||
    upper === 'PARTNER'
  )
}

export function isCmsMasterAdminRole(roleCode: string | undefined | null): boolean {
  return normalizeCmsRoleCode(roleCode) === 'MASTER'
}

export function isCmsRoleForbiddenProgramOwner(roleCode: string | undefined | null): boolean {
  const upper = normalizeCmsRoleCode(roleCode)
  return upper === 'MASTER' || upper === 'PROGRAM_VIEWER' || upper === 'VIEWER'
}

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
    return role === 'PM' || role === 'OWNER' || role === 'MANAGER'
  })
}

/**
 * 생성 요청에 `adminAssignments`가 없으면 세션 역할 기준으로 보완한다.
 * 이미 PM이 있으면 그대로 둔다.
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

  if (isCmsMasterAdminRole(roleCode)) {
    throw new Error(PROGRAM_CREATE_OWNER_REQUIRES_ELIGIBLE_PM_MESSAGE)
  }

  if (isCmsRoleForbiddenProgramOwner(roleCode)) {
    throw new Error(PROGRAM_CREATE_VIEWER_CANNOT_OWN_MESSAGE)
  }

  return request
}
