import type { AdminProgramRoleOptionResponse } from '@/shared/api/generated/members/schemas/adminProgramRoleOptionResponse'
import type {
  ProgramManagerPermissionFlagsByRole,
  ProgramManagerPermissionRoleTab,
} from '@/types/program-manager-permission-settings-ui'
import { PROGRAM_MANAGER_PERMISSION_ROLE_TABS } from '@/types/program-manager-permission-settings-ui'

/**
 * 화면 탭 ↔ 프로그램 담당 배정 역할 코드.
 * OpenAPI `assignmentRole` / `AdminProgramRoleOptionResponse.code`는 string이며 enum이 없다.
 * 프롬프트·기존 JABACK 참고값(PM / PARTNER / VIEWER)만 고정한다. 다른 코드는 추측하지 않는다.
 */
export const PROGRAM_MANAGER_ASSIGNMENT_ROLE_BY_TAB = {
  owner: 'PM',
  assistant: 'PARTNER',
  viewer: 'VIEWER',
} as const satisfies Record<ProgramManagerPermissionRoleTab, string>

export type ProgramManagerAssignmentRoleCode =
  (typeof PROGRAM_MANAGER_ASSIGNMENT_ROLE_BY_TAB)[ProgramManagerPermissionRoleTab]

/**
 * GET `/program-roles`는 이력 페이지네이션이며 current-only 스냅샷 필드가 없다.
 * PUT은 전체 치환이므로 이력 목록으로 payload를 구성하면 다른 프로그램 배정이 유실될 수 있다.
 */
export const PROGRAM_ROLE_PUT_SAFE_SNAPSHOT_AVAILABLE = false

/** 시안 97항목 ↔ BE `capabilities[]` 1:1 계약 없음. OpenAPI에도 capability enum이 없다. */
export const PROGRAM_MANAGER_PERMISSION_CAPABILITY_MAP_AVAILABLE = false

export function isProgramManagerAssignmentRoleCode(
  value: string | undefined | null
): value is ProgramManagerAssignmentRoleCode {
  const upper = (value ?? '').trim().toUpperCase()
  return (
    upper === PROGRAM_MANAGER_ASSIGNMENT_ROLE_BY_TAB.owner ||
    upper === PROGRAM_MANAGER_ASSIGNMENT_ROLE_BY_TAB.assistant ||
    upper === PROGRAM_MANAGER_ASSIGNMENT_ROLE_BY_TAB.viewer
  )
}

export function findProgramRoleOptionForTab(
  options: readonly AdminProgramRoleOptionResponse[] | undefined,
  tab: ProgramManagerPermissionRoleTab
): AdminProgramRoleOptionResponse | undefined {
  const expected = PROGRAM_MANAGER_ASSIGNMENT_ROLE_BY_TAB[tab]
  return (options ?? []).find(option => (option.code ?? '').trim().toUpperCase() === expected)
}

/**
 * GET program-role-options는 역할 코드 확인용이다.
 * capabilities로 시안 체크 상태를 덮지 않는다.
 */
export function keepCatalogFlagsIndependentOfCapabilities(
  catalogFlags: ProgramManagerPermissionFlagsByRole,
  _options: readonly AdminProgramRoleOptionResponse[] | undefined
): ProgramManagerPermissionFlagsByRole {
  return catalogFlags
}

export function listProgramManagerAssignmentRoleCodes(): ProgramManagerAssignmentRoleCode[] {
  return PROGRAM_MANAGER_PERMISSION_ROLE_TABS.map(
    tab => PROGRAM_MANAGER_ASSIGNMENT_ROLE_BY_TAB[tab]
  )
}
