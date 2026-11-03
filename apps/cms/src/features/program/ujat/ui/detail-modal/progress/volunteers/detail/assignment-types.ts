export type UjatVolunteerScheduleRole = 'attendance_manager' | 'none'

export const UJAT_VOLUNTEER_SCHEDULE_ROLE_LABEL: Record<UjatVolunteerScheduleRole, string> = {
  attendance_manager: '출결 담당',
  none: '해당 없음',
} as const

export const UJAT_VOLUNTEER_SCHEDULE_ROLE_ORDER: readonly UjatVolunteerScheduleRole[] = [
  'attendance_manager',
  'none',
] as const

export type UjatVolunteerAssignedInstitutionDisplay =
  | { kind: 'name'; value: string }
  | { kind: 'dash' }

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
  | { kind: 'absence' }
  | { kind: 'excused_absence' }
  | { kind: 'withdrawn' }
  | { kind: 'dash' }

export type UjatVolunteerEducationProgressDisplay = 'completed' | 'scheduled' | 'dash'

export type UjatVolunteerAssignmentProgressRow = {
  id: string
  scheduleLabel: string
  role: UjatVolunteerScheduleRole
  assignedInstitution: UjatVolunteerAssignedInstitutionDisplay
  partner: UjatVolunteerPartnerDisplay
  classDisplay: UjatVolunteerClassDisplay
  attendance: UjatVolunteerAttendanceDisplay
  educationPlanSubmitted: boolean
  educationLogSubmitted: boolean
  /** Wave11 — 교육계획서 form response id */
  educationPlanFormResponseId?: number
  /** Wave11 — 교육일지 form response id */
  educationLogFormResponseId?: number
  /** 교육계획서 제출일 표시(예: 2026.04.03). 없으면 빈 문자열 */
  educationPlanSubmittedDateLabel?: string
  /** 교육일지 제출일 표시. 없으면 빈 문자열 */
  educationLogSubmittedDateLabel?: string
  educationProgress: UjatVolunteerEducationProgressDisplay
  /** 봉사 활동 포기 상태(역할·보기 등 제한). 배정 학급 `활동 포기`와 별도일 수 있음 */
  isWithdrawn: boolean
  /** 배정·출결 mutation 식별자. 표시용 값이 아니다. */
  scheduleId?: number
  educationSlotId?: number | null
  assignmentGroupId?: string | null
  organizationApplicationId?: number | null
  participantId?: number
  /** 이 봉사자가 조의 secondary이면 true */
  selfIsSecondary?: boolean
  /**
   * 이 교육일 matrix cell.assignmentStatus === ASSIGNED.
   * false면 역할 셀에서 출결 담당 PUT을 보내지 않는다.
   */
  canAssignAttendanceManager?: boolean
  /**
   * 서버 `assignmentNotificationSent` (boolean). `false`만 간단 취소.
   * `true`는 사유+알림. 값이 없으면 사유 모달.
   */
  assignmentNotificationSent?: boolean
}

/** 배정 학급 열이 `활동 포기`인 행 — 하단 고정·흰색 오버레이 */
export function isVolunteerAssignmentClassWithdrawn(row: UjatVolunteerAssignmentProgressRow): boolean {
  return row.classDisplay.kind === 'withdrawn'
}

export type UjatVolunteerAssignmentAbsenceReason = {
  id: string
  /** 출결 행과의 연결 키(출결 정정 갱신용) */
  scheduleRowId?: string
  /** 표시용 짧은 일자 (예: 5월 8일) */
  dateLabel: string
  reason: string
  /** 없으면 `-` 표기 */
  fileName?: string | null
  fileObjectIds?: number[]
  originalFileNames?: Array<string | null>
}

export function hasExcusedAbsenceInAssignmentRows(
  rows: UjatVolunteerAssignmentProgressRow[]
): boolean {
  return rows.some(row => row.attendance.kind === 'excused_absence')
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
