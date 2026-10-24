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
  /** 출석 API에 기록이 있을 때만 설정 */
  attendanceStatus?: ParticipatingIndividualProgressAttendanceStatus
  attendanceRecorded: boolean
  lateTime?: string
  remark?: string
}

export type ParticipatingIndividualProgressAttendanceSessionGroup = {
  id: string
  round: number
  filterValue: string
  filterLabel: string
  headerTitle: string
  headerDateLabel: string
  headerScheduleSummary: string
  headerPeriodRangeLabel: string
  headerPrefix: string
  /** 프로그램 일정 `scheduleStatus` 기반 교육 진행 (출석과 분리) */
  scheduleEducationProgress: 'completed' | 'scheduled'
  /** 출결 정정·표시 가능 회차 (일정 시작 전·진행 대기는 false) */
  attendanceRecordingOpen: boolean
  participants: ParticipatingIndividualProgressAttendanceParticipantRow[]
}
