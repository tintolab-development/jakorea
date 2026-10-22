import type { EmploymentStatus } from '../../model/sign-up.types'
import { hasValidSchoolReference } from './profile.logic'

export function isTeacherProfileValid(
  affiliation: string,
  employmentStatus: EmploymentStatus | null,
  options?: {
    requireSchoolOrganizationId?: boolean
    schoolOrganizationId?: number | null
    schoolNeisCode?: string | null
  },
) {
  if (affiliation.trim().length === 0 || employmentStatus === null) {
    return false
  }
  if (options?.requireSchoolOrganizationId && options.schoolOrganizationId == null) {
    return false
  }
  if (
    options &&
    !hasValidSchoolReference({
      schoolOrganizationId: options.schoolOrganizationId,
      schoolNeisCode: options.schoolNeisCode,
    })
  ) {
    return false
  }
  return true
}
