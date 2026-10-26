/**
 * 일반 등록 위저드 — RHF UI 값 필수 검사.
 * 상세 Zod를 복사하지 않는다. 등록 overlay 정책(기본값 fallback, 보이는 회차만)과 동일 키를 낸다.
 */
import { z } from 'zod'
import { isDetailedProgramMasterId } from '@/features/program/general/lib/detailed-program-request-id'
import { isEducationScheduleProgressLineMissingOrWithoutClock } from '@/features/template/lib/education-schedule-line-clock-required'
import { educationScheduleLineSerializationIssue } from '@/features/template/lib/format-education-schedule-line'
import {
  DEFAULT_REGISTRATION_EDUCATION_FORM,
  DEFAULT_REGISTRATION_PARTICIPATION,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import {
  curriculumMultiDateScheduleSlotCount,
  listIncompleteGeneralProgramRegistrationRequiredFields,
  type GeneralProgramRegistrationRequiredFieldContext,
} from '@/features/program/general/lib/registration-required-fields'
import type { RegistrationWizardUiValues } from './registration-wizard-ui-values'
import { COMMON_INFO_PERSIST_KEYS as K } from './common-info-persist-keys'
import {
  REGISTRATION_WIZARD_PERIOD_DATE_ISO_KEY,
  REGISTRATION_WIZARD_SINGLE_DATE_ISO_KEY,
} from './registration-wizard-overlay-path-map'

function isEmptyText(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === ''
}

function isEmptyNumber(value: unknown): boolean {
  return typeof value !== 'number' || !Number.isFinite(value)
}

function isIpsIncomplete(value: unknown): boolean {
  if (value == null || typeof value !== 'object') return true
  return isEmptyText((value as { category?: unknown }).category)
}

function isAssignmentIncomplete(value: unknown): boolean {
  if (value == null || typeof value !== 'object') return false
  const row = value as { enabled?: unknown; period?: unknown }
  if (row.enabled !== true) return false
  return isEmptyText(row.period)
}

function isGroupTimeIncomplete(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return true
  return value.some(slot => {
    if (slot == null || typeof slot !== 'object') return true
    const row = slot as { startTime?: unknown; endTime?: unknown }
    return isEmptyText(row.startTime) || isEmptyText(row.endTime)
  })
}

function hasAudience(ctx: GeneralProgramRegistrationRequiredFieldContext): boolean {
  const participant = ctx.participant
  return (
    participant.individual ||
    participant.organization ||
    participant.teacherInstructor ||
    participant.volunteer
  )
}

function resolveCommonEducationForm(values: RegistrationWizardUiValues): string {
  return (
    values.multiCommonEducationForm.trim() ||
    values.singleEducationForm.trim() ||
    DEFAULT_REGISTRATION_EDUCATION_FORM
  )
}

function resolveCommonParticipation(values: RegistrationWizardUiValues): string {
  return (
    values.multiCommonParticipation.trim() ||
    values.singleParticipation.trim() ||
    DEFAULT_REGISTRATION_PARTICIPATION
  )
}

function pushReason(reasons: string[], incomplete: boolean, reason: string) {
  if (incomplete) reasons.push(reason)
}

function extrasCtx(
  values: RegistrationWizardUiValues,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): GeneralProgramRegistrationRequiredFieldContext {
  return {
    ...ctx,
    programType: ctx.programType,
    sessionRoundType: ctx.sessionRoundType,
    sponsorId: ctx.sponsorId || values.sponsorId,
    sponsorContactId: ctx.sponsorContactId || values.managerContactId,
    programTitleKo: ctx.programTitleKo || values.programTitleKo,
  }
}

export function listIncompleteRegistrationWizardRequiredFields(
  values: RegistrationWizardUiValues,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): string[] {
  const resolved = extrasCtx(values, ctx)
  const reasons: string[] = []
  pushReason(reasons, isEmptyText(resolved.programTitleKo), 'basicInfo.programTitleKo')
  pushReason(reasons, isEmptyText(values.programTitleEn), 'basicInfo.programTitleEn')
  pushReason(reasons, isEmptyText(values.publicProgramTitle), 'basicInfo.publicProgramTitle')
  if (resolved.programType !== 'schedule') {
    pushReason(
      reasons,
      !isDetailedProgramMasterId(values.detailedProgramId),
      'basicInfo.detailedProgram'
    )
  }
  const range = values.operationRangeSeal
  if (range == null || isEmptyText(range.start) || isEmptyText(range.end)) {
    reasons.push('basicInfo.operationRangeSeal')
  }
  pushReason(reasons, !hasAudience(resolved), 'basicInfo.audience')
  pushReason(reasons, isEmptyText(values.businessField), 'basicInfo.businessField')
  if (!resolved.allowEmptySponsor) {
    pushReason(reasons, isEmptyText(resolved.sponsorId), 'basicInfo.sponsorId')
    pushReason(reasons, isEmptyText(resolved.sponsorContactId), 'basicInfo.sponsorContactId')
  }
  pushReason(
    reasons,
    values.educationVenueKind === 'other' && isEmptyText(values.educationVenueDetail),
    'basicInfo.educationVenueDetail'
  )
  pushReason(reasons, isEmptyText(values.educationCourse), 'basicInfo.educationCourse')
  pushReason(reasons, isEmptyText(values.ipOwned), 'basicInfo.ipOwned')
  pushReason(reasons, isEmptyText(values.courseDeliveredBy), 'basicInfo.courseDeliveredBy')

  if (!resolved.omitKpiAndWage) {
    pushReason(reasons, isEmptyNumber(values.kpiParticipantCount), 'kpi.participantCount')
    pushReason(
      reasons,
      resolved.participant.teacherInstructor && isEmptyNumber(values.kpiInstructor),
      'kpi.instructor'
    )
    pushReason(
      reasons,
      resolved.participant.volunteer && isEmptyNumber(values.kpiVolunteer),
      'kpi.volunteer'
    )
    pushReason(reasons, isEmptyNumber(values.wageGrade1Fee), 'wage.grade1Fee')
    pushReason(reasons, isEmptyNumber(values.wageGrade2Fee), 'wage.grade2Fee')
    pushReason(reasons, isEmptyNumber(values.wageGrade3Fee), 'wage.grade3Fee')
    pushReason(
      reasons,
      !Array.isArray(values.paymentItemValues) || values.paymentItemValues.length === 0,
      'wage.paymentItemValues'
    )
  }

  const showParticipation = !resolved.participant.organization
  if (resolved.sessionRoundType === 'multi') {
    pushReason(
      reasons,
      resolved.educationFormScheduleDetail === 'common' &&
        isEmptyText(resolveCommonEducationForm(values)),
      'typeSettings.multiCommonEducationForm'
    )
    pushReason(
      reasons,
      showParticipation &&
        resolved.participationScheduleDetail === 'common' &&
        isEmptyText(resolveCommonParticipation(values)),
      'typeSettings.multiCommonParticipation'
    )
  }
  pushReason(
    reasons,
    resolved.ipsScheduleDetail === 'common' && isIpsIncomplete(values.ipsType),
    'typeSettings.ipsType'
  )

  if (resolved.programType === 'curriculum') {
    const chartCount = Math.max(1, resolved.curriculumChartSessionCount)
    const { curriculum } = values
    if (resolved.sessionRoundType === 'single') {
      for (let index = 1; index <= chartCount; index += 1) {
        pushReason(reasons, isEmptyText(curriculum.unitNameBySession[index]), `curriculum.unitName[${index}]`)
        pushReason(
          reasons,
          isEmptyText(curriculum.unitContentBySession[index]),
          `curriculum.unitContent[${index}]`
        )
        pushReason(
          reasons,
          resolved.ipsScheduleDetail === 'perSchedule' &&
            isIpsIncomplete(curriculum.ipsBySession[index]),
          `curriculum.ips[${index}]`
        )
      }
    } else {
      const roundCount = Math.max(1, resolved.curriculumSessionCount)
      for (let index = 1; index <= roundCount; index += 1) {
        pushReason(
          reasons,
          isEmptyText(curriculum.progressSessionByRound[index]),
          `curriculum.progressSession[${index}]`
        )
        pushReason(
          reasons,
          isEmptyText(curriculum.roundContentByRound[index]),
          `curriculum.roundContent[${index}]`
        )
        pushReason(
          reasons,
          resolved.ipsScheduleDetail === 'perSchedule' &&
            isIpsIncomplete(curriculum.ipsBySession[index]),
          `curriculum.ips[${index}]`
        )
        pushReason(
          reasons,
          !resolved.participant.organization &&
            isAssignmentIncomplete(curriculum.assignmentByRound[index]),
          `curriculum.assignment[${index}]`
        )
      }
    }
    if (resolved.scheduleCurriculumPreEducation) {
      pushReason(
        reasons,
        isEmptyText(curriculum.preEducationScheduleName),
        'curriculum.preEducationScheduleName'
      )
      pushReason(
        reasons,
        isEducationScheduleProgressLineMissingOrWithoutClock(curriculum.preEducationScheduleLine),
        'curriculum.preEducationScheduleLine'
      )
    }
  }

  if (resolved.programType === 'schedule') {
    const detailCount = Math.max(1, resolved.scheduleCurriculumDetailCount)
    const { schedule } = values
    const groupCount =
      resolved.sessionRoundType === 'multi' ? 1 : Math.max(1, resolved.scheduleCurriculumGroupCount)
    const replaceFirstTraining =
      resolved.scheduleCurriculumPreEducation && resolved.preEducationDisplayMode === 'replaceFirst'
    const useEventScheduleDate = resolved.sessionRoundType === 'multi'
    for (let index = 1; index <= detailCount; index += 1) {
      const skipFixedTrainingName = replaceFirstTraining && index === 1
      pushReason(
        reasons,
        !skipFixedTrainingName && isEmptyText(schedule.eventNameByDetail[index]),
        `scheduleCurriculum.eventName[${index}]`
      )
      if (useEventScheduleDate) {
        pushReason(
          reasons,
          isEducationScheduleProgressLineMissingOrWithoutClock(
            schedule.scheduleDateByDetailIso[index]
          ),
          `scheduleCurriculum.scheduleDate[${index}]`
        )
      } else {
        const slots = schedule.groupTimesByDetail[index]
        const groupTimesIncomplete =
          !Array.isArray(slots) ||
          slots.length < groupCount ||
          isGroupTimeIncomplete(slots.slice(0, groupCount))
        pushReason(reasons, groupTimesIncomplete, `scheduleCurriculum.groupTimes[${index}]`)
      }
      pushReason(
        reasons,
        resolved.ipsScheduleDetail === 'perSchedule' && isIpsIncomplete(schedule.ipsByDetailIndex[index]),
        `scheduleCurriculum.ips[${index}]`
      )
      pushReason(
        reasons,
        !resolved.participant.organization && isAssignmentIncomplete(schedule.assignmentByDetail[index]),
        `scheduleCurriculum.assignment[${index}]`
      )
    }
    if (resolved.scheduleCurriculumPreEducation && !replaceFirstTraining) {
      pushReason(
        reasons,
        isEmptyText(schedule.preEducationName),
        'scheduleCurriculum.preEducationName'
      )
      pushReason(
        reasons,
        isEducationScheduleProgressLineMissingOrWithoutClock(schedule.scheduleDateByDetailIso[0]),
        'scheduleCurriculum.preEducationScheduleDate'
      )
    }
  }

  const hideScheduleSettings =
    resolved.programType === 'schedule' && resolved.sessionRoundType === 'multi'
  if (!hideScheduleSettings) {
    const hasLine = values.scheduleLines.some(line => typeof line === 'string' && line.trim())
    if (!hasLine) {
      if (resolved.educationScheduleMode === 'period') {
        pushReason(reasons, isEmptyText(values.periodDateIso), 'educationScheduleSettings.periodDateIso')
      } else {
        pushReason(reasons, isEmptyText(values.singleDateIso), 'educationScheduleSettings.singleDateIso')
      }
    }
    const invalidScheduleLine = values.scheduleLines.some(
      line => typeof line === 'string' && educationScheduleLineSerializationIssue(line) != null
    )
    pushReason(reasons, invalidScheduleLine, 'educationScheduleSettings.scheduleLines')
  }

  return reasons
}

export function hasIncompleteRegistrationWizardRequiredFields(
  values: RegistrationWizardUiValues,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): boolean {
  return listIncompleteRegistrationWizardRequiredFields(values, ctx).length > 0
}

export function hasRegistrationWizardCurriculumScheduleCountMismatch(
  values: RegistrationWizardUiValues,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): boolean {
  if (ctx.programType !== 'curriculum') return false
  if (ctx.sessionRoundType !== 'multi') return false
  if (ctx.educationScheduleMode !== 'date') return false
  const lineCount = values.scheduleLines.filter(line => typeof line === 'string' && line.trim()).length
  if (lineCount === 0) return false
  return lineCount !== curriculumMultiDateScheduleSlotCount(ctx)
}

/** 테스트 비교용 — UI 값을 overlay KV로 투영한 뒤 기존 검사와 키를 대조한다. 제품 저장 경로는 쓰지 않는다. */
export function projectWizardUiValuesToOverlayForTest(
  values: RegistrationWizardUiValues
): Record<string, unknown> {
  const overlay: Record<string, unknown> = {
    [K.programTitleKo]: values.programTitleKo,
    [K.programTitleEn]: values.programTitleEn,
    [K.publicProgramTitle]: values.publicProgramTitle,
    [K.detailedProgramId]: values.detailedProgramId,
    [K.detailedProgramName]: values.detailedProgramName,
    [K.businessField]: values.businessField,
    [K.partnerInvolvement]: values.partnerInvolvement,
    [K.educationVenueKind]: values.educationVenueKind,
    [K.educationVenueDetail]: values.educationVenueDetail,
    [K.educationCourse]: values.educationCourse,
    [K.ipOwned]: values.ipOwned,
    [K.courseDeliveredBy]: values.courseDeliveredBy,
    [K.operationRangeSeal]: values.operationRangeSeal,
    [K.surveyItems]: values.surveyItems,
    [K.sponsorIds]: values.sponsorIds,
    [K.sponsorId]: values.sponsorId,
    [K.managerContactIds]: values.managerContactIds,
    [K.managerContactId]: values.managerContactId,
    [K.sponsorManagerLine]: values.sponsorManagerLine,
    [K.kpiParticipantCount]: values.kpiParticipantCount,
    [K.kpiInstructor]: values.kpiInstructor,
    [K.kpiVolunteer]: values.kpiVolunteer,
    [K.kpiDispatchedSchool]: values.kpiDispatchedSchool,
    [K.kpiDispatchedClass]: values.kpiDispatchedClass,
    [K.wageGrade1Fee]: values.wageGrade1Fee,
    [K.wageGrade2Fee]: values.wageGrade2Fee,
    [K.wageGrade3Fee]: values.wageGrade3Fee,
    [K.paymentItemValues]: values.paymentItemValues,
    [K.paymentItemLabels]: values.paymentItemLabels,
    [K.singleEducationForm]: values.singleEducationForm,
    [K.multiCommonEducationForm]: values.multiCommonEducationForm,
    [K.legacyEducationForm]: values.legacyEducationForm,
    [K.singleParticipation]: values.singleParticipation,
    [K.multiCommonParticipation]: values.multiCommonParticipation,
    [K.ipsType]: values.ipsType,
    [K.scheduleLines]: values.scheduleLines,
    [REGISTRATION_WIZARD_SINGLE_DATE_ISO_KEY]: values.singleDateIso,
    [REGISTRATION_WIZARD_PERIOD_DATE_ISO_KEY]: values.periodDateIso,
    [K.unitNameBySession]: values.curriculum.unitNameBySession,
    [K.unitContentBySession]: values.curriculum.unitContentBySession,
    [K.progressSessionByRound]: values.curriculum.progressSessionByRound,
    [K.roundContentByRound]: values.curriculum.roundContentByRound,
    [K.educationFormBySession]: values.curriculum.educationFormBySession,
    [K.participationBySession]: values.curriculum.participationBySession,
    [K.ipsBySession]: values.curriculum.ipsBySession,
    [K.assignmentByRound]: values.curriculum.assignmentByRound,
    [K.preEducationScheduleName]: values.curriculum.preEducationScheduleName,
    [K.preEducationScheduleLine]: values.curriculum.preEducationScheduleLine,
    [K.eventNameByDetail]: values.schedule.eventNameByDetail,
    [K.scheduleDateByDetailIso]: values.schedule.scheduleDateByDetailIso,
    [K.groupTimesByDetail]: values.schedule.groupTimesByDetail,
    [K.educationFormByDetail]: values.schedule.educationFormByDetail,
    [K.participationByDetail]: values.schedule.participationByDetail,
    [K.ipsByDetailIndex]: values.schedule.ipsByDetailIndex,
    [K.assignmentByDetail]: values.schedule.assignmentByDetail,
    [K.preEducationName]: values.schedule.preEducationName,
  }
  return overlay
}

export function compareWizardRequiredFieldsWithOverlayInspector(
  values: RegistrationWizardUiValues,
  ctx: GeneralProgramRegistrationRequiredFieldContext
): { rhf: string[]; overlay: string[] } {
  return {
    rhf: listIncompleteRegistrationWizardRequiredFields(values, ctx),
    overlay: listIncompleteGeneralProgramRegistrationRequiredFields(
      projectWizardUiValuesToOverlayForTest(values),
      ctx
    ),
  }
}

export const registrationWizardCommonInfoZodSchema = z.any().superRefine((values, issueCtx) => {
  if (values == null || typeof values !== 'object') {
    issueCtx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalid-wizard-values' })
    return
  }
  const ui = values as RegistrationWizardUiValues
  const extras = ui.extras
  if (extras == null) {
    issueCtx.addIssue({ code: z.ZodIssueCode.custom, message: 'missing-extras' })
    return
  }
  const keys = listIncompleteRegistrationWizardRequiredFields(ui, {
    participant: extras.participant,
    programType: extras.programType,
    sessionRoundType: extras.sessionRoundType,
    educationFormScheduleDetail: extras.educationFormScheduleDetail,
    participationScheduleDetail: extras.participationScheduleDetail,
    ipsScheduleDetail: extras.ipsScheduleDetail,
    curriculumSessionCount: extras.curriculumSessionCount,
    curriculumChartSessionCount: extras.curriculumChartSessionCount,
    scheduleCurriculumDetailCount: extras.scheduleCurriculumDetailCount,
    scheduleCurriculumGroupCount: extras.scheduleCurriculumGroupCount,
    scheduleCurriculumPreEducation: extras.scheduleCurriculumPreEducation,
    educationScheduleMode: extras.educationScheduleMode,
    sponsorId: ui.sponsorId,
    sponsorContactId: ui.managerContactId,
    programTitleKo: ui.programTitleKo,
  })
  for (const key of keys) {
    issueCtx.addIssue({ code: z.ZodIssueCode.custom, message: key, path: [key] })
  }
})
