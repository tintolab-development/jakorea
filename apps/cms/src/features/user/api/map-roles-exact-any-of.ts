/**
 * `listMembers` `rolesExactAnyOf` 인코딩 — handoff A 형식
 * `token+token,token+token` (set 내 순서 무시 exact match OR)
 */

export const MEMBER_ROLE_TOKEN = {
  general: 'general',
  schoolTeacher: 'school_teacher',
  instructor: 'instructor',
  instructorRevoked: 'instructor_revoked',
  admin: 'admin',
} as const

/** 강사 회원 목록 — 활성 강사 + 교사겸강사 (권한 종료 제외) */
export const INSTRUCTOR_LIST_ROLES_EXACT_ANY_OF = [
  [MEMBER_ROLE_TOKEN.general, MEMBER_ROLE_TOKEN.instructor],
  [MEMBER_ROLE_TOKEN.schoolTeacher, MEMBER_ROLE_TOKEN.instructor],
] as const

/** 전체 회원 목록 — 회원 유형 필터 value (표시 라벨과 1:1) */
export const ALL_TAB_ROLE_FILTER_VALUES = [
  'INDIVIDUAL',
  'SCHOOL_TEACHER',
  'INSTRUCTOR',
  'INSTRUCTOR_DUAL',
  'INSTRUCTOR_REVOKED',
  'ADMIN',
] as const

export type AllTabRoleFilterValue = (typeof ALL_TAB_ROLE_FILTER_VALUES)[number]

const ALL_TAB_ROLE_FILTER_SET = new Set<string>(ALL_TAB_ROLE_FILTER_VALUES)

const MEMBER_INSTRUCTOR_DUAL_SETS = [
  [MEMBER_ROLE_TOKEN.schoolTeacher, MEMBER_ROLE_TOKEN.instructor],
] as const
const MEMBER_INSTRUCTOR_REVOKED_SETS = [
  [MEMBER_ROLE_TOKEN.general, MEMBER_ROLE_TOKEN.instructorRevoked],
  [MEMBER_ROLE_TOKEN.schoolTeacher, MEMBER_ROLE_TOKEN.instructorRevoked],
] as const

/**
 * 전체 회원 — 유형 셀렉트 → exact set allowlist.
 * 「강사」는 겸직(학교(교사)+강사)·권한 종료 강사까지 포함한다(기획 확정 2026-11-14).
 */
const ALL_TAB_ROLE_ALLOWLISTS: Record<AllTabRoleFilterValue, readonly (readonly string[])[]> = {
  INDIVIDUAL: [[MEMBER_ROLE_TOKEN.general]],
  SCHOOL_TEACHER: [[MEMBER_ROLE_TOKEN.schoolTeacher]],
  INSTRUCTOR: [
    [MEMBER_ROLE_TOKEN.general, MEMBER_ROLE_TOKEN.instructor],
    ...MEMBER_INSTRUCTOR_DUAL_SETS,
    ...MEMBER_INSTRUCTOR_REVOKED_SETS,
  ],
  INSTRUCTOR_DUAL: MEMBER_INSTRUCTOR_DUAL_SETS,
  INSTRUCTOR_REVOKED: MEMBER_INSTRUCTOR_REVOKED_SETS,
  ADMIN: [[MEMBER_ROLE_TOKEN.admin]],
}

export function parseAllTabRoleFilterParam(raw?: string): AllTabRoleFilterValue | 'ALL' {
  const key = raw?.trim().toUpperCase()
  if (!key || key === 'ALL') return 'ALL'
  if (ALL_TAB_ROLE_FILTER_SET.has(key)) return key as AllTabRoleFilterValue
  return 'ALL'
}

/** `GET /api/admin/members/all` 응답 `roles[]` 토큰 */
export const DIRECTORY_ROLE_TOKEN = {
  individual: 'INDIVIDUAL',
  schoolTeacher: 'SCHOOL_TEACHER',
  instructor: 'INSTRUCTOR',
  instructorRevoked: 'INSTRUCTOR_REVOKED',
} as const

