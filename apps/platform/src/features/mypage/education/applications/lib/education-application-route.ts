import type { ProgramApplicationType } from '../api/types'

const EDUCATION_APPLICATION_TYPES = new Set<ProgramApplicationType>(['INDIVIDUAL', 'ORGANIZATION'])

/** `/mypage/education/:applicationType/:applicationId` 라우트 segment */
export function readEducationApplicationTypeFromRoute(
  value: string | undefined,
): ProgramApplicationType | null {
  if (value && EDUCATION_APPLICATION_TYPES.has(value as ProgramApplicationType)) {
    return value as ProgramApplicationType
  }
  return null
}
