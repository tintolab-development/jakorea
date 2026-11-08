import type { ProgramApplicationType } from '../../applications/api/types'

export function isTrainedTeacherOrganizationSchedule(
  applicationType: ProgramApplicationType | null | undefined,
  programType: string | null | undefined,
): boolean {
  return (
    applicationType === 'ORGANIZATION' &&
    (programType ?? '').trim().toUpperCase() === 'TRAINED_TEACHER'
  )
}
