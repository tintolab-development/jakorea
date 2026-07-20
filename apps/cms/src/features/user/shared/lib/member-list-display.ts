import type { User } from '@/types/user'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import { shouldShowCmsMemberInfoEditButton } from '@/features/user/shared/lib/admin-provisioned-member-policy'

const MEMBER_LIST_ROLE_LABELS = {
  INDIVIDUAL: '개인',
  SCHOOL: '학교(교사)',
  INSTRUCTOR: '강사',
  ADMIN: '관리자',
} as const

/** 전체 회원 목록 — 회원 유형 열 */
export function getAllMemberListRoleTypeLabel(
  record: Pick<User, 'role' | 'instructorMemberProfile' | 'affiliatedSchoolUserId'>
): string {
  if (record.role === 'INSTRUCTOR') {
    const profile = resolveInstructorMemberProfile(record)
    if (profile === 'instructor_dual') {
      return `${MEMBER_LIST_ROLE_LABELS.SCHOOL}, ${MEMBER_LIST_ROLE_LABELS.INSTRUCTOR}`
    }
    if (profile === 'school_teacher') {
      return MEMBER_LIST_ROLE_LABELS.SCHOOL
    }
    return MEMBER_LIST_ROLE_LABELS.INSTRUCTOR
  }

  return MEMBER_LIST_ROLE_LABELS[record.role] ?? '-'
}

/** 전체 회원 목록 — 가입 유형 열 (직접 가입 / 관리자 등록) */
export function getMemberSignupTypeLabel(
  user: Pick<User, 'registeredByAdmin' | 'identitySelfSignupCompletedAfterAdminRegistration'>
): '직접 가입' | '관리자 등록' {
  return shouldShowCmsMemberInfoEditButton(user) ? '관리자 등록' : '직접 가입'
}
