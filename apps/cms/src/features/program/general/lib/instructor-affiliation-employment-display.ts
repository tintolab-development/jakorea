import type { InstructorMemberProfile, SchoolTeacherEmploymentStatus } from '@/types/user'

export type InstructorAffiliationEmploymentFields = {
  affiliation?: string
  instructorMemberProfile?: InstructorMemberProfile
  affiliationEmploymentStatus?: SchoolTeacherEmploymentStatus
  affiliationIsCurrentlyEmployed?: boolean
}

/** 교사 겸직(instructor_dual) + 소속 있을 때만 재직 현황 태그 노출 */
export function shouldShowInstructorAffiliationEmploymentStatus(
  instructor: InstructorAffiliationEmploymentFields
): boolean {
  if (!instructor.affiliation?.trim()) return false
  return instructor.instructorMemberProfile === 'instructor_dual'
}

export function resolveInstructorAffiliationEmploymentStatus(
  instructor: InstructorAffiliationEmploymentFields
): SchoolTeacherEmploymentStatus | null {
  if (!shouldShowInstructorAffiliationEmploymentStatus(instructor)) return null
  if (instructor.affiliationEmploymentStatus) return instructor.affiliationEmploymentStatus
  if (instructor.affiliationIsCurrentlyEmployed) return 'ACTIVE'
  return null
}
