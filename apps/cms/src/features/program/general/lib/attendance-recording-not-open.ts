import { extractApiErrorCode } from '@/shared/lib/extract-api-error-message'

export const ATTENDANCE_RECORDING_NOT_OPEN_CODE = 'ATTENDANCE_RECORDING_NOT_OPEN'

/** PUT schedule attendances 409 — 일정 시작 전. 안내 문구는 노출하지 않는다. */
export function isAttendanceRecordingNotOpenError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('response' in error)) return false
  const data = (error as { response?: { data?: unknown } }).response?.data
  return extractApiErrorCode(data) === ATTENDANCE_RECORDING_NOT_OPEN_CODE
}
