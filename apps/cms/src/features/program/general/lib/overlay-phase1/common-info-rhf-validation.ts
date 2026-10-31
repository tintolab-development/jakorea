/**
 * 일반 프로그램 상세 공통정보 수정 — RHF Zod 검증.
 * 등록 위저드 Overlay `listIncomplete*` 와 분리한다.
 */
import type { ReactNode } from 'react'
import type { ZodIssue } from 'zod'
import {
  EDUCATION_SCHEDULE_CLOCK_REQUIRED_MESSAGE,
  EDUCATION_SCHEDULE_OPERATION_RANGE_ALERT_TITLE,
  EDUCATION_SCHEDULE_OUTSIDE_OPERATION_RANGE_MESSAGE,
  generalProgramCommonInfoEditSchema,
  type GeneralProgramCommonInfoEditFormValues,
} from '@/features/program/general/model/common-info-edit-schema'
import { EDUCATION_SCHEDULE_LINE_SERVER_FORMAT_MESSAGE } from '@/features/template/lib/format-education-schedule-line'
import {
  REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
} from '@/shared/constants/messages'
import {
  isPreEducationCurriculumSession,
  isPreEducationScheduleBlock,
  trimTrailingBlankRegularCurriculumSessions,
} from '@/features/program/general/lib/schedule-detail-form'

export type GeneralCommonInfoValidationAlertKind =
  | 'required-incomplete'
  | 'operation-range'
  | 'clock-required'

export type GeneralCommonInfoRhfValidationResult =
  | { ok: true }
  | {
      ok: false
      keys: readonly string[]
      message: string
      title?: string
      alertKind: GeneralCommonInfoValidationAlertKind
      issues: readonly ZodIssue[]
    }

function regularSessionNumber(
  sessions: GeneralProgramCommonInfoEditFormValues['curriculumSessions'],
  arrayIndex: number
): number | null {
  const session = sessions[arrayIndex]
  if (session == null || isPreEducationCurriculumSession(session)) return null
  let number = 0
  for (let i = 0; i <= arrayIndex; i += 1) {
    if (!isPreEducationCurriculumSession(sessions[i])) number += 1
  }
  return number > 0 ? number : null
}

function scheduleDetailNumber(
  details: GeneralProgramCommonInfoEditFormValues['scheduleDetails'],
  arrayIndex: number
): number | null {
  const row = details[arrayIndex]
  if (row == null || isPreEducationScheduleBlock(row)) return null
  let number = 0
  for (let i = 0; i <= arrayIndex; i += 1) {
    if (!isPreEducationScheduleBlock(details[i] ?? {})) number += 1
  }
  return number > 0 ? number : null
}

export const CURRICULUM_PRE_EDUCATION_NAME_VALIDATION_KEY =
  'curriculum.preEducationScheduleName' as const
export const CURRICULUM_PRE_EDUCATION_LINE_VALIDATION_KEY =
  'curriculum.preEducationScheduleLine' as const

/** 일반 상세 회차 수업 Field — Zod 키와 등록 위저드 복수 회차 키를 모두 받는다. */
export function curriculumRegularSessionContentValidationKeys(
  regularNumber: number
): readonly string[] {
  return [
    `curriculum.unitName[${regularNumber}]`,
    `curriculum.unitContent[${regularNumber}]`,
    `curriculum.progressSession[${regularNumber}]`,
    `curriculum.roundContent[${regularNumber}]`,
  ]
}

export function curriculumRegularSessionIpsValidationKey(regularNumber: number): string {
  return `curriculum.ips[${regularNumber}]`
}

export const SCHEDULE_PRE_EDUCATION_NAME_VALIDATION_KEY =
  'scheduleCurriculum.preEducationName' as const
export const SCHEDULE_PRE_EDUCATION_DATE_VALIDATION_KEY =
  'scheduleCurriculum.preEducationScheduleDate' as const

export function scheduleRegularDetailNameValidationKey(regularNumber: number): string {
  return `scheduleCurriculum.eventName[${regularNumber}]`
}

export function scheduleRegularDetailDateValidationKey(regularNumber: number): string {
  return `scheduleCurriculum.scheduleDate[${regularNumber}]`
}

export function scheduleRegularDetailGroupTimesValidationKey(regularNumber: number): string {
  return `scheduleCurriculum.groupTimes[${regularNumber}]`
}

export function scheduleRegularDetailIpsValidationKey(regularNumber: number): string {
  return `scheduleCurriculum.ips[${regularNumber}]`
}

export function scheduleRegularDetailAssignmentValidationKey(regularNumber: number): string {
  return `scheduleCurriculum.assignment[${regularNumber}]`
}

