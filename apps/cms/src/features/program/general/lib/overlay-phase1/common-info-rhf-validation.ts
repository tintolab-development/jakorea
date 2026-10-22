/**
 * 일반 프로그램 상세 공통정보 수정 — RHF Zod 검증.
 * 등록 위저드 Overlay `listIncomplete*` 와 분리한다.
 */
import type { ZodIssue } from 'zod'
import {
  EDUCATION_SCHEDULE_OPERATION_RANGE_ALERT_TITLE,
  EDUCATION_SCHEDULE_OUTSIDE_OPERATION_RANGE_MESSAGE,
  generalProgramCommonInfoEditSchema,
  type GeneralProgramCommonInfoEditFormValues,
} from '@/features/program/general/model/common-info-edit-schema'
import {
  isPreEducationCurriculumSession,
  trimTrailingBlankRegularCurriculumSessions,
} from '@/features/program/general/lib/schedule-detail-form'

export type GeneralCommonInfoRhfValidationResult =
  | { ok: true }
  | {
      ok: false
      keys: readonly string[]
      message: string
      title?: string
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
  if (row == null || row.blockKind === 'preEducation') return null
  let number = 0
  for (let i = 0; i <= arrayIndex; i += 1) {
    if (details[i]?.blockKind !== 'preEducation') number += 1
  }
  return number > 0 ? number : null
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
      if (field === 'title') return 'curriculum.preEducationScheduleName'
      if (field === 'scheduleDate') return 'curriculum.preEducationScheduleLine'
      return 'curriculum.preEducationScheduleName'
    }
    const n = regularSessionNumber(values.curriculumSessions, index)
    if (n == null) return null
    if (field === 'description') return `curriculum.unitContent[${n}]`
    if (field === 'title') return `curriculum.unitName[${n}]`
    if (field === 'ipsCategory' || field === 'ipsDetail') return `curriculum.ips[${n}]`
    if (field === 'assignmentPeriod') return `curriculum.assignment[${n}]`
    return `curriculum.unitName[${n}]`
  }
  if (head === 'scheduleDetails' && typeof index === 'number') {
    const row = values.scheduleDetails[index]
    if (row == null) return null
    if (row.blockKind === 'preEducation') {
      if (field === 'scheduleDate') return 'scheduleCurriculum.preEducationScheduleDate'
      return 'scheduleCurriculum.preEducationName'
    }
    const n = scheduleDetailNumber(values.scheduleDetails, index)
    if (n == null) return null
    if (field === 'scheduleDate') return `scheduleCurriculum.scheduleDate[${n}]`
    if (field === 'groupTimes') return `scheduleCurriculum.groupTimes[${n}]`
    return `scheduleCurriculum.eventName[${n}]`
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
  return {
    ok: false,
    keys: [...new Set(keys)],
    message,
    title:
      message === EDUCATION_SCHEDULE_OUTSIDE_OPERATION_RANGE_MESSAGE
        ? EDUCATION_SCHEDULE_OPERATION_RANGE_ALERT_TITLE
        : undefined,
    issues: parsed.error.issues,
  }
}

/** 커리큘럼형 복수 회차 + 날짜 지정 — 회차 수와 예정일 줄 수 불일치 */
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
