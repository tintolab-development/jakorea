/**
 * 프로그램별 담당자 권한(PM = ProgramRole.OWNER) 정책
 * 한 프로그램당 PM은 최대 MAX_PM_PER_PROGRAM 명까지.
 */

import type { ProgramRole, UserRole } from '@/types/user'
import {
  isCmsMasterAdminRole,
  isCmsOperableProgramOwnerRole,
  isCmsViewerAdminRole,
} from '@/shared/lib/cms-global-role-code'

export {
  isCmsMasterAdminRole,
  isCmsOperableProgramOwnerRole,
  isCmsViewerAdminRole,
} from '@/shared/lib/cms-global-role-code'

export const MAX_PM_PER_PROGRAM = 3

export const PROGRAM_PM_ROLE_LIMIT_MESSAGE = `프로그램당 PM(담당자)은 최대 ${MAX_PM_PER_PROGRAM}명까지 지정할 수 있습니다.`

/** CMS 전역 VIEWER/PROGRAM_VIEWER는 프로그램 담당 역할도 뷰어만 가능 */
export const CMS_VIEWER_PROGRAM_ROLE_ONLY_MESSAGE =
  '조회 전용 관리자에게는 프로그램 뷰어 권한만 지정할 수 있습니다.'

/** MASTER는 신규 프로그램 OWNER(PM)로 배정 불가 (BE `PROGRAM_OWNER_ROLE_REQUIRES_ACCOUNTING_OR_PROGRAM_MANAGER`) */
export const CMS_MASTER_CANNOT_BE_PROGRAM_OWNER_MESSAGE =
  'Master 관리자는 프로그램 담당(PM)으로 지정할 수 없습니다. Accounting Manager 또는 Program Manager를 지정해 주세요.'

/**
 * BE `ACCOUNTING_OR_PROGRAM_MANAGER_REQUIRED_FOR_OWNER_OR_ASSISTANT` — Program Owner·Program Assistant를
 * Accounting Manager·Program Manager가 아닌 관리자(Master·Program Viewer)에게 지정하려 할 때 표시.
 * FE 배정 가능 여부는 canAssignProgramRoleToCmsAdmin이 판정한다.
 */
export const CMS_OWNER_OR_ASSISTANT_REQUIRES_OPERABLE_ADMIN_MESSAGE =
  'Program Owner·Program Assistant는 Accounting Manager·Program Manager 권한을 가진 관리자만 지정할 수 있습니다.'

export function canAssignProgramRoleToCmsAdmin(
  cmsRoleCode: string | undefined | null,
  programRole: ProgramRole
): boolean {
  if (isCmsMasterAdminRole(cmsRoleCode)) return false
  if (isCmsViewerAdminRole(cmsRoleCode)) return programRole === 'ASSISTANT'
  if (isCmsOperableProgramOwnerRole(cmsRoleCode)) {
    return programRole === 'OWNER' || programRole === 'PARTNER' || programRole === 'ASSISTANT'
  }
  return true
}

export function countProgramPmsInManagerList(
  rows: readonly { role: ProgramRole }[]
): number {
  return rows.filter(r => r.role === 'OWNER').length
}

/** 신규 담당자를 PM으로 넣을 수 있는지(현재 목록 기준) */
export function canAddProgramPm(rows: readonly { role: ProgramRole }[]): boolean {
  return countProgramPmsInManagerList(rows) < MAX_PM_PER_PROGRAM
}

/** 현재 PM 수만 알 때 — 등록 모달 등 */
export function canAddProgramPmFromPmCount(currentPmCount: number): boolean {
  return currentPmCount < MAX_PM_PER_PROGRAM
}

/**
 * 기존 담당자 한 명의 역할을 newRole으로 바꿀 때 PM 한도를 넘지 않는지.
 * 이미 PM인 경우 동일 역할 재선택은 상위에서 막거나 허용.
 */
export function canSetProgramManagerRole(
  managers: readonly { id: string; role: ProgramRole }[],
  managerId: string,
  newRole: ProgramRole
): boolean {
  if (newRole !== 'OWNER') return true
  const current = managers.find(m => m.id === managerId)
  if (current?.role === 'OWNER') return true
  return countProgramPmsInManagerList(managers) < MAX_PM_PER_PROGRAM
}

/** 사용자 목록에서 특정 프로그램의 PM 수(관리자 + programRoles.OWNER만 집계) */
export function countProgramPmsForUsers(
  users: readonly { role: UserRole; programRoles?: Record<string, ProgramRole> }[],
  programId: string
): number {
  return users.filter(
    u => u.role === 'ADMIN' && u.programRoles?.[programId] === 'OWNER'
  ).length
}

export interface UserWithProgramRoles {
  id: string
  role: UserRole
  programRoles?: Record<string, ProgramRole>
}

/**
 * 사용자의 programRoles[programId]를 newRole로 바꿀 때 OWNER 한도 검증.
 * (프로그램 생성 직후 생성자에게 OWNER 부여 등)
 */
export function canAssignUserProgramRoleForProgram(
  users: readonly UserWithProgramRoles[],
  programId: string,
  userId: string,
  newRole: ProgramRole
): boolean {
  if (newRole !== 'OWNER') return true
  const user = users.find(u => u.id === userId)
  if (user?.programRoles?.[programId] === 'OWNER') return true
  return countProgramPmsForUsers(users, programId) < MAX_PM_PER_PROGRAM
}
