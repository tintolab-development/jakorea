import type { User } from '@/types/user'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'

export type UserDetailLnbKey = 'detail-info' | 'history' | 'payment-status'

/** 프로그램 참여 이력 LNB 하위 — 역할·교사 프로필별 수강·강의·봉사 (학교 소속 교사는 강의 탭 없음) */
export type UserDetailProgramsChildKey = 'enrollment' | 'lecture' | 'volunteer'

/** 회원 상세 풀페이지 — LNB + (선택) 프로그램 이력 하위 탭 */
export type TabState = {
  lnb: UserDetailLnbKey
  child?: UserDetailProgramsChildKey
}

export type InstructorLnbPrepareClickContext = 'history-top' | 'history-child' | 'payment-top'

export type UserDetailUrlSyncUser = Pick<
  User,
  'id' | 'role' | 'name' | 'instructorMemberProfile' | 'affiliatedSchoolUserId' | 'affiliatedSchoolName' | 'schoolInfo'
>

export function programsHistoryHasChildMenu(user: UserDetailUrlSyncUser): boolean {
  if (user.role === 'INDIVIDUAL') return true
  if (user.role === 'INSTRUCTOR') return true
  if (user.role === 'SCHOOL') return true
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
  if (user.role === 'INSTRUCTOR') {
    const p = resolveInstructorMemberProfile(user)
    if (p === 'school_teacher' && child === 'lecture') return 'enrollment'
    return child
  }
  return 'enrollment'
}

/**
 * 강사 상세 LNB 클릭 시 «준비 중» 알림이 필요하면 true.
 * 정산·프로그램 이력 탭은 연결되어 있으므로 현재는 항상 false.
 */
export function instructorDetailLnbClickShowsPrepareMessage(
  _user: Pick<User, 'role' | 'instructorMemberProfile' | 'affiliatedSchoolUserId'>,
  _lnb: UserDetailLnbKey,
  _context: InstructorLnbPrepareClickContext,
  _programsChild?: UserDetailProgramsChildKey
): boolean {
  return false
}

/** 정산 현황 LNB — 순수 강사(instructor_only)·교사 겸 강사(instructor_dual) */
export function instructorDetailShowsPaymentStatusLnb(
  user: Pick<User, 'role' | 'instructorMemberProfile' | 'affiliatedSchoolUserId'>
): boolean {
  if (user.role !== 'INSTRUCTOR') return false
  const p = resolveInstructorMemberProfile(user)
  return p === 'instructor_only' || p === 'instructor_dual'
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
