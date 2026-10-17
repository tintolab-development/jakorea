import type { ProgramDetail, ProgramDetailCase } from '@/features/program'
import type { ProgramApplicationType } from '../api/types'
import {
  isOrganizationEducationApplication,
  resolveTeacherApplicationProgramGroup,
} from './organization-education-application'
import type { EducationTeacherApplicationContent } from '../model/types'
import { mapTeacherInstitutionFromApplicationAnswers } from './institution-basic-info-from-answers'
import {
  mapInstitutionGuidanceFromApplicationAnswers,
  teacherGuidanceContentFromFormState,
} from './institution-guidance-from-answers'
import { resolveTeacherPreferredSchedules } from './teacher-preferred-schedules'

const EMPTY_INSTITUTION: EducationTeacherApplicationContent['institution'] = {
  name: '',
  grade: '',
  address: '',
  addressDetail: '',
  classAndHeadcount: '',
  teacherContact: '',
  reason: '',
  otherRequests: '',
}

const EMPTY_GUIDANCE: EducationTeacherApplicationContent['guidance'] = {
  computerInRoom: '',
  waitingPlace: '',
  meal: '',
  otherNotes: '',
}

export type BuildTeacherApplicationContentInput = {
  applicationType?: ProgramApplicationType
  programAudience?: ProgramDetail['programAudience']
  detailCase: ProgramDetailCase
  programGroup?: string
  answers?: Record<string, unknown> | null
  preferredScheduleBlocks?: readonly unknown[] | null
  preferredScheduleOptionValues?: readonly string[]
  preferredEducationScheduleLabel?: string
  existing?: EducationTeacherApplicationContent
}

export function buildTeacherApplicationContentFromPortal(
  input: BuildTeacherApplicationContentInput,
  program?: Pick<
    ProgramDetail,
    'educationScheduleLines' | 'eventSchedules' | 'programAudience' | 'programType' | 'registrationKind'
  >,
): EducationTeacherApplicationContent | undefined {
  const programForAudience =
    program ??
    (input.programAudience
      ? { programAudience: input.programAudience, programType: undefined, registrationKind: undefined }
      : undefined)

  const isOrganization = isOrganizationEducationApplication(
    { applicationType: input.applicationType },
    programForAudience,
  )
  if (!isOrganization) return input.existing

  const answers = input.answers ?? {}
  const hasAnswers = Object.keys(answers).length > 0
  const programGroup = resolveTeacherApplicationProgramGroup(programForAudience, input.programGroup)

  const institutionFromAnswers = hasAnswers
    ? mapTeacherInstitutionFromApplicationAnswers(answers, input.detailCase, programGroup)
    : null
  const guidanceForm = hasAnswers
    ? mapInstitutionGuidanceFromApplicationAnswers(answers, input.detailCase)
    : null

  const preferredSchedules = resolveTeacherPreferredSchedules({
    preferredSchedules: input.existing?.preferredSchedules,
    answers: hasAnswers ? answers : undefined,
    preferredScheduleOptionValues: input.preferredScheduleOptionValues,
    preferredEducationScheduleLabel: input.preferredEducationScheduleLabel,
    preferredScheduleBlocks: input.preferredScheduleBlocks,
    program,
  })

  return {
    institution: institutionFromAnswers ?? input.existing?.institution ?? EMPTY_INSTITUTION,
    guidance: guidanceForm
      ? teacherGuidanceContentFromFormState(guidanceForm)
      : (input.existing?.guidance ?? EMPTY_GUIDANCE),
    preferredSchedules,
  }
}
