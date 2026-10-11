import {
  extractApiErrorCode,
  extractApiErrorMessage,
  getApiErrorHttpStatus,
} from '@/shared/lib/extract-api-error-message'

export const ATTENDANCE_RECORDING_NOT_OPEN_CODE = 'ATTENDANCE_RECORDING_NOT_OPEN'

export const ATTENDANCE_RECORDING_NOT_OPEN_MESSAGE =
  '교육 일정이 시작되기 전에는 출결을 기록할 수 없습니다.'

/** PUT schedule attendances 409 — 일정 시작 전 출결 저장 불가 */
export function formatAttendanceRecordingNotOpenMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (extractApiErrorCode(data) !== ATTENDANCE_RECORDING_NOT_OPEN_CODE) return null
  return extractApiErrorMessage(data, {
    httpStatus: getApiErrorHttpStatus(error),
    fallback: ATTENDANCE_RECORDING_NOT_OPEN_MESSAGE,
  })
}

export function isAttendanceRecordingNotOpenError(error: unknown): boolean {
  return formatAttendanceRecordingNotOpenMessage(error) != null
}
