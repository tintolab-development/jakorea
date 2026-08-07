import type { InstructorMemberProfile, User } from '@/types/user'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'

/** 교사/겸직 강사 상세 — 새로고침 시 학교명·프로필 복원용 */
export const USER_DETAIL_AFFILIATED_SCHOOL_QUERY_KEY = 'affiliatedSchool' as const
export const USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY = 'instructorProfile' as const
/** 새로고침 시 상세 GET — registry 없을 때 memberId·role 힌트 */
export const USER_DETAIL_MEMBER_ID_QUERY_KEY = 'memberId' as const
export const USER_DETAIL_MEMBER_ROLE_QUERY_KEY = 'memberRole' as const

const VALID_INSTRUCTOR_PROFILES: readonly InstructorMemberProfile[] = [
  'school_teacher',
  'instructor_dual',
  'instructor_only',
] as const

const VALID_MEMBER_ROLES: readonly User['role'][] = [
  'INSTRUCTOR',
  'INDIVIDUAL',
  'SCHOOL',
  'ADMIN',
] as const

export function parseInstructorMemberProfileQuery(
  value: string | null | undefined
): InstructorMemberProfile | undefined {
  if (!value) return undefined
  return VALID_INSTRUCTOR_PROFILES.includes(value as InstructorMemberProfile)
    ? (value as InstructorMemberProfile)
    : undefined
}

export function parseMemberRoleQuery(value: string | null | undefined): User['role'] | undefined {
  if (!value) return undefined
  return VALID_MEMBER_ROLES.includes(value as User['role']) ? (value as User['role']) : undefined
}

export type TeacherDetailUrlContext = {
  affiliatedSchoolName?: string
  instructorMemberProfile?: InstructorMemberProfile
}

export type MemberDetailUrlContext = TeacherDetailUrlContext & {
  memberId?: number
  role?: User['role']
}

export function readTeacherDetailUrlContext(
  searchParams: URLSearchParams
): TeacherDetailUrlContext {
  const school = searchParams.get(USER_DETAIL_AFFILIATED_SCHOOL_QUERY_KEY)?.trim()
  const profile = parseInstructorMemberProfileQuery(
    searchParams.get(USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY)
  )
  return {
    ...(school ? { affiliatedSchoolName: school } : {}),
    ...(profile ? { instructorMemberProfile: profile } : {}),
  }
}

export function readMemberDetailUrlContext(
  searchParams: URLSearchParams
): MemberDetailUrlContext {
  const teacher = readTeacherDetailUrlContext(searchParams)
  const memberIdRaw = searchParams.get(USER_DETAIL_MEMBER_ID_QUERY_KEY)?.trim()
  const memberId =
    memberIdRaw && /^\d+$/.test(memberIdRaw) ? Number(memberIdRaw) : undefined
  const role = parseMemberRoleQuery(searchParams.get(USER_DETAIL_MEMBER_ROLE_QUERY_KEY))
  return {
    ...teacher,
    ...(memberId != null ? { memberId } : {}),
    ...(role ? { role } : {}),
  }
}

/** 상세 열 때 URL에 심을 쿼리 (없으면 undefined → 삭제) */
export function teacherDetailUrlParamsFromUser(
  user: Pick<
    User,
    | 'role'
    | 'affiliatedSchoolName'
    | 'schoolInfo'
    | 'instructorMemberProfile'
    | 'affiliatedSchoolUserId'
  >
): {
  [USER_DETAIL_AFFILIATED_SCHOOL_QUERY_KEY]?: string
  [USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY]?: string
} {
  if (user.role !== 'INSTRUCTOR') {
    return {
      [USER_DETAIL_AFFILIATED_SCHOOL_QUERY_KEY]: undefined,
      [USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY]: undefined,
    }
  }
  const school =
    user.affiliatedSchoolName?.trim() || user.schoolInfo?.schoolName?.trim() || undefined
  const profile = resolveInstructorMemberProfile(user) ?? undefined
  return {
    [USER_DETAIL_AFFILIATED_SCHOOL_QUERY_KEY]: school,
    [USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY]: profile,
  }
}

/** 상세 열 때 URL에 memberId·role 힌트 포함 (새로고침 복원) */
export function memberDetailUrlParamsFromUser(
  user: Pick<
    User,
    | 'role'
    | 'memberId'
    | 'affiliatedSchoolName'
    | 'schoolInfo'
    | 'instructorMemberProfile'
    | 'affiliatedSchoolUserId'
  >
): {
  [USER_DETAIL_AFFILIATED_SCHOOL_QUERY_KEY]?: string
  [USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY]?: string
  [USER_DETAIL_MEMBER_ID_QUERY_KEY]?: string
  [USER_DETAIL_MEMBER_ROLE_QUERY_KEY]?: string
} {
  return {
    ...teacherDetailUrlParamsFromUser(user),
    [USER_DETAIL_MEMBER_ID_QUERY_KEY]:
      user.memberId != null ? String(user.memberId) : undefined,
    [USER_DETAIL_MEMBER_ROLE_QUERY_KEY]: user.role,
  }
}

/**
 * API 상세에 학교명·프로필이 비어도 URL/드릴다운 힌트로 상세 UI를 유지한다.
 * URL `instructorProfile`이 있으면 API 추론(school_teacher/dual)보다 우선 —
 * 순수 강사(`instructor_only`) 새로고침 시 「교사 상세」로 바뀌는 것 방지.
 */
export function applyTeacherDetailUrlContext(
  user: Omit<User, 'password'>,
  ctx: TeacherDetailUrlContext
): Omit<User, 'password'> {
  if (user.role !== 'INSTRUCTOR' && !ctx.instructorMemberProfile && !ctx.affiliatedSchoolName) {
    return user
  }

  let next: Omit<User, 'password'> = { ...user }
  if (ctx.instructorMemberProfile && user.role !== 'INSTRUCTOR') {
    next = { ...next, role: 'INSTRUCTOR' }
  }

  if (next.role !== 'INSTRUCTOR') return next

  if (ctx.instructorMemberProfile) {
    next = { ...next, instructorMemberProfile: ctx.instructorMemberProfile }
  }

  const school = ctx.affiliatedSchoolName?.trim()
  // 순수 강사는 학교명 힌트로 겸직 제목(교사 상세)을 만들지 않음
  if (
    school &&
    !next.affiliatedSchoolName?.trim() &&
    ctx.instructorMemberProfile !== 'instructor_only' &&
    next.instructorMemberProfile !== 'instructor_only'
  ) {
    next = { ...next, affiliatedSchoolName: school }
  }

  return next
}
