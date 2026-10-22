/**
 * 프로그램 담당자 권한 설정 UI 전용 타입 (mock/로컬 state, API 미연동)
 */

export const PROGRAM_MANAGER_PERMISSION_ROLE_TABS = ['owner', 'assistant', 'viewer'] as const

export type ProgramManagerPermissionRoleTab =
  (typeof PROGRAM_MANAGER_PERMISSION_ROLE_TABS)[number]

export interface ProgramManagerPermissionItemDef {
  id: string
  label: string
}

export interface ProgramManagerPermissionCategoryDef {
  id: string
  title: string
  items: ProgramManagerPermissionItemDef[]
}

export type ProgramManagerPermissionFlags = Record<string, boolean>

export type ProgramManagerPermissionFlagsByRole = Record<
  ProgramManagerPermissionRoleTab,
  ProgramManagerPermissionFlags
>
