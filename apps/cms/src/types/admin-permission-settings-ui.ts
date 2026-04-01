/**
 * 관리자 권한 설정 UI 전용 타입 (mock/로컬 state, API 미연동)
 */

export const ADMIN_PERMISSION_ROLE_TABS = ['master', 'pm', 'partner', 'viewer'] as const

export type AdminPermissionRoleTab = (typeof ADMIN_PERMISSION_ROLE_TABS)[number]

export interface AdminPermissionItemDef {
  id: string
  label: string
}

export interface AdminPermissionCategoryDef {
  id: string
  title: string
  items: AdminPermissionItemDef[]
}

export type AdminPermissionFlags = Record<string, boolean>

export type AdminPermissionFlagsByRole = Record<AdminPermissionRoleTab, AdminPermissionFlags>
