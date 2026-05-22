export type UjatVolunteerScheduleRole = 'attendance_manager' | 'none'

export const UJAT_VOLUNTEER_SCHEDULE_ROLE_LABEL: Record<UjatVolunteerScheduleRole, string> = {
  attendance_manager: '출결 담당',
  none: '해당 없음',
} as const

export const UJAT_VOLUNTEER_SCHEDULE_ROLE_ORDER: readonly UjatVolunteerScheduleRole[] = [
  'attendance_manager',
  'none',
] as const

export type UjatVolunteerPartnerDisplay =
  | { kind: 'name'; value: string }
  | { kind: 'undecided' }
  | { kind: 'dash' }

export type UjatVolunteerClassDisplay =
  | { kind: 'class'; label: string }
  | { kind: 'withdrawn' }
  | { kind: 'dash' }

export type UjatVolunteerAttendanceDisplay =
  | { kind: 'present' }
  | { kind: 'late'; time: string }
  | { kind: 'excused_absence' }
  | { kind: 'dash' }

export type UjatVolunteerEducationProgressDisplay = 'completed' | 'scheduled' | 'dash'

export type UjatVolunteerAssignmentProgressRow = {
  id: string
  scheduleLabel: string
  role: UjatVolunteerScheduleRole
  partner: UjatVolunteerPartnerDisplay
  classDisplay: UjatVolunteerClassDisplay
  attendance: UjatVolunteerAttendanceDisplay
  educationPlanSubmitted: boolean
  educationLogSubmitted: boolean
  educationProgress: UjatVolunteerEducationProgressDisplay
  /** 활동 포기 행 — 테이블 하단 고정·오버레이 */
  isWithdrawn: boolean
}

export type UjatVolunteerAssignmentAbsenceReason = {
  id: string
  dateLabel: string
  reason: string
  fileName: string
}

export type UjatVolunteerAssignmentAttendanceSummary = {
  completionStatus: string
  lateCountLabel: string
}

export type UjatVolunteerAssignmentProgressBundle = {
  rows: UjatVolunteerAssignmentProgressRow[]
  attendanceSummary: UjatVolunteerAssignmentAttendanceSummary
  absenceReasons: UjatVolunteerAssignmentAbsenceReason[]
}
