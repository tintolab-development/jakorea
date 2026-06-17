export type ParticipatingIndividualParticipantAttendanceStatus =
  | 'present'
  | 'late'
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
  excused_absence: '사유 불참',
  withdrawn: '활동 포기',
  pending: '-',
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
  scheduleLabel: string
  attendanceStatus: ParticipatingIndividualParticipantAttendanceStatus
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
