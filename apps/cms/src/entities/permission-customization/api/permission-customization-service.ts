/**
 * 권한 커스터마이징 API 서비스
 * P2: 마스터 관리자 권한 커스터마이징
 */

import type {
  PermissionCustomizationConfig,
  CustomizedAdminPermission,
  CustomizedProgramRolePermission,
} from '@/types/permission-customization'
import type { AdminLevel, ProgramRole } from '@/types/user'
import {
  getPermissionCustomization,
  updateAdminPermission,
  updateProgramRolePermission,
  resetPermissionCustomization,
} from '@/data/mock/permission-customization'

/**
 * 권한 커스터마이징 설정 조회
 */
export async function fetchPermissionCustomization(): Promise<PermissionCustomizationConfig> {
  await new Promise(resolve => setTimeout(resolve, 300))
  return getPermissionCustomization()
}

/**
 * 관리자 권한 설정 업데이트
 */
export async function updateAdminPermissionCustomization(
  adminLevel: AdminLevel,
  permissions: Partial<CustomizedAdminPermission['permissions']>,
  updatedBy: string
): Promise<CustomizedAdminPermission> {
  await new Promise(resolve => setTimeout(resolve, 500))
  return updateAdminPermission(adminLevel, permissions, updatedBy)
}

/**
 * 프로그램 역할 권한 설정 업데이트
 */
export async function updateProgramRolePermissionCustomization(
  programRole: ProgramRole,
  permissions: Partial<CustomizedProgramRolePermission['permissions']>,
  updatedBy: string
): Promise<CustomizedProgramRolePermission> {
  await new Promise(resolve => setTimeout(resolve, 500))
  return updateProgramRolePermission(programRole, permissions, updatedBy)
}

/**
 * 권한 커스터마이징 설정 초기화
 */
export async function resetPermissionCustomizationConfig(
  updatedBy: string
): Promise<PermissionCustomizationConfig> {
  await new Promise(resolve => setTimeout(resolve, 500))
  return resetPermissionCustomization(updatedBy)
}
