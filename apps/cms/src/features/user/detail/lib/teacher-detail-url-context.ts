import type { InstructorMemberProfile, User } from '@/types/user'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import { inferInstructorMemberProfileFromRoles } from '@/features/user/api/map-member-role'

/**
 * 교사/겸직 강사 상세 — 새로고침 시 소속 학교·프로필 복원용.
 * 값은 소속 학교의 **내부 식별번호**(`affiliatedSchoolUserId`)만 쓴다. 학교명은 주소창에 넣지 않는다 (QA-0106).
 */
export const USER_DETAIL_AFFILIATED_SCHOOL_QUERY_KEY = 'affiliatedSchool' as const

/**
 * 내부 식별번호 형식(영문·숫자·`-`·`_`)만 소속 학교 힌트로 읽는다.
 * 이전 링크에 남은 학교명 값은 무시한다 — 상세는 `id`·`memberId`로 그대로 열리고 학교명은 상세 GET 값을 쓴다.
 */
export function parseAffiliatedSchoolIdQuery(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  return /^[A-Za-z0-9_-]+$/.test(trimmed) ? trimmed : undefined
}
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
  /** 소속 학교 내부 식별번호 (URL `affiliatedSchool`) */
  affiliatedSchoolUserId?: string
  /** 학교명 힌트 — 메모리(목록 행·드릴다운)에서만 넘긴다. URL에서는 읽지 않는다 */
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
  const schoolId = parseAffiliatedSchoolIdQuery(
    searchParams.get(USER_DETAIL_AFFILIATED_SCHOOL_QUERY_KEY)
  )
  const profile = parseInstructorMemberProfileQuery(
    searchParams.get(USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY)
  )
  return {
    ...(schoolId ? { affiliatedSchoolUserId: schoolId } : {}),
    ...(profile ? { instructorMemberProfile: profile } : {}),
  }
}

/**
 * 브라우저 URL의 상세 `id`.
 * react-router `params`는 transition 커밋을 기다리므로,
 * "지금 상세가 열려 있어야 하는가"는 history(`location.search`)를 본다.
 */
export function readMemberDetailIdFromLocation(
  search: string = typeof window !== 'undefined' ? window.location.search : ''
): string | null {
  return new URLSearchParams(search).get('id')?.trim() || null
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
    | 'roles'
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
  const schoolId = parseAffiliatedSchoolIdQuery(
    user.affiliatedSchoolUserId != null ? String(user.affiliatedSchoolUserId) : undefined
  )
  const profile = resolveInstructorMemberProfile(user) ?? undefined
  return {
    [USER_DETAIL_AFFILIATED_SCHOOL_QUERY_KEY]: schoolId,
    [USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY]: profile,
  }
}

/** 상세 열 때 URL에 memberId·role 힌트 포함 (새로고침 복원) */
export function memberDetailUrlParamsFromUser(
  user: Pick<
    User,
    | 'role'
    | 'roles'
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
 * 서버 `roles[]`가 있으면 URL `instructorProfile`보다 우선 —
 * `SCHOOL_TEACHER` 단독 교사가 겸직(dual) URL로 덮이지 않게 한다.
 * roles가 없을 때만 URL이 API 추론보다 우선 (순수 강사 새로고침 시 교사 상세로 바뀌는 것 방지).
 */
export function applyTeacherDetailUrlContext(
  user: Omit<User, 'password'>,
  ctx: TeacherDetailUrlContext
): Omit<User, 'password'> {
  if (
    user.role !== 'INSTRUCTOR' &&
    !ctx.instructorMemberProfile &&
    !ctx.affiliatedSchoolName &&
    !ctx.affiliatedSchoolUserId
  ) {
    return user
  }

  let next: Omit<User, 'password'> = { ...user }
  if (ctx.instructorMemberProfile && user.role !== 'INSTRUCTOR') {
    next = { ...next, role: 'INSTRUCTOR' }
  }

  if (next.role !== 'INSTRUCTOR') return next

  if (ctx.instructorMemberProfile) {
    const fromRoles = inferInstructorMemberProfileFromRoles(next.roles)
    next = { ...next, instructorMemberProfile: fromRoles ?? ctx.instructorMemberProfile }
  }

  // 순수 강사는 학교 힌트로 겸직 제목(교사 상세)을 만들지 않음
  const acceptsSchoolHint =
    ctx.instructorMemberProfile !== 'instructor_only' &&
    next.instructorMemberProfile !== 'instructor_only'

  const school = ctx.affiliatedSchoolName?.trim()
  if (school && acceptsSchoolHint && !next.affiliatedSchoolName?.trim()) {
    next = { ...next, affiliatedSchoolName: school }
  }

  const schoolId = ctx.affiliatedSchoolUserId?.trim()
  if (schoolId && acceptsSchoolHint && next.affiliatedSchoolUserId == null) {
    next = { ...next, affiliatedSchoolUserId: schoolId }
  }

  return next
}
