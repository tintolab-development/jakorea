export type ParticipatingIndividualParticipantAttendanceStatus =
  | 'present'
  | 'late'
  | 'absent'
  | 'excused_absence'
  | 'withdrawn'
  | 'pending'

export type ParticipatingIndividualParticipantSessionProgressStatus = 'completed' | 'scheduled'

export const PARTICIPATING_INDIVIDUAL_PARTICIPANT_ATTENDANCE_STATUS_LABELS: Record<
  ParticipatingIndividualParticipantAttendanceStatus,
  string
> = {
  present: '출석',
  late: '지각',
  absent: '결석',
  excused_absence: '사유 불참',
  withdrawn: '활동 포기',
  pending: '출석',
}

export const PARTICIPATING_INDIVIDUAL_PARTICIPANT_SESSION_PROGRESS_LABELS: Record<
  ParticipatingIndividualParticipantSessionProgressStatus,
  string
> = {
  completed: '진행 완료',
  scheduled: '진행 예정',
}

export type ParticipatingIndividualParticipantAttendanceRow = {
  id: string
  /** program-schedules PK — bulk-upsert 대상. 없으면 저장 불가 */
  scheduleId?: string | null
  scheduleLabel: string
  attendanceStatus: ParticipatingIndividualParticipantAttendanceStatus
  /** BE 출석 기록 여부. 미기록이면 테이블은 출석으로 보여도 출석률 분자에 넣지 않는다. */
  attendanceRecorded: boolean
  /** education-scope 배정 순서 — 마지막 교육 일정 판정 */
  assignedIndex: number
  lateTime?: string
  educationProgress: ParticipatingIndividualParticipantSessionProgressStatus
  remark?: string
}

export type ParticipatingIndividualParticipantAttendanceSummary = {
  completionStatusLabel: string
  lateCountLabel: string
  attendanceRateCountLabel: string
}

export type ParticipatingIndividualParticipantAbsenceReason = {
  id: string
  scheduleRowId: string
  dateLabel: string
  reason: string
  fileName?: string | null
  fileObjectIds?: number[]
  originalFileNames?: Array<string | null>
}

export type ParticipatingIndividualParticipantAttendanceBundle = {
  rows: ParticipatingIndividualParticipantAttendanceRow[]
  summary: ParticipatingIndividualParticipantAttendanceSummary
  absenceReasons: ParticipatingIndividualParticipantAbsenceReason[]
}

export function isParticipatingIndividualParticipantAttendanceRowWithdrawn(
  row: ParticipatingIndividualParticipantAttendanceRow
): boolean {
  return row.attendanceStatus === 'withdrawn'
}

export function hasExcusedAbsenceInParticipatingIndividualAttendanceRows(
  rows: ParticipatingIndividualParticipantAttendanceRow[]
): boolean {
  return rows.some(row => row.attendanceStatus === 'excused_absence')
}
