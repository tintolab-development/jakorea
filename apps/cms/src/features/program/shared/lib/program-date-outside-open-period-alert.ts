import {
  extractApiErrorCode,
  extractApiErrorDetails,
  extractApiErrorField,
} from '@/shared/lib/extract-api-error-message'

export const PROGRAM_DATE_OUTSIDE_OPEN_PERIOD_CODE = 'PROGRAM_DATE_OUTSIDE_OPEN_PERIOD'

export const PROGRAM_DATE_OUTSIDE_OPEN_PERIOD_ALERT_TITLE = '운영 기간을 확인해 주세요'

export const PROGRAM_OPERATION_DATE_FOCUS_EVENT = 'cms-program-operation-date-focus'

const RECRUITMENT_LABELS: Record<string, string> = {
  PARTICIPANT: '참여자',
  INSTRUCTOR: '강사',
  VOLUNTEER: '봉사자',
}

const DATE_EDGE_LABELS: Record<string, string> = {
  operationStartDate: '시작일',
  operationEndDate: '종료일',
}

export type ProgramOperationDateRecruitmentType = 'PARTICIPANT' | 'INSTRUCTOR' | 'VOLUNTEER'

export type ProgramOperationDateFocus = {
  recruitmentType: ProgramOperationDateRecruitmentType | null
  highlightKeys: readonly string[]
}

export type ProgramDateOutsideOpenPeriodAlert = {
  title: string
  content: string
  focus: ProgramOperationDateFocus
}

function responseData(error: unknown): unknown {
  if (error && typeof error === 'object' && 'response' in error) {
    return (error as { response?: { data?: unknown } }).response?.data
  }
  return error
}

function formatCalendarDate(value: string | undefined): string | null {
  if (value == null) return null
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  return `${match[1]}.${match[2]}.${match[3]}`
}

function parseField(field: string | undefined): {
  recruitmentType: ProgramOperationDateRecruitmentType | null
  edgeLabel: string | null
} {
  const parts = field?.trim().split('.').filter(Boolean) ?? []
  const recruitmentRaw = parts.find(part => part in RECRUITMENT_LABELS)
  const edgeRaw = parts.find(part => part in DATE_EDGE_LABELS)
  const recruitmentType =
    recruitmentRaw === 'PARTICIPANT' ||
    recruitmentRaw === 'INSTRUCTOR' ||
    recruitmentRaw === 'VOLUNTEER'
      ? recruitmentRaw
      : null
  return {
    recruitmentType,
    edgeLabel: edgeRaw ? DATE_EDGE_LABELS[edgeRaw]! : null,
  }
}

export function programOperationDateHighlightKeys(
  recruitmentType: ProgramOperationDateRecruitmentType | null
): string[] {
  if (recruitmentType === 'INSTRUCTOR') return ['recruit.instructor.programRangeSeal']
  if (recruitmentType === 'VOLUNTEER') return ['recruit.volunteer.programRangeSeal']
  if (recruitmentType === 'PARTICIPANT') {
    return ['recruit.institution.programRangeSeal', 'recruit.individual.programRangeSeal']
  }
  return []
}

export function registrationStepForOperationDateFocus(
  recruitmentType: ProgramOperationDateRecruitmentType | null,
  visibleRecruitTabs: readonly string[]
):
  | 'recruit-participant-school'
  | 'recruit-participant-individual'
  | 'recruit-instructor'
  | 'recruit-volunteer'
  | null {
  if (
    recruitmentType === 'INSTRUCTOR' &&
    visibleRecruitTabs.includes('recruit-instructor')
  ) {
    return 'recruit-instructor'
  }
  if (recruitmentType === 'VOLUNTEER' && visibleRecruitTabs.includes('recruit-volunteer')) {
    return 'recruit-volunteer'
  }
  if (recruitmentType === 'PARTICIPANT') {
    if (visibleRecruitTabs.includes('recruit-participant-school')) {
      return 'recruit-participant-school'
    }
    if (visibleRecruitTabs.includes('recruit-participant-individual')) {
      return 'recruit-participant-individual'
    }
  }
  return null
}

export function isProgramDateOutsideOpenPeriodError(error: unknown): boolean {
  return extractApiErrorCode(responseData(error)) === PROGRAM_DATE_OUTSIDE_OPEN_PERIOD_CODE
}

export function resolveProgramDateOutsideOpenPeriodAlert(
  error: unknown
): ProgramDateOutsideOpenPeriodAlert | null {
  const data = responseData(error)
  if (extractApiErrorCode(data) !== PROGRAM_DATE_OUTSIDE_OPEN_PERIOD_CODE) return null

  const details = extractApiErrorDetails(data)
  const field = extractApiErrorField(data) ?? details.field
  const parsed = parseField(field)
  const openStart = formatCalendarDate(details.openStart)
  const openEnd = formatCalendarDate(details.openEnd)
  const date = formatCalendarDate(details.date)
  const audience = parsed.recruitmentType ? RECRUITMENT_LABELS[parsed.recruitmentType] : null

  const lines: string[] = []
  if (audience && parsed.edgeLabel) {
    lines.push(
      `${audience}의 운영 ${parsed.edgeLabel}이 프로그램 전체 운영 기간을 벗어났습니다.`
    )
  } else if (audience) {
    lines.push(`${audience}의 운영 기간이 프로그램 전체 운영 기간을 벗어났습니다.`)
  } else {
    lines.push('운영 기간이 프로그램 전체 운영 기간을 벗어났습니다.')
  }
  if (openStart && openEnd) {
    lines.push(`프로그램 전체 운영 기간: ${openStart} ~ ${openEnd}`)
  }
  if (date) {
    lines.push(`입력한 날짜: ${date}`)
  }
  if (openStart && openEnd) {
    lines.push(`운영 기간을 ${openStart} ~ ${openEnd} 범위 내에서 설정해 주세요.`)
  } else {
    lines.push('운영 기간을 프로그램 전체 운영 기간 안에서 다시 설정해 주세요.')
  }

  return {
    title: PROGRAM_DATE_OUTSIDE_OPEN_PERIOD_ALERT_TITLE,
    content: lines.join('\n'),
    focus: {
      recruitmentType: parsed.recruitmentType,
      highlightKeys: programOperationDateHighlightKeys(parsed.recruitmentType),
    },
  }
}

export function publishProgramOperationDateFocus(focus: ProgramOperationDateFocus): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<ProgramOperationDateFocus>(PROGRAM_OPERATION_DATE_FOCUS_EVENT, {
      detail: focus,
    })
  )
}

export function readProgramOperationDateFocusEvent(
  event: Event
): ProgramOperationDateFocus | null {
  if (!(event instanceof CustomEvent)) return null
  const detail = event.detail as ProgramOperationDateFocus | undefined
  if (detail == null || !Array.isArray(detail.highlightKeys)) return null
  return detail
}

export function scrollToProgramOperationDateField(keys: readonly string[]): void {
  if (typeof document === 'undefined') return
  for (const key of keys) {
    const element = document.querySelector(`[data-wizard-field-key="${key}"]`)
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
  }
}
