/**
 * 사용자·관리자·프로그램 역할 라벨 헬퍼
 * (구 RoleBadge UI는 제거. 라벨 문자열만 유지)
 */

import type { AdminLevel, ProgramRole, UserRole } from '@/types/user'

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: '관리자',
  INSTRUCTOR: '강사',
  INDIVIDUAL: '학생',
  SCHOOL: '학교',
}

const ADMIN_LEVEL_LABELS: Record<AdminLevel, string> = {
  MASTER: '마스터 관리자',
  ADMIN: '중간관리자(PM/파트너)',
  GENERAL: '뷰어',
}

const PROGRAM_ROLE_LABELS: Record<ProgramRole, string> = {
  OWNER: '담당자',
  PARTNER: '파트너',
  ASSISTANT: '보조',
}

/** 권한 레이블 */
export function getRoleLabel(role: UserRole, adminLevel?: AdminLevel): string {
  if (role === 'ADMIN' && adminLevel) {
    return ADMIN_LEVEL_LABELS[adminLevel]
  }
  return ROLE_LABELS[role] || role
}

/** 관리자 권한 레벨 라벨 */
export function getAdminLevelLabel(level: AdminLevel): string {
  return ADMIN_LEVEL_LABELS[level] || level
}

/** 프로그램 역할 라벨 */
export function getProgramRoleLabel(role: ProgramRole): string {
  return PROGRAM_ROLE_LABELS[role] || role
}
