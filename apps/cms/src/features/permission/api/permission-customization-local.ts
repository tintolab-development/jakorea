/**
 * 권한 커스터마이징 Mock 데이터
 * P2: 마스터 관리자 권한 커스터마이징
 */

import type {
  PermissionCustomizationConfig,
  CustomizedAdminPermission,
  CustomizedProgramRolePermission,
} from '@/types/permission-customization'
import type { AdminLevel, ProgramRole } from '@/types/user'
import { ADMIN_PERMISSIONS, PROGRAM_ROLE_PERMISSIONS } from '@/shared/config/permissions'

/**
 * 기본 권한 설정을 커스터마이징 설정으로 변환
 */
function createDefaultCustomization(): PermissionCustomizationConfig {
  const adminPermissions: Record<AdminLevel, CustomizedAdminPermission> = {
    MASTER: {
      adminLevel: 'MASTER',
      permissions: {
        canManageUsers: ADMIN_PERMISSIONS.MASTER.canManageUsers,
        canManageSystemSettings: ADMIN_PERMISSIONS.MASTER.canManageSystemSettings,
        canAccessAllPrograms: ADMIN_PERMISSIONS.MASTER.canAccessAllPrograms,
        canDeleteUsers: ADMIN_PERMISSIONS.MASTER.canDeleteUsers,
        canApprovePermissionRequests: ADMIN_PERMISSIONS.MASTER.canApprovePermissionRequests,
        canCreateProgram: true,
        canEditProgram: true,
        canDeleteProgram: true,
        canDownloadData: true,
        canManageSettlements: true,
      },
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    },
    ADMIN: {
      adminLevel: 'ADMIN',
      permissions: {
        canManageUsers: ADMIN_PERMISSIONS.ADMIN.canManageUsers,
        canManageSystemSettings: ADMIN_PERMISSIONS.ADMIN.canManageSystemSettings,
        canAccessAllPrograms: ADMIN_PERMISSIONS.ADMIN.canAccessAllPrograms,
        canDeleteUsers: ADMIN_PERMISSIONS.ADMIN.canDeleteUsers,
        canApprovePermissionRequests: ADMIN_PERMISSIONS.ADMIN.canApprovePermissionRequests,
        canCreateProgram: true,
        canEditProgram: true,
        canDeleteProgram: false,
        canDownloadData: true,
        canManageSettlements: true,
      },
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    },
    GENERAL: {
      adminLevel: 'GENERAL',
      permissions: {
        canManageUsers: ADMIN_PERMISSIONS.GENERAL.canManageUsers,
        canManageSystemSettings: ADMIN_PERMISSIONS.GENERAL.canManageSystemSettings,
        canAccessAllPrograms: ADMIN_PERMISSIONS.GENERAL.canAccessAllPrograms,
        canDeleteUsers: ADMIN_PERMISSIONS.GENERAL.canDeleteUsers,
        canApprovePermissionRequests: ADMIN_PERMISSIONS.GENERAL.canApprovePermissionRequests,
        canCreateProgram: false,
        canEditProgram: false,
        canDeleteProgram: false,
        canDownloadData: false,
        canManageSettlements: false,
      },
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    },
  }

  const programRolePermissions: Record<ProgramRole, CustomizedProgramRolePermission> = {
    OWNER: {
      programRole: 'OWNER',
      permissions: {
        canCreate: PROGRAM_ROLE_PERMISSIONS.OWNER.canCreate,
        canUpload: PROGRAM_ROLE_PERMISSIONS.OWNER.canUpload,
        canDownload: PROGRAM_ROLE_PERMISSIONS.OWNER.canDownload,
        canDelete: PROGRAM_ROLE_PERMISSIONS.OWNER.canDelete,
        canApprove: PROGRAM_ROLE_PERMISSIONS.OWNER.canApprove,
      },
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    },
    PARTNER: {
      programRole: 'PARTNER',
      permissions: {
        canCreate: PROGRAM_ROLE_PERMISSIONS.PARTNER.canCreate,
        canUpload: PROGRAM_ROLE_PERMISSIONS.PARTNER.canUpload,
        canDownload: PROGRAM_ROLE_PERMISSIONS.PARTNER.canDownload,
        canDelete: PROGRAM_ROLE_PERMISSIONS.PARTNER.canDelete,
        canApprove: PROGRAM_ROLE_PERMISSIONS.PARTNER.canApprove,
      },
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    },
    ASSISTANT: {
      programRole: 'ASSISTANT',
      permissions: {
        canCreate: PROGRAM_ROLE_PERMISSIONS.ASSISTANT.canCreate,
        canUpload: PROGRAM_ROLE_PERMISSIONS.ASSISTANT.canUpload,
        canDownload: PROGRAM_ROLE_PERMISSIONS.ASSISTANT.canDownload,
        canDelete: PROGRAM_ROLE_PERMISSIONS.ASSISTANT.canDelete,
        canApprove: PROGRAM_ROLE_PERMISSIONS.ASSISTANT.canApprove,
      },
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    },
  }

  return {
    adminPermissions,
    programRolePermissions,
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  }
}

