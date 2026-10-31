import { describe, expect, it } from 'vitest'
import {
  ATTENDANCE_CORRECTION_NOT_OPEN_ALERT,
  isAttendanceRecordingNotOpenError,
} from './attendance-recording-not-open'

describe('attendance-recording-not-open', () => {
  it('detects 409 ATTENDANCE_RECORDING_NOT_OPEN', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          error: { code: 'ATTENDANCE_RECORDING_NOT_OPEN' },
        },
      },
    }
    expect(isAttendanceRecordingNotOpenError(error)).toBe(true)
  })

  it('returns false for other API errors', () => {
    expect(isAttendanceRecordingNotOpenError(new Error('network'))).toBe(false)
    expect(
      isAttendanceRecordingNotOpenError({
        response: { data: { error: { code: 'OTHER' } } },
      })
    ).toBe(false)
  })

  it('uses the blocked-correction copy', () => {
    expect(ATTENDANCE_CORRECTION_NOT_OPEN_ALERT.title).toBe('출결 정정 불가 안내')
    expect(ATTENDANCE_CORRECTION_NOT_OPEN_ALERT.content).toContain(
      '아직 진행 예정인 일정입니다.'
    )
  })
})
