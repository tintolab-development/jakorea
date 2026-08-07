import type { InstructorMemberProfile, User } from '@/types/user'

type InstructorProfileResolveUser = Pick<
  User,
  | 'role'
  | 'instructorMemberProfile'
  | 'affiliatedSchoolUserId'
  | 'affiliatedSchoolName'
  | 'instructorCmsProfile'
  | 'listMetrics'
>

function inferInstructorMemberProfileFromListMetrics(
  listMetrics: User['listMetrics'] | undefined
): InstructorMemberProfile | undefined {
  const label =
    listMetrics?.permissionApplicationTypeLabel?.trim() ||
    listMetrics?.instructorTypeLabel?.trim()
  if (label === '교사 회원') return 'school_teacher'
  return undefined
}

/**
 * CMS 회원 상세 UI 분기 — INSTRUCTOR 전용.
 * API `instructorMemberProfile` → CMS profile `memberType` → 목록 유형 라벨 → `affiliatedSchoolUserId`(겸직) 순.
 */
export function resolveInstructorMemberProfile(
  user: InstructorProfileResolveUser
): InstructorMemberProfile | null {
  if (user.role !== 'INSTRUCTOR') return null
  if (user.instructorMemberProfile) return user.instructorMemberProfile

  if (user.affiliatedSchoolUserId?.trim()) return 'instructor_dual'

  const cmsProfile = user.instructorCmsProfile
  const organizationNames =
    cmsProfile?.affiliation?.organizationNames?.map(name => name.trim()).filter(Boolean) ?? []
  const schoolName =
    cmsProfile?.affiliation?.schoolName?.trim() || user.affiliatedSchoolName?.trim() || ''
  if (schoolName && organizationNames.length > 0) return 'instructor_dual'

  if (cmsProfile?.memberType === 'SCHOOL_TEACHER') return 'school_teacher'

  const fromListMetrics = inferInstructorMemberProfileFromListMetrics(user.listMetrics)
  if (fromListMetrics) return fromListMetrics

  return 'instructor_only'
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
