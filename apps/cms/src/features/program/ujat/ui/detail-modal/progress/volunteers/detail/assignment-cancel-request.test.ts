import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { toUjatAssignmentCancelRequest } from './assignment-cancel-request'
import {
  ASSIGNMENT_CANCEL_PENDING_SUCCESS_MESSAGE,
  buildAssignmentCancelNotifiedMessage,
  buildAssignmentCancelNotifiedSuccessMessage,
  buildAssignmentCancelPendingNotifyMessage,
} from './assignment-cancel-copy'
import {
  CANCELLATION_NOTIFICATION_SCHEDULED_AT_INVALID_CODE,
  UJAT_PARTNER_ASSIGNMENT_CONFLICT_CODE,
  UJAT_PARTNER_ASSIGNMENT_EDUCATION_COMPLETED_CODE,
  resolveAssignmentCancelErrorAlert,
} from './assignment-cancel-errors'
import { formatScheduleShortDateLabel } from './volunteer-assign-modal-data'

describe('assignment cancel request / copy', () => {
  it('미발송 취소는 빈 body만 보낸다', () => {
    expect(
      toUjatAssignmentCancelRequest({
        reason: 'ignored',
        includeCancelNotification: false,
      })
    ).toEqual({})
  })

  it('발송 후 취소는 IMMEDIATE/SCHEDULED를 포함한다', () => {
    const at = dayjs('2026-05-08T10:00:00+09:00')
    expect(
      toUjatAssignmentCancelRequest({
        reason: '일정 변경',
        notifyTiming: 'immediate',
        includeCancelNotification: true,
      })
    ).toEqual({
      reason: '일정 변경',
      timing: 'IMMEDIATE',
      scheduledAt: null,
    })
    expect(
      toUjatAssignmentCancelRequest({
        reason: '일정 변경',
        notifyTiming: 'manual',
        manualNotifyAt: at,
        includeCancelNotification: true,
      })
    ).toEqual({
      reason: '일정 변경',
      timing: 'SCHEDULED',
      scheduledAt: at.toISOString(),
    })
  })

  it('날짜 라벨에 요일을 보존한다', () => {
    expect(formatScheduleShortDateLabel('2026.05.08(금)')).toBe('5월 8일(금)')
  })

  it('취소 안내·성공 카피를 만든다', () => {
    expect(buildAssignmentCancelPendingNotifyMessage('김제이', '2026.05.08(금)')).toContain(
      '발송 예정인 배정 알림이 있는 경우 자동으로 취소됩니다.'
    )
    expect(buildAssignmentCancelNotifiedMessage('김제이', '2026.05.08(금)')).toContain(
      '회원에게 취소 사유로 안내되며'
    )
    expect(ASSIGNMENT_CANCEL_PENDING_SUCCESS_MESSAGE).not.toContain('알림')
    expect(buildAssignmentCancelNotifiedSuccessMessage('IMMEDIATE')).toContain('즉시')
    expect(buildAssignmentCancelNotifiedSuccessMessage('SCHEDULED')).toContain('예약')
  })

  it('취소 API 에러 코드를 안내로 매핑한다', () => {
    const completed = resolveAssignmentCancelErrorAlert({
      response: { data: { error: { code: UJAT_PARTNER_ASSIGNMENT_EDUCATION_COMPLETED_CODE } } },
    })
    expect(completed?.shouldRefresh).toBe(true)
    expect(completed?.content).toContain('진행 완료')

    const scheduledAt = resolveAssignmentCancelErrorAlert({
      response: { data: { error: { code: CANCELLATION_NOTIFICATION_SCHEDULED_AT_INVALID_CODE } } },
    })
    expect(scheduledAt?.shouldRefresh).toBe(false)

    const conflict = resolveAssignmentCancelErrorAlert({
      response: { data: { error: { code: UJAT_PARTNER_ASSIGNMENT_CONFLICT_CODE } } },
    })
    expect(conflict?.shouldRefresh).toBe(true)
  })
})
