import type { EmploymentStatus } from '../../model/sign-up.types'

export function isTeacherProfileValid(
  affiliation: string,
  employmentStatus: EmploymentStatus | null,
  options?: {
    requireSchoolOrganizationId?: boolean
    schoolOrganizationId?: number | null
  },
) {
  if (affiliation.trim().length === 0 || employmentStatus === null) {
    return false
  }
  if (options?.requireSchoolOrganizationId && options.schoolOrganizationId == null) {
    return false
  }
  return true
}
