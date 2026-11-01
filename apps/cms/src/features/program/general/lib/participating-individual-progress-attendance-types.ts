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
  /** 출석 관리 목록 표시용. 일정 시작 전이면 비움 */
  attendanceStatus?: ParticipatingIndividualProgressAttendanceStatus
  /**
   * 출석 API status. 일정 시작 전 숨김과 무관.
   * 참여자 상세 출석 내역·정정 반영에만 쓴다.
   */
  persistedAttendanceStatus?: ParticipatingIndividualProgressAttendanceStatus
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
  /**
   * 대시보드 일정 `scheduleRole` (PRE_EDUCATION | EDUCATION | SESSION | CLOSING).
   * null = 서버 미제공(레거시) — EDUCATION으로 간주하지 않는다.
   */
  scheduleRole?: string | null
  /** 대시보드 일정 `educationSlotKey` (예: general-pre-education:1). null = 미제공 */
  educationSlotKey?: string | null
}
