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

/** 강사 회원 목록 — 활성 강사 + 교사겸강사 (권한박탈 제외) */
export const INSTRUCTOR_LIST_ROLES_EXACT_ANY_OF = [
  [MEMBER_ROLE_TOKEN.general, MEMBER_ROLE_TOKEN.instructor],
  [MEMBER_ROLE_TOKEN.schoolTeacher, MEMBER_ROLE_TOKEN.instructor],
] as const

/** 전체 회원 — 유형 셀렉트 → exact set allowlist */
const ALL_TAB_ROLE_ALLOWLISTS: Record<string, readonly (readonly string[])[]> = {
  INDIVIDUAL: [[MEMBER_ROLE_TOKEN.general]],
  INSTRUCTOR: INSTRUCTOR_LIST_ROLES_EXACT_ANY_OF,
  ADMIN: [[MEMBER_ROLE_TOKEN.admin]],
  /** 교사 단독 (학교 조직이 아님) */
  SCHOOL_TEACHER: [[MEMBER_ROLE_TOKEN.schoolTeacher]],
  INSTRUCTOR_DUAL: [[MEMBER_ROLE_TOKEN.schoolTeacher, MEMBER_ROLE_TOKEN.instructor]],
  INSTRUCTOR_REVOKED: [
    [MEMBER_ROLE_TOKEN.general, MEMBER_ROLE_TOKEN.instructorRevoked],
    [MEMBER_ROLE_TOKEN.schoolTeacher, MEMBER_ROLE_TOKEN.instructorRevoked],
  ],
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
export function rolesExactAnyOfForAllTabRoleFilter(roleFilter: string | undefined): string | undefined {
  if (!roleFilter?.trim()) return undefined
  const key = roleFilter.trim().toUpperCase()
  if (key === 'ALL' || key === 'SCHOOL') return undefined
  const sets = ALL_TAB_ROLE_ALLOWLISTS[key]
  if (!sets) return undefined
  return encodeRolesExactAnyOf(sets)
}
