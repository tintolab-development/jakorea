/**
 * 권한 커스터마이징 타입 정의
 * P2: 마스터 관리자 권한 커스터마이징
 */

import type { AdminLevel, ProgramRole } from './user'

/**
 * 권한 항목 타입
 */
export type PermissionItemType =
  | 'canManageUsers'
  | 'canManageSystemSettings'
  | 'canAccessAllPrograms'
  | 'canDeleteUsers'
  | 'canApprovePermissionRequests'
  | 'canCreateProgram'
  | 'canEditProgram'
  | 'canDeleteProgram'
  | 'canDownloadData'
  | 'canManageSettlements'

/**
 * 프로그램 역할별 권한 항목 타입
 */
export type ProgramRolePermissionItemType =
  | 'canCreate'
  | 'canUpload'
  | 'canDownload'
  | 'canDelete'
  | 'canApprove'

/**
 * 권한 항목 정의
 */
export interface PermissionItem {
  key: PermissionItemType
  label: string
  description: string
  category: 'user' | 'program' | 'system' | 'settlement'
}

/**
 * 프로그램 역할 권한 항목 정의
 */
export interface ProgramRolePermissionItem {
  key: ProgramRolePermissionItemType
  label: string
  description: string
}

/**
 * 커스터마이징된 관리자 권한 설정
 */
export interface CustomizedAdminPermission {
  adminLevel: AdminLevel
  permissions: Record<PermissionItemType, boolean>
  updatedAt: string
  updatedBy: string
}

/**
 * 커스터마이징된 프로그램 역할 권한 설정
 */
export interface CustomizedProgramRolePermission {
  programRole: ProgramRole
  permissions: Record<ProgramRolePermissionItemType, boolean>
  updatedAt: string
  updatedBy: string
}

/**
 * 전체 권한 커스터마이징 설정
 */
export interface PermissionCustomizationConfig {
  adminPermissions: Record<AdminLevel, CustomizedAdminPermission>
  programRolePermissions: Record<ProgramRole, CustomizedProgramRolePermission>
  version: string
  updatedAt: string
  updatedBy: string
}
