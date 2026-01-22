/**
 * 권한 정책 정의
 * Phase 0.1.1: 역할/권한 체계 재정의
 * requirements.md §2.2 관리자 권한 정의, §백오피스 권한 구조 기준
 */

import type { AdminLevel, ProgramRole } from '@/types/user'

// ===== 관리자 권한 정의 (§2.2) =====

export interface AdminPermission {
  label: string
  description: string
  canManageUsers: boolean
  canManageSystemSettings: boolean
  canAccessAllPrograms: boolean
  canDeleteUsers: boolean
  canApprovePermissionRequests: boolean
}

export const ADMIN_PERMISSIONS: Record<AdminLevel, AdminPermission> = {
  MASTER: {
    label: '마스터 관리자',
    description: '회원/권한 총괄 관리, 시스템 설정, 모든 기능 접근',
    canManageUsers: true,
    canManageSystemSettings: true,
    canAccessAllPrograms: true,
    canDeleteUsers: true,
    canApprovePermissionRequests: true,
  },
  ADMIN: {
    label: '관리자',
    description: '프로그램 운영 전반, 신청 승인/반려, 강사 매칭, 정산',
    canManageUsers: false,
    canManageSystemSettings: false,
    canAccessAllPrograms: false, // 담당 프로그램만
    canDeleteUsers: false,
    canApprovePermissionRequests: false,
  },
  GENERAL: {
    label: '일반',
    description: '조회 기능만 (기본값, 권한부여 0)',
    canManageUsers: false,
    canManageSystemSettings: false,
    canAccessAllPrograms: false,
    canDeleteUsers: false,
    canApprovePermissionRequests: false,
  },
}

// ===== 프로그램 역할 권한 정의 (§백오피스 권한 구조) =====

export interface ProgramRolePermission {
  label: string
  description: string
  canCreate: boolean
  canUpload: boolean
  canDownload: boolean
  canDelete: boolean
  canApprove: boolean
}

export const PROGRAM_ROLE_PERMISSIONS: Record<ProgramRole, ProgramRolePermission> = {
  OWNER: {
    label: '담당자',
    description: '해당 사업 총괄 담당자',
    canCreate: true,
    canUpload: true,
    canDownload: true,
    canDelete: true,
    canApprove: true,
    // 프로그램 생성 시 자동 부여
  },
  PARTNER: {
    label: '파트너',
    description: '총괄사업 담당자와 공동 진행 내부 직원',
    canCreate: true,
    canUpload: true,
    canDownload: false, // 다운로드 기능 제한
    canDelete: false,
    canApprove: true,
  },
  ASSISTANT: {
    label: '보조',
    description: '뷰어 기능만 (업로드/다운로드/삭제 제외)',
    canCreate: false,
    canUpload: false,
    canDownload: false,
    canDelete: false,
    canApprove: false,
  },
}

// ===== 유틸리티 함수 =====

/**
 * 관리자 권한 레벨에 따른 권한 객체 반환
 */
export function getAdminPermission(level: AdminLevel): AdminPermission {
  return ADMIN_PERMISSIONS[level]
}

/**
 * 프로그램 역할에 따른 권한 객체 반환
 */
export function getProgramRolePermission(role: ProgramRole): ProgramRolePermission {
  return PROGRAM_ROLE_PERMISSIONS[role]
}

/**
 * 관리자 권한 레벨 라벨 반환
 */
export function getAdminLevelLabel(level: AdminLevel): string {
  return ADMIN_PERMISSIONS[level].label
}

/**
 * 프로그램 역할 라벨 반환
 */
export function getProgramRoleLabel(role: ProgramRole): string {
  return PROGRAM_ROLE_PERMISSIONS[role].label
}
