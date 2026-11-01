import { extractApiErrorCode } from '@/shared/lib/extract-api-error-message'

export const ATTENDANCE_RECORDING_NOT_OPEN_CODE = 'ATTENDANCE_RECORDING_NOT_OPEN'

export const ATTENDANCE_CORRECTION_NOT_OPEN_ALERT = {
  title: '출결 정정 불가 안내',
  content:
    '아직 진행 예정인 일정입니다.\n출결 정정은 진행 완료된 교육만 가능합니다.',
} as const

/** PUT schedule attendances 409 — 일정 시작 전. */
export function isAttendanceRecordingNotOpenError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('response' in error)) return false
  const data = (error as { response?: { data?: unknown } }).response?.data
  return extractApiErrorCode(data) === ATTENDANCE_RECORDING_NOT_OPEN_CODE
}
