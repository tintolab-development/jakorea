import { MASKING_POLICY } from '@/shared/constants/download-policy'
import {
  UJAT_ATTENDANCE_STATUS_LABEL,
  type UjatAttendanceStatus,
  type UjatAttendanceVolunteerRow,
} from './types'

export function formatAttendanceDateLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'] as const
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const weekday = weekdays[d.getDay()]
  return `${y}. ${m}. ${day}(${weekday})`
}

export function formatAttendanceRemarks(row: Pick<
  UjatAttendanceVolunteerRow,
  'status' | 'lateMinutes' | 'checkInTime' | 'excusedReason'
>): string {
  if (row.status === 'late' && row.lateMinutes != null && row.checkInTime) {
    return `${row.lateMinutes}분 지각 (${row.checkInTime})`
  }
  if (row.status === 'excused_absence' && row.excusedReason) {
    return row.excusedReason
  }
  return '-'
}

export function maskAttendanceContact(contact: string): string {
  return MASKING_POLICY.phone(contact) || contact
}

export function maskAttendanceEmail(email: string): string {
  return MASKING_POLICY.email(email) || email
}

export function attendanceStatusLabel(status: UjatAttendanceStatus): string {
  return UJAT_ATTENDANCE_STATUS_LABEL[status]
}

/** 활동 포기자는 해당 세션 출석 이력이 있는 경우에만 노출 (mock 설계상 목록 포함 = 노출) */
export function filterVisibleAttendanceVolunteers(
  volunteers: UjatAttendanceVolunteerRow[]
): UjatAttendanceVolunteerRow[] {
  return volunteers.filter(v => !v.isDropout || v.status !== undefined)
}

export function cloneAttendanceVolunteerRows(
  rows: UjatAttendanceVolunteerRow[]
): UjatAttendanceVolunteerRow[] {
  return rows.map(row => ({ ...row }))
}

export function attendanceRowsEqual(
  a: UjatAttendanceVolunteerRow[],
  b: UjatAttendanceVolunteerRow[]
): boolean {
  if (a.length !== b.length) return false
  return a.every((row, i) => {
    const other = b[i]
    return (
      row.id === other.id &&
      row.status === other.status &&
      row.lateMinutes === other.lateMinutes &&
      row.checkInTime === other.checkInTime &&
      row.excusedReason === other.excusedReason
    )
  })
}

export function mergeAttendanceVolunteerUpdates(
  fullRows: UjatAttendanceVolunteerRow[],
  editedRows: UjatAttendanceVolunteerRow[]
): UjatAttendanceVolunteerRow[] {
  const editedMap = new Map(editedRows.map(row => [row.id, row]))
  return fullRows.map(row => editedMap.get(row.id) ?? row)
}

export function parseSessionStartTime(timeRange: string): string {
  const match = timeRange.match(/^(\d{1,2}:\d{2})/)
  return match?.[1] ?? '8:00'
}

export function computeLateMinutes(startTime: string, checkInTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [ch, cm] = checkInTime.split(':').map(Number)
  if ([sh, sm, ch, cm].some(n => Number.isNaN(n))) return 0
  return Math.max(0, ch * 60 + cm - (sh * 60 + sm))
}

export function applyAttendanceCorrection(
  row: UjatAttendanceVolunteerRow,
  status: UjatAttendanceStatus,
  options: {
    checkInTime?: string
    sessionStartTime?: string
    excusedReason?: string
  }
): UjatAttendanceVolunteerRow {
  const next: UjatAttendanceVolunteerRow = { ...row, status }

  if (status === 'late') {
    const checkInTime = options.checkInTime ?? row.checkInTime ?? '9:10'
    const sessionStart = options.sessionStartTime ?? '8:00'
    next.checkInTime = checkInTime
    next.lateMinutes = computeLateMinutes(sessionStart, checkInTime)
    next.excusedReason = undefined
    return next
  }

  if (status === 'excused_absence') {
    next.excusedReason = options.excusedReason ?? row.excusedReason ?? '개인 사정'
    next.lateMinutes = undefined
    next.checkInTime = undefined
    return next
  }

  if (status === 'present' && options.checkInTime) {
    next.checkInTime = options.checkInTime
  } else {
    next.checkInTime = undefined
  }
  next.lateMinutes = undefined
  next.excusedReason = undefined
  return next
}

export function attendanceFullRowsEqual(
  a: UjatAttendanceVolunteerRow[],
  b: UjatAttendanceVolunteerRow[]
): boolean {
  if (a.length !== b.length) return false
  const mapB = new Map(b.map(row => [row.id, row]))
  return a.every(row => {
    const other = mapB.get(row.id)
    if (!other) return false
    return (
      row.status === other.status &&
      row.lateMinutes === other.lateMinutes &&
      row.checkInTime === other.checkInTime &&
      row.excusedReason === other.excusedReason
    )
  })
}