const DIRECTORY_INSTRUCTOR_DUAL_SETS = [
  [DIRECTORY_ROLE_TOKEN.instructor, DIRECTORY_ROLE_TOKEN.schoolTeacher],
] as const
const DIRECTORY_INSTRUCTOR_REVOKED_SETS = [
  [DIRECTORY_ROLE_TOKEN.instructorRevoked],
  [DIRECTORY_ROLE_TOKEN.individual, DIRECTORY_ROLE_TOKEN.instructorRevoked],
  [DIRECTORY_ROLE_TOKEN.schoolTeacher, DIRECTORY_ROLE_TOKEN.instructorRevoked],
] as const

const ALL_TAB_DIRECTORY_ROLE_ALLOWLISTS: Record<
  Exclude<AllTabRoleFilterValue, 'ADMIN'>,
  readonly (readonly string[])[]
> = {
  INDIVIDUAL: [[DIRECTORY_ROLE_TOKEN.individual]],
  SCHOOL_TEACHER: [[DIRECTORY_ROLE_TOKEN.schoolTeacher]],
  // 「강사」 — 겸직·권한 종료 포함
  INSTRUCTOR: [
    [DIRECTORY_ROLE_TOKEN.instructor],
    ...DIRECTORY_INSTRUCTOR_DUAL_SETS,
    ...DIRECTORY_INSTRUCTOR_REVOKED_SETS,
  ],
  INSTRUCTOR_DUAL: DIRECTORY_INSTRUCTOR_DUAL_SETS,
  INSTRUCTOR_REVOKED: DIRECTORY_INSTRUCTOR_REVOKED_SETS,
}

/** 전체 회원 목록 — 디렉터리 API용 exact-set (listMembers `general` 토큰과 다름) */
export function rolesExactAnyOfForDirectoryRoleFilter(
  roleFilter: string | undefined
): string | undefined {
  const key = parseAllTabRoleFilterParam(roleFilter)
  if (key === 'ALL' || key === 'ADMIN') return undefined
  return encodeRolesExactAnyOf(ALL_TAB_DIRECTORY_ROLE_ALLOWLISTS[key])
}

export function accountTypeForDirectoryRoleFilter(
  roleFilter: string | undefined
): 'MEMBER' | 'ADMIN_ACCOUNT' | undefined {
  const key = parseAllTabRoleFilterParam(roleFilter)
  if (key === 'ALL') return undefined
  if (key === 'ADMIN') return 'ADMIN_ACCOUNT'
  return 'MEMBER'
}

/** 단일 유형 — 디렉터리 `role` 쿼리 (강사·겸직·박탈은 exact-set만 사용) */
export function directoryRoleQueryForFilter(roleFilter: string | undefined): string | undefined {
  const key = parseAllTabRoleFilterParam(roleFilter)
  if (key === 'INDIVIDUAL') return DIRECTORY_ROLE_TOKEN.individual
  if (key === 'SCHOOL_TEACHER') return DIRECTORY_ROLE_TOKEN.schoolTeacher
  return undefined
}

export function encodeRolesExactAnyOf(sets: readonly (readonly string[])[]): string {
  return sets
    .map(set =>
      [...set]
        .map(t => t.trim())
        .filter(Boolean)
        .sort()
        .join('+')
    )
    .filter(Boolean)
    .join(',')
}

export function instructorListRolesExactAnyOf(): string {
  return encodeRolesExactAnyOf(INSTRUCTOR_LIST_ROLES_EXACT_ANY_OF)
}

/** 전체 회원 유형 필터 value → rolesExactAnyOf (학교 조직 옵션 없음) */
export function rolesExactAnyOfForAllTabRoleFilter(
  roleFilter: string | undefined
): string | undefined {
  if (!roleFilter?.trim()) return undefined
  const key = parseAllTabRoleFilterParam(roleFilter)
  if (key === 'ALL') return undefined
  return encodeRolesExactAnyOf(ALL_TAB_ROLE_ALLOWLISTS[key])
}
