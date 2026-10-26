/**
 * 관리자 권한 설정 UI 타입.
 *
 * `AdminPermissionRoleTab`은 권한 매트릭스 API 훅이 참조하는 기존 탭 키다.
 * 관리자 권한 설정 화면의 표시 역할은 `AdminPermissionSettingsDisplayRole`이며,
 * 백엔드 roleCode와 연결하지 않는다.
 */

export const ADMIN_PERMISSION_ROLE_TABS = ['master', 'pm', 'partner', 'viewer'] as const

export type AdminPermissionRoleTab = (typeof ADMIN_PERMISSION_ROLE_TABS)[number]

/** 관리자 권한 설정 화면 탭. 쿼리 `role`의 정본 값. */
export const ADMIN_PERMISSION_SETTINGS_DISPLAY_ROLES = [
  'master',
  'accounting-manager',
  'program-manager',
  'program-viewer',
] as const

export type AdminPermissionSettingsDisplayRole =
  (typeof ADMIN_PERMISSION_SETTINGS_DISPLAY_ROLES)[number]

export interface AdminPermissionItemDef {
  id: string
  label: string
}

/** 화면 카탈로그 평면 항목. 같은 라벨이 카테고리마다 있어도 id로 구분한다. */
export interface AdminPermissionCatalogItem extends AdminPermissionItemDef {
  categoryId: string
  /** 카테고리 안 1-based 표시 순서 */
  order: number
}

export interface AdminPermissionCategoryDef {
  id: string
  title: string
  items: AdminPermissionItemDef[]
}

export type AdminPermissionFlags = Record<string, boolean>

export type AdminPermissionFlagsByRole = Record<AdminPermissionRoleTab, AdminPermissionFlags>

export type AdminPermissionSettingsDisplayFlagsByRole = Record<
  AdminPermissionSettingsDisplayRole,
  AdminPermissionFlags
>
