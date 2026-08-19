import type { User } from '@/types/user'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import { isInstructorPermissionRevokedOverlay } from '@/features/user/shared/lib/revoked-instructor-overlay'

const MEMBER_LIST_ROLE_LABELS = {
  INDIVIDUAL: '개인',
  SCHOOL: '학교(교사)',
  INSTRUCTOR: '강사',
  ADMIN: '관리자',
} as const

export const REVOKED_INSTRUCTOR_ROLE_TYPE_LABEL = '강사(권한박탈)'
export const DUAL_MEMBER_ROLE_TYPE_LABEL = `${MEMBER_LIST_ROLE_LABELS.SCHOOL}, ${MEMBER_LIST_ROLE_LABELS.INSTRUCTOR}`
export const DUAL_REVOKED_MEMBER_ROLE_TYPE_LABEL = `${MEMBER_LIST_ROLE_LABELS.SCHOOL}, ${REVOKED_INSTRUCTOR_ROLE_TYPE_LABEL}`

export const ALL_MEMBER_LIST_ROLE_TYPE_LABELS = {
  INDIVIDUAL: MEMBER_LIST_ROLE_LABELS.INDIVIDUAL,
  SCHOOL_TEACHER: MEMBER_LIST_ROLE_LABELS.SCHOOL,
  INSTRUCTOR: MEMBER_LIST_ROLE_LABELS.INSTRUCTOR,
  INSTRUCTOR_DUAL: DUAL_MEMBER_ROLE_TYPE_LABEL,
  INSTRUCTOR_REVOKED: REVOKED_INSTRUCTOR_ROLE_TYPE_LABEL,
  ADMIN: MEMBER_LIST_ROLE_LABELS.ADMIN,
} as const

/** 강사 권한 박탈 여부 — 목록·상세 회원 유형 표시용 */
export function isInstructorPermissionRevoked(
  record: Pick<User, 'instructorApprovalStatus'> & Partial<Pick<User, 'id' | 'memberId'>>
): boolean {
  if (record.instructorApprovalStatus?.trim().toUpperCase() === 'REVOKED') return true
  return isInstructorPermissionRevokedOverlay(record)
}

function resolveListInstructorProfile(
  record: Parameters<typeof getAllMemberListRoleTypeLabel>[0]
) {
  return record.role === 'INSTRUCTOR'
    ? resolveInstructorMemberProfile(record)
    : record.instructorMemberProfile
}

/** 전체 회원 목록 — 회원 유형 열 */
export function getAllMemberListRoleTypeLabel(
  record: Pick<User, 'role'> &
    Partial<
      Pick<
        User,
        | 'instructorMemberProfile'
        | 'affiliatedSchoolUserId'
        | 'instructorApprovalStatus'
        | 'id'
        | 'memberId'
        | 'roles'
      >
    >
): string {
  const profile = resolveListInstructorProfile(record)
  if (isInstructorPermissionRevoked(record)) {
    if (profile === 'instructor_dual') return DUAL_REVOKED_MEMBER_ROLE_TYPE_LABEL
    return REVOKED_INSTRUCTOR_ROLE_TYPE_LABEL
  }

  if (profile === 'instructor_dual') {
    return DUAL_MEMBER_ROLE_TYPE_LABEL
  }
  if (profile === 'school_teacher') {
    return MEMBER_LIST_ROLE_LABELS.SCHOOL
  }

  return MEMBER_LIST_ROLE_LABELS[record.role] ?? '-'
}

type AllTabRoleFilterRecord = Parameters<typeof getAllMemberListRoleTypeLabel>[0]

/** 전체 회원 유형 필터 — 목록 유형 열과 동일 기준 */
export function matchesAllTabRoleFilter(
  record: AllTabRoleFilterRecord,
  filter: keyof typeof ALL_MEMBER_LIST_ROLE_TYPE_LABELS | 'ALL'
): boolean {
  if (filter === 'ALL') return true
  if (filter === 'INSTRUCTOR_REVOKED') {
    if (!isInstructorPermissionRevoked(record)) return false
    const profile = resolveListInstructorProfile(record)
    return profile === 'instructor_only' || profile === 'instructor_dual' || profile == null
  }
  if (filter === 'INSTRUCTOR_DUAL') {
    return (
      !isInstructorPermissionRevoked(record) &&
      getAllMemberListRoleTypeLabel(record) === ALL_MEMBER_LIST_ROLE_TYPE_LABELS.INSTRUCTOR_DUAL
    )
  }
  return getAllMemberListRoleTypeLabel(record) === ALL_MEMBER_LIST_ROLE_TYPE_LABELS[filter]
}

/** 전체 회원 목록 — 가입 유형 열. API `createdByAdmin`(동치 `registeredByAdmin`) 기준 */
export function getMemberSignupTypeLabel(
  user: Pick<User, 'registeredByAdmin'>
): '직접 가입' | '관리자 등록' {
  return user.registeredByAdmin ? '관리자 등록' : '직접 가입'
}
