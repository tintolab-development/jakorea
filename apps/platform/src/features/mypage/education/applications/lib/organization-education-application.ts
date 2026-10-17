import type { ProgramDetail } from '@/features/program'
import type { ProgramApplicationType } from '../api/types'
import type { EducationApplicationListItem } from '../model/types'

export function isTrainedTeachersEducationProgram(
  program: Pick<ProgramDetail, 'programType' | 'registrationKind'> | null | undefined,
): boolean {
  if (!program) return false
  if (program.registrationKind === 'trainedTeachers') return true
  return (program.programType ?? '').trim().toUpperCase() === 'TRAINED_TEACHER'
}

/** Portal 상세 `programGroup` 없을 때 answers 단락 키 해석용 */
export function resolveTeacherApplicationProgramGroup(
  program: Pick<ProgramDetail, 'programType' | 'registrationKind'> | null | undefined,
  programGroupFromApi?: string | null,
): string | undefined {
  const fromApi = programGroupFromApi?.trim()
  if (fromApi) return fromApi
  if (isTrainedTeachersEducationProgram(program)) return 'TRAINED_TEACHER'
  return undefined
}

export function isOrganizationEducationApplication(
  application:
    | Pick<Partial<EducationApplicationListItem>, 'applicationType' | 'categoryLabel'>
    | null
    | undefined,
  program:
    | Pick<ProgramDetail, 'programAudience' | 'programType' | 'registrationKind'>
    | null
    | undefined,
): boolean {
  if (application?.applicationType === 'ORGANIZATION') return true
  if (program?.programAudience === 'organization') return true
  if (application?.categoryLabel === '교육받은 교사') return true
  return isTrainedTeachersEducationProgram(program)
}

/** 신청 API type 누락·불일치 시 프로그램 audience·유형으로 기관 신청 콘텐츠 빌드 */
export function resolveOrganizationApplicationTypeForContent(
  applicationType: ProgramApplicationType | undefined,
  program:
    | Pick<ProgramDetail, 'programAudience' | 'programType' | 'registrationKind'>
    | undefined,
): ProgramApplicationType {
  if (applicationType === 'ORGANIZATION') return 'ORGANIZATION'
  if (program?.programAudience === 'organization') return 'ORGANIZATION'
  if (isTrainedTeachersEducationProgram(program)) return 'ORGANIZATION'
  return applicationType ?? 'INDIVIDUAL'
}