export function classifyGeneralCommonInfoValidationAlert(
  issues: readonly ZodIssue[]
): GeneralCommonInfoValidationAlertKind {
  const requiredIssues = issues.filter(
    issue =>
      issue.message !== EDUCATION_SCHEDULE_OUTSIDE_OPERATION_RANGE_MESSAGE &&
      issue.message !== EDUCATION_SCHEDULE_CLOCK_REQUIRED_MESSAGE &&
      issue.message !== EDUCATION_SCHEDULE_LINE_SERVER_FORMAT_MESSAGE
  )
  if (requiredIssues.length > 0) return 'required-incomplete'
  if (issues.some(issue => issue.message === EDUCATION_SCHEDULE_OUTSIDE_OPERATION_RANGE_MESSAGE)) {
    return 'operation-range'
  }
  if (
    issues.some(
      issue =>
        issue.message === EDUCATION_SCHEDULE_CLOCK_REQUIRED_MESSAGE ||
        issue.message === EDUCATION_SCHEDULE_LINE_SERVER_FORMAT_MESSAGE
    )
  ) {
    return 'clock-required'
  }
  return 'required-incomplete'
}

export function resolveGeneralCommonInfoValidationAlert(args: {
  alertKind: GeneralCommonInfoValidationAlertKind
  message?: string
}): { title: string; content: ReactNode } {
  if (args.alertKind === 'operation-range') {
    return {
      title: EDUCATION_SCHEDULE_OPERATION_RANGE_ALERT_TITLE,
      content: EDUCATION_SCHEDULE_OUTSIDE_OPERATION_RANGE_MESSAGE,
    }
  }
  if (args.alertKind === 'clock-required') {
    return {
      title: '안내',
      content: args.message?.trim() || EDUCATION_SCHEDULE_CLOCK_REQUIRED_MESSAGE,
    }
  }
  return {
    title: REQUIRED_FIELDS_INCOMPLETE_ALERT_TITLE,
    content: REQUIRED_FIELDS_INCOMPLETE_ALERT_MESSAGE,
  }
}

