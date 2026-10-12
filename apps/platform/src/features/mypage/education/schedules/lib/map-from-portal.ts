import type { PortalEducationSchedule } from '../../applications/api/activity-client'
import type { EducationScheduleAttendanceStatus, EducationScheduleItem } from '../model/types'

function mapAttendance(value: string | undefined): EducationScheduleAttendanceStatus | null {
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

/**
 * 신청 GET .../schedules → 교육일정 탭 행.
 * assignment·absenceReason은 API에 없으므로 넣지 않는다 (Row에서 해당 UI 비노출).
 */
export function mapPortalEducationSchedule(
  item: PortalEducationSchedule,
  index: number,
): EducationScheduleItem | null {
  const heldAt = item.startAt?.trim()
  if (!heldAt) return null

  const sessionNumber = item.sessionNo ?? index + 1
  const locationName = item.locationName?.trim()
  const title = item.title?.trim() || locationName || `${sessionNumber}회차`
  const id =
    item.scheduleId != null ? String(item.scheduleId) : `schedule-${sessionNumber}-${index}`

  return {
    id,
    sessionNumber,
    heldAt,
    title,
    attendanceStatus: mapAttendance(item.attendanceStatus),
  }
}
