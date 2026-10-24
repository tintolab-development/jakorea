import type { PortalScheduleAttendanceDetail } from '../../../education/applications/api/activity-client'
import type { EducationScheduleAttendanceStatus } from '../../../education/schedules/model/types'
import { formatUjatAssignmentStatusLabel } from './history'

export type UjatScheduleAttendanceDetailView = {
  attendanceStatus: EducationScheduleAttendanceStatus | null
  attendanceLabel: string
  classLabel: string
  assignmentStatus: string
  assignmentStatusLabel: string
  canCheckIn: boolean
  absenceReason: string
  locationName: string
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

function displayText(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}

export function mapPortalScheduleAttendanceDetail(
  detail: PortalScheduleAttendanceDetail,
): UjatScheduleAttendanceDetailView {
  const attendanceStatus = mapAttendance(detail.attendanceStatus)
  const assignmentStatus = displayText(detail.assignmentStatus)
  return {
    attendanceStatus,
    attendanceLabel:
      attendanceStatus === 'present'
        ? '출석'
        : attendanceStatus === 'late'
          ? '지각'
          : attendanceStatus === 'absent'
            ? '결석'
            : attendanceStatus === 'excused'
              ? '사유 불참'
              : '-',
    classLabel: displayText(detail.classLabel),
    assignmentStatus,
    assignmentStatusLabel: formatUjatAssignmentStatusLabel(detail.assignmentStatus),
    canCheckIn: detail.canCheckIn === true,
    absenceReason: displayText(detail.absenceReason ?? undefined),
    locationName: displayText(detail.locationName),
  }
}
