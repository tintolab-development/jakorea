import { describe, expect, it } from 'vitest'
import {
  ATTENDANCE_RECORDING_NOT_OPEN_MESSAGE,
  formatAttendanceRecordingNotOpenMessage,
} from './attendance-recording-not-open'

describe('attendance-recording-not-open', () => {
  it('returns UI message for 409 ATTENDANCE_RECORDING_NOT_OPEN', () => {
    const error = {
      response: {
        status: 409,
        data: {
          success: false,
          error: { code: 'ATTENDANCE_RECORDING_NOT_OPEN' },
          message: ATTENDANCE_RECORDING_NOT_OPEN_MESSAGE,
        },
      },
    }
    expect(formatAttendanceRecordingNotOpenMessage(error)).toBe(
      ATTENDANCE_RECORDING_NOT_OPEN_MESSAGE
    )
  })

  it('returns null for other API errors', () => {
    expect(formatAttendanceRecordingNotOpenMessage(new Error('network'))).toBeNull()
    expect(
      formatAttendanceRecordingNotOpenMessage({
        response: { data: { error: { code: 'OTHER' } } },
      })
    ).toBeNull()
  })
})
