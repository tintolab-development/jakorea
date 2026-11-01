import type {
  UjatAssignmentDatePeriodDto,
  UjatAssignmentDocumentDto,
  UjatAssignmentSubmissionsResponse,
  UjatAssignmentVolunteerDto,
} from '@/features/program/ujat/api/education-execution-api'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import type { EducationProgressHalfKey } from '../tabs'
import { formatAssignmentDateLabel } from './assignment-display'
import { formatDateDot, formatDateDotWithWeekday } from '@/shared/utils/date'
import type {
  UjatAssignmentReportState,
  UjatAssignmentReportStatus,
  UjatAssignmentSessionGroup,
  UjatAssignmentVolunteerRow,
} from './types'

const SEOUL_YMD_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** ISO 시각 또는 `YYYY-MM-DD` → Asia/Seoul 달력일 `YYYY-MM-DD` */
function toSeoulYmd(value: string | null | undefined): string | undefined {
  const raw = value?.trim()
  if (!raw) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return undefined
  return SEOUL_YMD_FORMATTER.format(date)
}

/** ISO 시각 또는 `YYYY-MM-DD` → Asia/Seoul `YYYY.MM.DD` */
export function formatAssignmentShortDate(value: string | null | undefined): string | undefined {
  const ymd = toSeoulYmd(value)
  return ymd ? formatDateDot(ymd) : undefined
}

/** ISO 시각 또는 `YYYY-MM-DD` → Asia/Seoul `YYYY.MM.DD(요일)` */
export function formatAssignmentWeekdayDate(value: string | null | undefined): string | undefined {
  const ymd = toSeoulYmd(value)
  return ymd ? formatDateDotWithWeekday(ymd) : undefined
}

/** BE `planSubmissionPeriod` / `logSubmissionPeriod` — inclusive Asia/Seoul 달력 범위. */
export function formatAssignmentPeriodLabel(
  period: UjatAssignmentDatePeriodDto | null | undefined
): string {
  const from = formatAssignmentWeekdayDate(period?.from)
  const to = formatAssignmentWeekdayDate(period?.to)
  if (!from && !to) return '-'
  if (from === to) return from ?? '-'
  return `${from ?? '-'} ~ ${to ?? '-'}`
}

function toReportStatus(dto: UjatAssignmentDocumentDto | null | undefined): UjatAssignmentReportStatus {
  switch (dto?.status?.trim().toUpperCase()) {
    case 'SUBMITTED':
    case 'APPROVED':
    case 'FEEDBACK_REQUESTED':
      // OpenAPI APPROVED = 관리자 승인 제출본 → 목록에서는 제출 완료로 표기
      return 'submitted'
    case 'REVISED':
      return 'revised'
    case 'DEADLINE_MISSED':
      return 'deadline_missed'
    default:
      return 'not_submitted'
  }
}

function toReportState(dto: UjatAssignmentDocumentDto | null | undefined): UjatAssignmentReportState {
  const rawStatus = dto?.status?.trim().toUpperCase()
  const status = toReportStatus(dto)
  if (status === 'not_submitted') return { status }
  const formResponseId =
    typeof dto?.formResponseId === 'number' && Number.isFinite(dto.formResponseId)
      ? dto.formResponseId
      : undefined
  return {
    status,
    submittedDateLabel: formatAssignmentWeekdayDate(dto?.submittedAt),
    feedbackDeliveredDateLabel:
      rawStatus === 'FEEDBACK_REQUESTED'
        ? formatAssignmentWeekdayDate(dto?.feedbackDeliveredAt)
        : undefined,
    formResponseId,
  }
}

function toVolunteerRow(
  dto: UjatAssignmentVolunteerDto,
  sessionId: string,
  index: number
): UjatAssignmentVolunteerRow {
  const key = dto.participantId ?? dto.memberId ?? `idx-${index}`
  return {
    id: `${sessionId}-${key}`,
    name: dto.volunteerName?.trim() || '-',
    institutionName: dto.institutionName?.trim() || '-',
    assignedClass: dto.assignedClass?.trim() || '-',
    plan: toReportState(dto.plan),
    log: toReportState(dto.log),
    isDropout: dto.activityAbandoned === true,
    hasProgressHistory: dto.hasProgressOnDate === true,
  }
}

export function buildUjatAssignmentSessionsFromResponse(params: {
  response: UjatAssignmentSubmissionsResponse
  regionKey: UjatInstitutionApplicationRegionKey
  half: EducationProgressHalfKey
}): UjatAssignmentSessionGroup[] {
  const { response, regionKey, half } = params
  return (response.sessions ?? [])
    .filter(session => Boolean(session.educationDate?.trim()))
    .map((session, sessionIndex) => {
      const isoDate = session.educationDate!.trim()
      const id = String(session.scheduleId ?? `${isoDate}-${sessionIndex}`)
      return {
        id,
        regionKey,
        half,
        isoDate,
        dateLabel: formatAssignmentDateLabel(isoDate),
        planSubmissionPeriodLabel: formatAssignmentPeriodLabel(session.planSubmissionPeriod),
        logSubmissionPeriodLabel: formatAssignmentPeriodLabel(session.logSubmissionPeriod),
        volunteers: (session.volunteers ?? []).map((volunteer, index) =>
          toVolunteerRow(volunteer, id, index)
        ),
      }
    })
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate))
}
