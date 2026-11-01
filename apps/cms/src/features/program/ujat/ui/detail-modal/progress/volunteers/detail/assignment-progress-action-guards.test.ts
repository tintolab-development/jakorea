import { describe, expect, it } from 'vitest'
import {
  ASSIGNMENT_CANCEL_NOT_ALLOWED_ALERT,
  ATTENDANCE_CORRECTION_NOT_ALLOWED_SCHEDULED_ALERT,
  ATTENDANCE_CORRECTION_SINGLE_ONLY_ALERT,
  buildAssignmentCancelBulkCompletedAlert,
  isAssignmentCancelableByProgress,
  isAttendanceCorrectableByProgress,
} from './assignment-progress-action-guards'

describe('assignment progress action guards', () => {
  it('배정 취소는 진행 예정만 허용한다', () => {
    expect(isAssignmentCancelableByProgress({ educationProgress: 'scheduled' })).toBe(true)
    expect(isAssignmentCancelableByProgress({ educationProgress: 'completed' })).toBe(false)
    expect(isAssignmentCancelableByProgress({ educationProgress: 'dash' })).toBe(false)
  })

  it('출결 정정은 진행 완료만 허용한다', () => {
    expect(isAttendanceCorrectableByProgress({ educationProgress: 'completed' })).toBe(true)
    expect(isAttendanceCorrectableByProgress({ educationProgress: 'scheduled' })).toBe(false)
    expect(isAttendanceCorrectableByProgress({ educationProgress: 'dash' })).toBe(false)
  })

  it('불가 안내 카피가 Figma와 일치한다', () => {
    expect(ASSIGNMENT_CANCEL_NOT_ALLOWED_ALERT.title).toBe('배정 취소 불가 안내')
    expect(ASSIGNMENT_CANCEL_NOT_ALLOWED_ALERT.content).toContain('이미 진행 완료된 일정입니다.')
    expect(buildAssignmentCancelBulkCompletedAlert(3).content).toContain(
      '선택한 3개의 항목 중 진행 완료된 일정이 있습니다.'
    )
    expect(ATTENDANCE_CORRECTION_NOT_ALLOWED_SCHEDULED_ALERT.title).toBe('출결 정정 불가 안내')
    expect(ATTENDANCE_CORRECTION_SINGLE_ONLY_ALERT.content).toContain(
      '출결 정정은 한 건씩 가능합니다.'
    )
  })
})
