import type { InstructorMemberProfile, User } from '@/types/user'

/**
 * CMS 회원 상세 UI 분기 — INSTRUCTOR 전용.
 * API `instructorMemberProfile`가 오면 우선, 없으면 `affiliatedSchoolUserId`로 겸직 추론.
 */
export function resolveInstructorMemberProfile(
  user: Pick<User, 'role' | 'instructorMemberProfile' | 'affiliatedSchoolUserId'>
): InstructorMemberProfile | null {
  if (user.role !== 'INSTRUCTOR') return null
  if (user.instructorMemberProfile) return user.instructorMemberProfile
  if (user.affiliatedSchoolUserId) return 'instructor_dual'
  return 'instructor_only'
}

export function isInstructorSchoolTeacherProfile(user: Pick<User, 'role' | 'instructorMemberProfile' | 'affiliatedSchoolUserId'>): boolean {
  return resolveInstructorMemberProfile(user) === 'school_teacher'
}

export function isInstructorDualProfile(user: Pick<User, 'role' | 'instructorMemberProfile' | 'affiliatedSchoolUserId'>): boolean {
  return resolveInstructorMemberProfile(user) === 'instructor_dual'
}

export function isInstructorOnlyProfile(user: Pick<User, 'role' | 'instructorMemberProfile' | 'affiliatedSchoolUserId'>): boolean {
  return resolveInstructorMemberProfile(user) === 'instructor_only'
}
