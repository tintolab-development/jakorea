/**
 * 프로그램 출결 정정 모달 — 상태·초기값·확인 payload 공통 타입
 */

export type ProgramAttendanceCorrectionStatus =
  | 'present'
  | 'late'
  | 'absence'
  | 'excused_absence'

export type ProgramAttendanceCorrectionInitialValue =
  | { kind: 'present' }
  | { kind: 'late'; time: string }
  | { kind: 'absence' }
  | { kind: 'excused_absence' }
  | { kind: 'dash' }

export type ProgramAttendanceCorrectionConfirmPayload = {
  status: ProgramAttendanceCorrectionStatus
  attendanceTime: string | null
  reason: string
  evidenceFileName: string | null
  /** prepare 완료된 증빙 fileObjectId (사유 불참) */
  evidenceFileObjectIds?: number[]
}

export type ProgramAttendanceCorrectionStatusOption = {
  value: ProgramAttendanceCorrectionStatus
  label: string
}

export const PROGRAM_ATTENDANCE_CORRECTION_STATUS_OPTIONS: ProgramAttendanceCorrectionStatusOption[] =
  [
    { value: 'present', label: '출석' },
    { value: 'late', label: '지각' },
    { value: 'absence', label: '결석' },
    { value: 'excused_absence', label: '사유 불참' },
  ]