/** Zod path → 상세 하이라이트 키. 화면에 없는 Overlay 슬롯 키는 만들지 않는다. */
export function zodIssueToDetailHighlightKey(
  issue: ZodIssue,
  values: GeneralProgramCommonInfoEditFormValues
): string | null {
  const [head, index, field] = issue.path
  if (head === 'curriculumSessions' && typeof index === 'number') {
    const session = values.curriculumSessions[index]
    if (session == null) return null
    if (isPreEducationCurriculumSession(session)) {
      if (field === 'title') return CURRICULUM_PRE_EDUCATION_NAME_VALIDATION_KEY
      if (field === 'scheduleDate') return CURRICULUM_PRE_EDUCATION_LINE_VALIDATION_KEY
      return CURRICULUM_PRE_EDUCATION_NAME_VALIDATION_KEY
    }
    const n = regularSessionNumber(values.curriculumSessions, index)
    if (n == null) return null
    if (field === 'description') return `curriculum.unitContent[${n}]`
    if (field === 'title') {
      return values.sessionRound === 'multi'
        ? `curriculum.progressSession[${n}]`
        : `curriculum.unitName[${n}]`
    }
    if (field === 'ipsCategory' || field === 'ipsDetail') {
      return curriculumRegularSessionIpsValidationKey(n)
    }
    if (field === 'assignmentPeriod') return `curriculum.assignment[${n}]`
    if (field === 'educationPlace') return `curriculum.educationPlace[${n}]`
    return values.sessionRound === 'multi'
      ? `curriculum.progressSession[${n}]`
      : `curriculum.unitName[${n}]`
  }
  if (head === 'scheduleDetails' && typeof index === 'number') {
    const row = values.scheduleDetails[index]
    if (row == null) return null
    if (isPreEducationScheduleBlock(row)) {
      if (field === 'scheduleDate') return SCHEDULE_PRE_EDUCATION_DATE_VALIDATION_KEY
      return SCHEDULE_PRE_EDUCATION_NAME_VALIDATION_KEY
    }
    const n = scheduleDetailNumber(values.scheduleDetails, index)
    if (n == null) return null
    if (field === 'scheduleDate') return scheduleRegularDetailDateValidationKey(n)
    if (field === 'groupTimes') return scheduleRegularDetailGroupTimesValidationKey(n)
    if (field === 'ipsCategory' || field === 'ipsDetail') {
      return scheduleRegularDetailIpsValidationKey(n)
    }
    if (field === 'assignmentPeriod') return scheduleRegularDetailAssignmentValidationKey(n)
    if (field === 'educationPlace') return `scheduleCurriculum.educationPlace[${n}]`
    return scheduleRegularDetailNameValidationKey(n)
  }
  switch (head) {
    case 'mainTitle':
      return 'basicInfo.programTitleKo'
    case 'titleEn':
      return 'basicInfo.programTitleEn'
    case 'announcementTitle':
      return 'basicInfo.publicProgramTitle'
    case 'detailedProgramId':
      return 'basicInfo.detailedProgram'
    case 'startDate':
    case 'endDate':
      return 'basicInfo.operationRangeSeal'
    case 'businessArea':
      return 'basicInfo.businessField'
    case 'sponsorManagementIds':
      return 'basicInfo.sponsorId'
    case 'sponsorManagerContactIds':
    case 'sponsorManagerContactId':
      return 'basicInfo.sponsorContactId'
    case 'venueDetail':
      return 'basicInfo.educationVenueDetail'
    case 'educationPlaceAddress':
    case 'educationPlaceScheduleDetail':
      return 'typeSettings.educationPlace'
    case 'educationProcess':
      return 'basicInfo.educationCourse'
    case 'ipOwned':
      return 'basicInfo.ipOwned'
    case 'courseDeliveredBy':
      return 'basicInfo.courseDeliveredBy'
    case 'participantOrganization':
    case 'participantIndividual':
      return 'basicInfo.audience'
    case 'kpiFinalParticipants':
      return 'kpi.participantCount'
    case 'kpiInstructorCount':
      return 'kpi.instructor'
    case 'kpiVolunteerCount':
      return 'kpi.volunteer'
    case 'kpiFinalSchools':
      return 'kpi.finalSchools'
    case 'kpiFinalClasses':
      return 'kpi.finalClasses'
    case 'wageGrade1Amount':
      return 'wage.grade1Fee'
    case 'wageGrade2Amount':
      return 'wage.grade2Fee'
    case 'wageGrade3Amount':
      return 'wage.grade3Fee'
    case 'wagePaymentItemIds':
      return 'wage.paymentItemValues'
    case 'educationForm':
      return 'typeSettings.multiCommonEducationForm'
    case 'participationMethod':
      return 'typeSettings.multiCommonParticipation'
    case 'ipsCategory':
    case 'ipsDetail':
      return 'typeSettings.ipsType'
    case 'educationScheduleLines':
      return 'educationScheduleSettings.singleDateIso'
    default:
      return typeof head === 'string' ? head : null
  }
}

export function parseGeneralCommonInfoRhfValidation(
  values: GeneralProgramCommonInfoEditFormValues
): GeneralCommonInfoRhfValidationResult {
  const trimmedValues: GeneralProgramCommonInfoEditFormValues = {
    ...values,
    curriculumSessions: trimTrailingBlankRegularCurriculumSessions(values.curriculumSessions ?? []),
  }
  const parsed = generalProgramCommonInfoEditSchema.safeParse(trimmedValues)
  if (parsed.success) return { ok: true }
  const keys = parsed.error.issues
    .map(issue => zodIssueToDetailHighlightKey(issue, trimmedValues))
    .filter((key): key is string => Boolean(key))
  const message = parsed.error.issues[0]?.message?.trim() || '입력값을 확인해 주세요.'
  const alertKind = classifyGeneralCommonInfoValidationAlert(parsed.error.issues)
  return {
    ok: false,
    keys: [...new Set(keys)],
    message,
    title:
      alertKind === 'operation-range'
        ? EDUCATION_SCHEDULE_OPERATION_RANGE_ALERT_TITLE
        : undefined,
    alertKind,
    issues: parsed.error.issues,
  }
}

/**
 * 커리큘럼형 복수 회차 + 날짜 지정 — 회차 수와 예정일 줄 수 불일치.
 * 사전교육 진행 일정은 별도 필드이므로 교육 진행 예정일 줄 수와 비교하지 않는다.
 */
export function hasRhfCurriculumMultiDateScheduleCountMismatch(
  values: GeneralProgramCommonInfoEditFormValues
): boolean {
  if (values.educationStructure !== 'curriculum') return false
  if (values.sessionRound !== 'multi') return false
  if (values.educationScheduleMode !== 'date') return false
  const lineCount = values.educationScheduleLines.filter(line => line.trim() !== '').length
  if (lineCount === 0) return false
  const regularCount = Math.max(
    1,
    values.curriculumSessions.filter(session => !isPreEducationCurriculumSession(session)).length
  )
  return lineCount !== regularCount
}
