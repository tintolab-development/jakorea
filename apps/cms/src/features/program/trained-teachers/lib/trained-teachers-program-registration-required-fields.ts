/**
 * 교육받은 교사 등록 1단계 필수 검사.
 * 일반 검사와 동일 규칙이되 KPI·임금은 없고, 교육 연수는 첫 차시/회차·세부 일정(replaceFirst).
 */
import { normalizeRegistrationOverlayForApply } from '@/features/program/general/lib/registration-overlay-to-program'
import { projectTrainedTeachersRhfToOverlayRecord } from './registration-rhf-values'
import type { TrainedTeachersRegistrationRhfValues } from './registration-rhf-values'
import {
  describeIncompleteGeneralProgramRegistrationRequiredFields,
  formatGeneralProgramRegistrationRequiredFieldReason,
  hasCurriculumMultiDateScheduleCountMismatch,
  listIncompleteGeneralProgramRegistrationRequiredFields,
} from '@/features/program/general/lib/registration-required-fields'
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

function toGeneralRequiredFieldContext(ctx: TrainedTeachersRegistrationRequiredFieldContext) {
  return {
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
    preEducationDisplayMode: 'replaceFirst' as const,
  }
}

/** 교육받은 교사 등록 — 비어 있는 필수 항목 진단 키 */
export function listIncompleteTrainedTeachersProgramRegistrationRequiredFieldReasons(
  overlay: Record<string, unknown>,
  ctx: TrainedTeachersRegistrationRequiredFieldContext
): string[] {
  const normalized = normalizeRegistrationOverlayForApply(overlay, 'trainedTeachers')
  return listIncompleteGeneralProgramRegistrationRequiredFields(
    normalized,
    toGeneralRequiredFieldContext(ctx)
  )
}

/** 교육받은 교사 등록 — 비어 있는 필수 항목의 화면 라벨 */
export function listIncompleteTrainedTeachersProgramRegistrationRequiredFieldLabels(
  overlay: Record<string, unknown>,
  ctx: TrainedTeachersRegistrationRequiredFieldContext
): string[] {
  return listIncompleteTrainedTeachersProgramRegistrationRequiredFieldReasons(overlay, ctx).map(
    formatGeneralProgramRegistrationRequiredFieldReason
  )
}

export function describeIncompleteTrainedTeachersProgramRegistrationRequiredFields(
  overlay: Record<string, unknown>,
  ctx: TrainedTeachersRegistrationRequiredFieldContext
): string | null {
  const normalized = normalizeRegistrationOverlayForApply(overlay, 'trainedTeachers')
  return describeIncompleteGeneralProgramRegistrationRequiredFields(
    normalized,
    toGeneralRequiredFieldContext(ctx)
  )
}

export function hasIncompleteTrainedTeachersProgramRegistrationRequiredFields(
  overlay: Record<string, unknown>,
  ctx: TrainedTeachersRegistrationRequiredFieldContext
): boolean {
  return describeIncompleteTrainedTeachersProgramRegistrationRequiredFields(overlay, ctx) != null
}

function requiredFieldContextFromRhf(
  values: TrainedTeachersRegistrationRhfValues
): TrainedTeachersRegistrationRequiredFieldContext {
  return {
    participant: values.participant,
    programType: values.educationStructure,
    sessionRoundType: values.sessionRound,
    educationFormScheduleDetail: values.educationFormScheduleDetail,
    participationScheduleDetail: values.participationScheduleDetail,
    ipsScheduleDetail: values.ipsScheduleDetail,
    curriculumSessionCount: values.curriculumSessionCount,
    curriculumChartSessionCount: values.curriculumChartSessionCount,
    scheduleCurriculumDetailCount: values.scheduleCurriculumDetailCount,
    scheduleCurriculumGroupCount: values.scheduleCurriculumGroupCount,
    teacherTrainingEnabled: values.teacherTrainingEnabled,
    educationScheduleMode: values.educationScheduleMode,
    sponsorId: values.sponsorManagementIds[0] ?? '',
    sponsorContactId: values.sponsorManagerContactIds[0] ?? '',
    programTitleKo: values.title,
  }
}

/** 정상 신규 등록 필수검사 — Overlay store가 아니라 RHF projection. */
export function listIncompleteTrainedTeachersRegistrationRhfRequiredFieldReasons(
  values: TrainedTeachersRegistrationRhfValues
): string[] {
  return listIncompleteTrainedTeachersProgramRegistrationRequiredFieldReasons(
    projectTrainedTeachersRhfToOverlayRecord(values),
    requiredFieldContextFromRhf(values)
  )
}

export function describeIncompleteTrainedTeachersRegistrationRhfRequiredFields(
  values: TrainedTeachersRegistrationRhfValues
): string | null {
  return describeIncompleteTrainedTeachersProgramRegistrationRequiredFields(
    projectTrainedTeachersRhfToOverlayRecord(values),
    requiredFieldContextFromRhf(values)
  )
}

export function hasIncompleteTrainedTeachersRegistrationRhfRequiredFields(
  values: TrainedTeachersRegistrationRhfValues
): boolean {
  return describeIncompleteTrainedTeachersRegistrationRhfRequiredFields(values) != null
}

export function hasTrainedTeachersRegistrationRhfCurriculumScheduleCountMismatch(
  values: TrainedTeachersRegistrationRhfValues
): boolean {
  return hasCurriculumMultiDateScheduleCountMismatch(
    projectTrainedTeachersRhfToOverlayRecord(values),
    toGeneralRequiredFieldContext(requiredFieldContextFromRhf(values))
  )
}
