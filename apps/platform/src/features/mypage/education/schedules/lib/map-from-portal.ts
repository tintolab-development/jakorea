import type {
  PortalEducationSchedule,
  PortalEducationScheduleAssignment,
  PortalEducationScheduleGroupTime,
} from '../../applications/api/activity-client'
import type {
  EducationAssignmentSubmitStatus,
  EducationScheduleAssignment,
  EducationScheduleAssignmentFile,
  EducationScheduleAttendanceStatus,
  EducationScheduleItem,
} from '../model/types'

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

function optionalText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function mapAttendance(
  value: string | null | undefined,
): EducationScheduleAttendanceStatus | null {
  switch ((value ?? '').toUpperCase()) {
    case 'PRESENT':
    case 'ATTENDED':
      return 'present'
    case 'LATE':
      return 'late'
    case 'ABSENT':
      return 'absent'
    case 'EXCUSED':
      return 'excused'
    default:
      return null
  }
}

function mapAssignmentStatus(value: string | undefined): EducationAssignmentSubmitStatus {
  switch ((value ?? '').toUpperCase()) {
    case 'SUBMITTED':
      return 'submitted'
    case 'FEEDBACK':
      return 'feedback'
    case 'REVISION_SUBMITTED':
      return 'revision_submitted'
    default:
      return 'not_submitted'
  }
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function formatDateTimeLabel(iso: string | null | undefined): string | undefined {
  const raw = optionalText(iso ?? undefined)
  if (!raw) return undefined
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  const w = WEEKDAY_KO[date.getDay()] ?? ''
  return `${date.getFullYear()}년 ${pad2(date.getMonth() + 1)}월 ${pad2(date.getDate())}일(${w}) ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function formatPeriodLabel(startAt: string | null | undefined, endAt: string | null | undefined): string {
  const start = formatDateTimeLabel(startAt)
  const end = formatDateTimeLabel(endAt)
  if (start && end) return `${start} ~ ${end}`
  return start ?? end ?? ''
}

function formatGroupTimes(times: PortalEducationScheduleGroupTime[] | undefined): string | undefined {
  const labels = (times ?? [])
    .map(slot => {
      const start = slot.startTime?.trim() ?? ''
      const end = slot.endTime?.trim() ?? ''
      if (start && end) return `${start} ~ ${end}`
      return start || end
    })
    .filter(label => label.length > 0)
  if (labels.length === 0) return undefined
  if (labels.length === 1) return labels[0]
  return labels
    .map((label, index) => `그룹 ${String.fromCharCode(65 + index)} : ${label}`)
    .join(' | ')
}

function mapSubmissions(
  assignment: PortalEducationScheduleAssignment,
): EducationScheduleAssignmentFile[] | undefined {
  const files = (assignment.submissions ?? []).flatMap((row, index) => {
    const fileName = optionalText(row.fileName) ?? optionalText(row.url)
    if (!fileName) return []
    const kind = (row.kind ?? '').toUpperCase() === 'URL' ? ('url' as const) : ('file' as const)
    return [
      {
        id: row.id != null ? String(row.id) : `submission-${index}`,
        fileName,
        kind,
      } satisfies EducationScheduleAssignmentFile,
    ]
  })
  return files.length > 0 ? files : undefined
}

function mapAssignment(
  assignment: PortalEducationScheduleAssignment | null | undefined,
): EducationScheduleAssignment | undefined {
  if (!assignment || assignment.enabled !== true) return undefined
  const submitStartAt = optionalText(assignment.submitStartAt ?? undefined) ?? ''
  const submitEndAt = optionalText(assignment.submitEndAt ?? undefined) ?? ''
  const periodLabel =
    optionalText(assignment.periodLabel) ?? formatPeriodLabel(submitStartAt, submitEndAt)
  const files = mapSubmissions(assignment)
  return {
    submitStartAt,
    submitEndAt,
    periodLabel,
    status: mapAssignmentStatus(assignment.status),
    ...(assignment.formResponseId != null ? { formResponseId: assignment.formResponseId } : {}),
    ...(files ? { files } : {}),
  }
}

/**
 * 신청 GET .../schedules → 교육일정 탭 행.
 * startAt이 없어도 카드를 유지한다. assignment.enabled가 true가 아니면 과제 블록 omit.
 */
export function mapPortalEducationSchedule(
  item: PortalEducationSchedule,
  index: number,
): EducationScheduleItem {
  const sessionNumber = item.sessionNo ?? index + 1
  const sessionLabel = optionalText(item.sessionLabel)
  const scheduleLabel = optionalText(item.scheduleLabel)
  const title =
    optionalText(item.title) ||
    optionalText(item.unitName) ||
    optionalText(item.scheduleName) ||
    optionalText(item.locationName) ||
    sessionLabel ||
    scheduleLabel ||
    `${sessionNumber}회차`
  const heldAt = optionalText(item.startAt ?? undefined) ?? ''
  const progressTimeLabel =
    optionalText(item.progressTimeLabel) ??
    formatGroupTimes(item.groupTimes) ??
    formatPeriodLabel(item.startAt, item.endAt)
  const id =
    item.scheduleId != null ? String(item.scheduleId) : `schedule-${sessionNumber}-${index}`
  const assignment = mapAssignment(item.assignment)

  return {
    id,
    ...(item.scheduleId === null
      ? { scheduleId: null }
      : item.scheduleId != null
        ? { scheduleId: item.scheduleId }
        : {}),
    sessionNumber,
    heldAt,
    title,
    attendanceStatus: mapAttendance(item.attendanceStatus),
    ...(optionalText(item.absenceReason) ? { absenceReason: item.absenceReason!.trim() } : {}),
    ...(sessionLabel ? { sessionLabel } : {}),
    ...(scheduleLabel ? { scheduleLabel } : {}),
    ...(optionalText(item.content) ? { content: item.content!.trim() } : {}),
    ...(progressTimeLabel ? { progressTimeLabel } : {}),
    ...(assignment ? { assignment } : {}),
  }
}
