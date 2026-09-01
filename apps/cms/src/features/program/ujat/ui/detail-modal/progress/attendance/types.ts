import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import type { EducationProgressHalfKey } from '../tabs'

export type UjatAttendanceStatus = 'present' | 'late' | 'absent' | 'excused_absence'

export const UJAT_ATTENDANCE_STATUS_LABEL: Record<UjatAttendanceStatus, string> = {
  present: '출석',
  late: '지각',
  absent: '결석',
  excused_absence: '불참',
} as const

export const UJAT_ATTENDANCE_STATUS_ORDER: readonly UjatAttendanceStatus[] = [
  'present',
  'late',
  'absent',
  'excused_absence',
] as const

export type UjatAttendanceVolunteerRow = {
  id: string
  name: string
  assignedClass: string
  contact: string
  email: string
  status: UjatAttendanceStatus
  lateMinutes?: number
  checkInTime?: string
  excusedReason?: string
  /** 활동 포기자 — 해당 세션에 출석 이력이 있을 때만 mock 목록에 포함 */
  isDropout: boolean
}

export type UjatAttendanceSessionGroup = {
  id: string
  regionKey: UjatInstitutionApplicationRegionKey
  half: EducationProgressHalfKey
  isoDate: string
  dateLabel: string
  institutionName: string
  district: string
  timeRange: string
  volunteers: UjatAttendanceVolunteerRow[]
}

export const UJAT_ATTENDANCE_FILTER_ALL = ''

export type UjatAttendanceFilters = {
  educationDate: string
  volunteerName: string
  attendanceStatus: string
}

export const EMPTY_UJAT_ATTENDANCE_FILTERS: UjatAttendanceFilters = {
  educationDate: UJAT_ATTENDANCE_FILTER_ALL,
  volunteerName: '',
  attendanceStatus: UJAT_ATTENDANCE_FILTER_ALL,
}
