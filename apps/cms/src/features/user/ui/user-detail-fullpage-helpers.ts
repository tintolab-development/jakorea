import type { User } from '@/types/user'

export type UserDetailLnbKey = 'detail-info' | 'history' | 'payment-status'

/** 프로그램 참여 이력 LNB 하위 (전체·강사 회원) */
export type UserDetailProgramsChildKey = 'enrollment' | 'lecture' | 'volunteer'

export function programsHistoryHasChildMenu(role: User['role']): boolean {
  return role === 'INDIVIDUAL' || role === 'INSTRUCTOR'
}

export function parseProgramsChildParam(raw: string | null): UserDetailProgramsChildKey | null {
  if (raw === 'enrollment' || raw === 'lecture' || raw === 'volunteer') return raw
  return null
}

export function clampProgramsChildForRole(
  role: User['role'],
  child: UserDetailProgramsChildKey
): UserDetailProgramsChildKey {
  if (role === 'INDIVIDUAL') {
    if (child === 'lecture') return 'enrollment'
    return child
  }
  if (role === 'INSTRUCTOR') {
    // TODO: 강사 상세 > 프로그램 수강 이력은 개발 완료 후 재오픈 예정
    if (child === 'enrollment') return 'lecture'
    return child
  }
  return 'enrollment'
}

export function userDetailModalTitle(displayName: string, role: User['role']): string {
  switch (role) {
    case 'ADMIN':
      return `관리자 상세_${displayName}`
    case 'INSTRUCTOR':
      return `강사 상세_${displayName}`
    case 'SCHOOL':
      return `학교 상세_${displayName}`
    default:
      return `회원 상세_${displayName}`
  }
}

export function userDetailSidebarNavAriaLabel(
  mode: 'default' | 'permission',
  role: User['role']
): string {
  if (mode === 'permission') return '신청 정보 메뉴'
  switch (role) {
    case 'ADMIN':
      return '관리자 상세 메뉴'
    case 'INSTRUCTOR':
      return '강사 상세 메뉴'
    case 'SCHOOL':
      return '학교 상세 메뉴'
    default:
      return '회원 상세 메뉴'
  }
}
