import type { ProgramDetail } from '@/features/program'
import type { ProgramApplicationType } from '../api/types'
import type { EducationApplicationListItem } from '../model/types'

const INSTITUTION_APPLICATION_ANSWER_KEY_MARKERS = [
  'program-application-institution-seed',
  'program-application-economy-seed',
  'ujat-program-application-institution-seed',
  'program-application-trained-teachers-seed',
  'gemini-vt-inst-seed',
] as const

export function isTrainedTeachersEducationProgram(
  program: Pick<ProgramDetail, 'programType' | 'registrationKind'> | null | undefined,
): boolean {
  if (!program) return false
  if (program.registrationKind === 'trainedTeachers') return true
  return (program.programType ?? '').trim().toUpperCase() === 'TRAINED_TEACHER'
}

/** 기관·학교 신청 양식 단락이 answers에 있으면 개인 신청 빈 상태로 떨어지지 않는다. */
export function hasInstitutionApplicationFormAnswers(
  answers: Record<string, unknown> | null | undefined,
): boolean {
  if (!answers) return false
  return Object.keys(answers).some(key =>
    INSTITUTION_APPLICATION_ANSWER_KEY_MARKERS.some(marker => key.includes(marker)),
  )
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
    | Pick<
        Partial<EducationApplicationListItem>,
        'applicationType' | 'categoryLabel' | 'applicationAnswers'
      >
    | null
    | undefined,
  program:
    | Pick<ProgramDetail, 'programAudience' | 'programType' | 'registrationKind'>
    | null
    | undefined,
): boolean {
  if (application?.applicationType === 'ORGANIZATION') return true
  if (program?.programAudience === 'organization') return true
  if (application?.categoryLabel === '교육받은 교사' || application?.categoryLabel === '기관') {
    return true
  }
  if (hasInstitutionApplicationFormAnswers(application?.applicationAnswers)) return true
  return isTrainedTeachersEducationProgram(program)
}

/** 신청 API type 누락·불일치 시 프로그램 audience·유형으로 기관 신청 콘텐츠 빌드 */
export function resolveOrganizationApplicationTypeForContent(
  applicationType: ProgramApplicationType | undefined,
  program:
    | Pick<ProgramDetail, 'programAudience' | 'programType' | 'registrationKind'>
    | undefined,
  applicationAnswers?: Record<string, unknown> | null,
): ProgramApplicationType {
  if (applicationType === 'ORGANIZATION') return 'ORGANIZATION'
  if (program?.programAudience === 'organization') return 'ORGANIZATION'
  if (isTrainedTeachersEducationProgram(program)) return 'ORGANIZATION'
  if (hasInstitutionApplicationFormAnswers(applicationAnswers)) return 'ORGANIZATION'
  return applicationType ?? 'INDIVIDUAL'
}
