export const PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_FILTER_ALL = 'all'

export type ParticipatingIndividualProgressAttendanceStatus =
  | 'present'
  | 'late'
  | 'absent'
  | 'excused_absence'

export const PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_STATUS_LABELS: Record<
  ParticipatingIndividualProgressAttendanceStatus,
  string
> = {
  present: '출석',
  late: '지각',
  absent: '결석',
  excused_absence: '사유 불참',
}

export type ParticipatingIndividualProgressAttendanceFilters = {
  educationSchedule: string
  participantName: string
  affiliation: string
  educationGrade: string
  attendanceStatus: string
}

export type ParticipatingIndividualProgressAttendanceParticipantRow = {
  id: string
  participantId: string
  name: string
  genderBirthLabel: string
  affiliationGradeLabel: string
  affiliation: string
  educationGrade: string
  contact?: string
  email?: string
  attendanceStatus: ParticipatingIndividualProgressAttendanceStatus
  lateTime?: string
  remark?: string
}

export type ParticipatingIndividualProgressAttendanceSessionGroup = {
  id: string
  round: number
  filterValue: string
  filterLabel: string
  headerTitle: string
  headerScheduleSummary: string
  headerPeriodRangeLabel: string
  headerPrefix: string
  participants: ParticipatingIndividualProgressAttendanceParticipantRow[]
}
