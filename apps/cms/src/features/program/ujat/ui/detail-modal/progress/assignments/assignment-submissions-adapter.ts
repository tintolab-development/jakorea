import type {
  UjatAssignmentDatePeriodDto,
  UjatAssignmentDocumentDto,
  UjatAssignmentSubmissionsResponse,
  UjatAssignmentVolunteerDto,
} from '@/features/program/ujat/api/education-execution-api'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import type { EducationProgressHalfKey } from '../tabs'
import { formatAssignmentDateLabel } from './assignment-display'
import { formatDateDot } from '@/shared/utils/date'
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

/** ISO 시각 또는 `YYYY-MM-DD` → Asia/Seoul `YYYY.MM.DD` */
export function formatAssignmentShortDate(value: string | null | undefined): string | undefined {
  const raw = value?.trim()
  if (!raw) return undefined
  let ymd = raw
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return undefined
    ymd = SEOUL_YMD_FORMATTER.format(date)
  }
  const [y, m, d] = ymd.split('-')
  if (!y || !m || !d) return undefined
  return formatDateDot(`${y}-${m}-${d}`)
}

function formatPeriodLabel(period: UjatAssignmentDatePeriodDto | null | undefined): string {
  const from = formatAssignmentShortDate(period?.from)
  const to = formatAssignmentShortDate(period?.to)
  if (!from && !to) return '-'
  return `${from ?? '-'} ~ ${to ?? '-'}`
}

function toReportStatus(raw: string | null | undefined): UjatAssignmentReportStatus {
  switch (raw?.trim().toUpperCase()) {
    case 'SUBMITTED':
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
  const status = toReportStatus(dto?.status)
  if (status === 'not_submitted') return { status }
  const formResponseId =
    typeof dto?.formResponseId === 'number' && Number.isFinite(dto.formResponseId)
      ? dto.formResponseId
      : undefined
  return {
    status,
    submittedDateLabel: formatAssignmentShortDate(dto?.submittedAt),
    feedbackDeliveredDateLabel:
      status === 'revised' ? undefined : formatAssignmentShortDate(dto?.feedbackDeliveredAt),
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
        planSubmissionPeriodLabel: formatPeriodLabel(session.planSubmissionPeriod),
        logSubmissionPeriodLabel: formatPeriodLabel(session.logSubmissionPeriod),
        volunteers: (session.volunteers ?? []).map((volunteer, index) =>
          toVolunteerRow(volunteer, id, index)
        ),
      }
    })
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate))
}
