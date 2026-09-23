/**
 * 교육받은 교사 등록 1단계 필수 검사.
 * 일반 검사와 동일 규칙이되 KPI·임금은 없고, 일정형 교육 연수는 첫 세부 일정(replaceFirst).
 */
import { normalizeRegistrationOverlayForApply } from '@/features/program/general/lib/registration-overlay-to-program'
import { describeIncompleteGeneralProgramRegistrationRequiredFields } from '@/features/program/general/lib/registration-required-fields'
import type { ProgramRegistrationParticipantSelection } from '@/features/template/lib/program-registration-editor-state'
import type {
  ProgramRegistrationEducationScheduleMode,
  ProgramRegistrationScheduleDetailKind,
  ProgramRegistrationSessionRoundType,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'

export type TrainedTeachersRegistrationRequiredFieldContext = {
  participant: ProgramRegistrationParticipantSelection
  programType: ProgramRegistrationType
  sessionRoundType: ProgramRegistrationSessionRoundType
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
  curriculumSessionCount: number
  curriculumChartSessionCount: number
  scheduleCurriculumDetailCount: number
  scheduleCurriculumGroupCount: number
  teacherTrainingEnabled: boolean
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  sponsorId: string
  sponsorContactId: string
  programTitleKo: string
}

export function describeIncompleteTrainedTeachersProgramRegistrationRequiredFields(
  overlay: Record<string, unknown>,
  ctx: TrainedTeachersRegistrationRequiredFieldContext
): string | null {
  const normalized = normalizeRegistrationOverlayForApply(overlay, 'trainedTeachers')
  return describeIncompleteGeneralProgramRegistrationRequiredFields(normalized, {
    participant: ctx.participant,
    programType: ctx.programType,
    sessionRoundType: ctx.sessionRoundType,
    educationFormScheduleDetail: ctx.educationFormScheduleDetail,
    participationScheduleDetail: ctx.participationScheduleDetail,
    ipsScheduleDetail: ctx.ipsScheduleDetail,
    curriculumSessionCount: ctx.curriculumSessionCount,
    curriculumChartSessionCount: ctx.curriculumChartSessionCount,
    scheduleCurriculumDetailCount: ctx.scheduleCurriculumDetailCount,
    scheduleCurriculumGroupCount: ctx.scheduleCurriculumGroupCount,
    scheduleCurriculumPreEducation: ctx.teacherTrainingEnabled,
    educationScheduleMode: ctx.educationScheduleMode,
    sponsorId: ctx.sponsorId,
    sponsorContactId: ctx.sponsorContactId,
    programTitleKo: ctx.programTitleKo,
    omitKpiAndWage: true,
    allowEmptySponsor: true,
    preEducationDisplayMode: ctx.programType === 'schedule' ? 'replaceFirst' : 'prepend',
  })
}

export function hasIncompleteTrainedTeachersProgramRegistrationRequiredFields(
  overlay: Record<string, unknown>,
  ctx: TrainedTeachersRegistrationRequiredFieldContext
): boolean {
  return describeIncompleteTrainedTeachersProgramRegistrationRequiredFields(overlay, ctx) != null
}
