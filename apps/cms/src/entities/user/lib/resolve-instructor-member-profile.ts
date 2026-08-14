import type { InstructorMemberProfile, User } from '@/types/user'
import { inferInstructorMemberProfileFromRoles } from '@/features/user/api/map-member-role'

type InstructorProfileResolveUser = Pick<
  User,
  'role' | 'roles' | 'instructorMemberProfile'
>

/**
 * CMS 회원 상세 UI 분기 — INSTRUCTOR 전용.
 * SSOT는 서버 `roles[]`:
 * - `SCHOOL_TEACHER` 단독 → 교사
 * - `SCHOOL_TEACHER` + `INSTRUCTOR` → 교사 겸 강사
 * - `INSTRUCTOR` 단독 → 순수 강사
 * roles가 없으면(mock·URL) 저장된 `instructorMemberProfile`만 사용.
 */
export function resolveInstructorMemberProfile(
  user: InstructorProfileResolveUser
): InstructorMemberProfile | null {
  const fromRoles = inferInstructorMemberProfileFromRoles(user.roles)
  if (fromRoles) return fromRoles

  if (user.role !== 'INSTRUCTOR') return null
  return user.instructorMemberProfile ?? 'instructor_only'
}

export function isInstructorSchoolTeacherProfile(user: InstructorProfileResolveUser): boolean {
  return resolveInstructorMemberProfile(user) === 'school_teacher'
}

export function isInstructorDualProfile(user: InstructorProfileResolveUser): boolean {
  return resolveInstructorMemberProfile(user) === 'instructor_dual'
}

export function isInstructorOnlyProfile(user: InstructorProfileResolveUser): boolean {
  return resolveInstructorMemberProfile(user) === 'instructor_only'
}