// Mock 데이터 저장소
let permissionCustomizationConfig: PermissionCustomizationConfig = createDefaultCustomization()

/**
 * 권한 커스터마이징 설정 조회
 */
export function getPermissionCustomization(): PermissionCustomizationConfig {
  return { ...permissionCustomizationConfig }
}

/**
 * 권한 커스터마이징 설정 업데이트
 */
export function updatePermissionCustomization(
  config: Partial<PermissionCustomizationConfig>,
  updatedBy: string
): PermissionCustomizationConfig {
  permissionCustomizationConfig = {
    ...permissionCustomizationConfig,
    ...config,
    version: incrementVersion(permissionCustomizationConfig.version),
    updatedAt: new Date().toISOString(),
    updatedBy,
  }
  return { ...permissionCustomizationConfig }
}

/**
 * 관리자 권한 설정 업데이트
 */
export function updateAdminPermission(
  adminLevel: AdminLevel,
  permissions: Partial<CustomizedAdminPermission['permissions']>,
  updatedBy: string
): CustomizedAdminPermission {
  const current = permissionCustomizationConfig.adminPermissions[adminLevel]
  const updated: CustomizedAdminPermission = {
    ...current,
    permissions: {
      ...current.permissions,
      ...permissions,
    },
    updatedAt: new Date().toISOString(),
    updatedBy,
  }

  permissionCustomizationConfig = {
    ...permissionCustomizationConfig,
    adminPermissions: {
      ...permissionCustomizationConfig.adminPermissions,
      [adminLevel]: updated,
    },
    version: incrementVersion(permissionCustomizationConfig.version),
    updatedAt: new Date().toISOString(),
    updatedBy,
  }

  return { ...updated }
}

/**
 * 프로그램 역할 권한 설정 업데이트
 */
export function updateProgramRolePermission(
  programRole: ProgramRole,
  permissions: Partial<CustomizedProgramRolePermission['permissions']>,
  updatedBy: string
): CustomizedProgramRolePermission {
  const current = permissionCustomizationConfig.programRolePermissions[programRole]
  const updated: CustomizedProgramRolePermission = {
    ...current,
    permissions: {
      ...current.permissions,
      ...permissions,
    },
    updatedAt: new Date().toISOString(),
    updatedBy,
  }

  permissionCustomizationConfig = {
    ...permissionCustomizationConfig,
    programRolePermissions: {
      ...permissionCustomizationConfig.programRolePermissions,
      [programRole]: updated,
    },
    version: incrementVersion(permissionCustomizationConfig.version),
    updatedAt: new Date().toISOString(),
    updatedBy,
  }

  return { ...updated }
}

/**
 * 버전 증가 헬퍼 함수
 */
function incrementVersion(version: string): string {
  const parts = version.split('.')
  const patch = parseInt(parts[2] || '0', 10) + 1
  return `${parts[0]}.${parts[1]}.${patch}`
}

/**
 * 권한 커스터마이징 설정 초기화 (기본값으로 복원)
 */
export function resetPermissionCustomization(updatedBy: string): PermissionCustomizationConfig {
  permissionCustomizationConfig = createDefaultCustomization()
  permissionCustomizationConfig.updatedBy = updatedBy
  permissionCustomizationConfig.updatedAt = new Date().toISOString()
  return { ...permissionCustomizationConfig }
}
