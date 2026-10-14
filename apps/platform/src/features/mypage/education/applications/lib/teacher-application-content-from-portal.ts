import type { ProgramDetail, ProgramDetailCase } from '@/features/program'
import type { ProgramApplicationType } from '../api/types'
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
  program?: Pick<ProgramDetail, 'educationScheduleLines' | 'eventSchedules'>,
): EducationTeacherApplicationContent | undefined {
  if (input.applicationType !== 'ORGANIZATION') return input.existing

  const answers = input.answers ?? {}
  const hasAnswers = Object.keys(answers).length > 0
  const hasScheduleMeta =
    Boolean(input.preferredScheduleOptionValues?.length) ||
    Boolean(input.preferredScheduleBlocks?.length) ||
    Boolean(input.preferredEducationScheduleLabel?.trim())

  if (!hasAnswers && !hasScheduleMeta && !input.existing) return undefined

  const institutionFromAnswers = hasAnswers
    ? mapTeacherInstitutionFromApplicationAnswers(answers, input.detailCase, input.programGroup)
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
