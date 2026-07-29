import type { ReactNode } from 'react'
import type { User } from '@/types/user'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import { DetailInfoForm } from '@/shared/components/detail-info-form'

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

export type ManagedProgramMetricsParts = { inProgress: string; total: string }

/**
 * 관리자 담당 프로그램 지표 — `진행 중`·`전체` 건수 문자열(각 `n건` 또는 `-건`).
 * 둘 다 없으면 null(화면에서는 `-` 단독).
 */
export function getManagedProgramMetricsParts(
  user: Pick<User, 'listMetrics' | 'programRoles'>
): ManagedProgramMetricsParts | null {
  const lm = user.listMetrics
  const explicitTotal = lm?.managedProgramCount
  const explicitInProgress = lm?.managedProgramInProgressCount
  const roleKeyCount = user.programRoles ? Object.keys(user.programRoles).length : 0

  const total =
    explicitTotal != null && !Number.isNaN(explicitTotal)
      ? explicitTotal
      : roleKeyCount > 0
        ? roleKeyCount
        : null

  const inProgress =
    explicitInProgress != null && !Number.isNaN(explicitInProgress) ? explicitInProgress : null

  if (total === null && inProgress === null) return null

  const inProgressLabel = inProgress !== null ? `${inProgress}건` : '-건'
  const totalLabel = total !== null ? `${total}건` : '-건'
  return { inProgress: inProgressLabel, total: totalLabel }
}

/** 회원 상세·목록 — `진행 중` / `전체` 사이는 `DetailInfoForm.Separator` */
export function ManagedProgramCountDisplay({
  user,
}: {
  user: Pick<User, 'listMetrics' | 'programRoles'>
}): ReactNode {
  const parts = getManagedProgramMetricsParts(user)
  if (!parts) return '-'
  return (
    <>
      진행 중: {parts.inProgress}
      <DetailInfoForm.Separator />
      전체: {parts.total}
    </>
  )
}

function instructorDetailTitleSchoolName(
  user: Pick<User, 'affiliatedSchoolName' | 'schoolInfo'>
): string | undefined {
  const fromField = user.affiliatedSchoolName?.trim()
  if (fromField && fromField !== '-') return fromField
  const fromSchool = user.schoolInfo?.schoolName?.trim()
  if (fromSchool && fromSchool !== '-') return fromSchool
  return undefined
}

/** 회원 상세 풀페이지 타이틀 — `강사 상세 (홍길동)` 형식 */
function formatUserDetailModalTitle(kindLabel: string, subject: string): string {
  return `${kindLabel} (${subject})`
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
  const displayName = user.name?.trim() || '-'
  switch (user.role) {
    case 'ADMIN':
      return formatUserDetailModalTitle('관리자 상세', displayName)
    case 'INSTRUCTOR': {
      const profile = resolveInstructorMemberProfile(user)
      if (profile === 'school_teacher' || profile === 'instructor_dual') {
        const school = instructorDetailTitleSchoolName(user)
        // 학교명 없으면 빈 세그먼트를 넣지 않음
        const subject = school ? `${school}_${displayName}` : displayName
        return formatUserDetailModalTitle('교사 상세', subject)
      }
      return formatUserDetailModalTitle('강사 상세', displayName)
    }
    case 'SCHOOL':
      return formatUserDetailModalTitle('학교 상세', displayName)
    default:
      return formatUserDetailModalTitle('회원 상세', displayName)
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

export { instructorDetailTitleSchoolName }
