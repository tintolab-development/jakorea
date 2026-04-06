import type { User } from '@/types/user'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'

export type UserDetailLnbKey = 'detail-info' | 'history' | 'payment-status'

/** 프로그램 참여 이력 LNB 하위 (전체·일반 교사) */
export type UserDetailProgramsChildKey = 'enrollment' | 'lecture' | 'volunteer'

export type UserDetailUrlSyncUser = Pick<
  User,
  'id' | 'role' | 'name' | 'instructorMemberProfile' | 'affiliatedSchoolUserId' | 'affiliatedSchoolName' | 'schoolInfo'
>

export function programsHistoryHasChildMenu(user: UserDetailUrlSyncUser): boolean {
  if (user.role === 'INDIVIDUAL') return true
  if (user.role === 'INSTRUCTOR') {
    return resolveInstructorMemberProfile(user) === 'school_teacher'
  }
  return false
}

export function parseProgramsChildParam(raw: string | null): UserDetailProgramsChildKey | null {
  if (raw === 'enrollment' || raw === 'lecture' || raw === 'volunteer') return raw
  return null
}

export function clampProgramsChildForUser(
  user: UserDetailUrlSyncUser,
  child: UserDetailProgramsChildKey
): UserDetailProgramsChildKey {
  if (user.role === 'INDIVIDUAL') {
    if (child === 'lecture') return 'enrollment'
    return child
  }
  if (user.role === 'INSTRUCTOR' && programsHistoryHasChildMenu(user)) {
    return child
  }
  return 'enrollment'
}

/** 정산 현황 사이드바·딥링크 — 순수 교사(`school_teacher`)는 비노출, 겸직·순수 강사만 허용 */
export function instructorDetailShowsPaymentStatusLnb(
  user: Pick<User, 'role' | 'instructorMemberProfile' | 'affiliatedSchoolUserId'>
): boolean {
  if (user.role !== 'INSTRUCTOR') return false
  return resolveInstructorMemberProfile(user) !== 'school_teacher'
}

function managedProgramCountDisplay(user: Pick<User, 'listMetrics' | 'programRoles'>): string {
  const n = user.listMetrics?.managedProgramCount
  if (n != null && !Number.isNaN(n)) return String(n)
  const keys = user.programRoles ? Object.keys(user.programRoles).length : 0
  return keys > 0 ? String(keys) : '-'
}

function instructorDetailTitleSchoolName(user: Pick<User, 'affiliatedSchoolName' | 'schoolInfo'>): string {
  const fromField = user.affiliatedSchoolName?.trim()
  if (fromField) return fromField
  return user.schoolInfo?.schoolName?.trim() || '-'
}

export function userDetailModalTitle(user: Pick<
  User,
  | 'name'
  | 'role'
  | 'instructorMemberProfile'
  | 'affiliatedSchoolUserId'
  | 'affiliatedSchoolName'
  | 'schoolInfo'
  | 'listMetrics'
  | 'programRoles'
>): string {
  const displayName = user.name
  switch (user.role) {
    case 'ADMIN':
      return `관리자 상세_${displayName}`
    case 'INSTRUCTOR': {
      const profile = resolveInstructorMemberProfile(user)
      if (profile === 'school_teacher' || profile === 'instructor_dual') {
        const school = instructorDetailTitleSchoolName(user)
        return `교사 상세_${school}_${displayName}`
      }
      return `강사 상세_${displayName}`
    }
    case 'SCHOOL':
      return `학교 상세_${displayName}`
    default:
      return `회원 상세_${displayName}`
  }
}

export function userDetailSidebarNavAriaLabel(
  mode: 'default' | 'permission',
  user: Pick<User, 'role' | 'instructorMemberProfile' | 'affiliatedSchoolUserId'>
): string {
  if (mode === 'permission') return '신청 정보 메뉴'
  switch (user.role) {
    case 'ADMIN':
      return '관리자 상세 메뉴'
    case 'INSTRUCTOR': {
      const profile = resolveInstructorMemberProfile(user)
      if (profile === 'school_teacher' || profile === 'instructor_dual') {
        return '교사 상세 메뉴'
      }
      return '강사 상세 메뉴'
    }
    case 'SCHOOL':
      return '학교 상세 메뉴'
    default:
      return '회원 상세 메뉴'
  }
}

export { managedProgramCountDisplay, instructorDetailTitleSchoolName }
