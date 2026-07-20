import type { EmploymentStatus } from '../model/sign-up.types'

export function isTeacherProfileValid(affiliation: string, employmentStatus: EmploymentStatus | null) {
  return affiliation.trim().length > 0 && employmentStatus !== null
}
