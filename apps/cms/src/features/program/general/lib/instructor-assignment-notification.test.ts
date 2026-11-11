import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { UnsupportedNotifyTimingError } from '@/shared/lib/notify-timing-capability'
import {
  formatInstructorAssignmentAnnouncementDateMessage,
  INSTRUCTOR_ASSIGNMENT_ANNOUNCEMENT_DATE_REQUIRED_MESSAGE,
  isInstructorAssignmentConflictError,
  isInstructorAssignmentNotificationSent,
  isInstructorUnassignReasonRequiredError,
  resolveInstructorUnassignNotificationSent,
  toInstructorAssignmentCreateNotifyTiming,
  toInstructorUnassignCancelBody,
} from './instructor-assignment-notification'

function apiError(status: number, code: string) {
  return { response: { status, data: { success: false, error: { code, message: 'x' } } } }
}

describe('강사 배정 취소 — 배정 알림 발송 전/후 (BE 항목 1-A)', () => {
  it('SENT만 발송 후, NONE·SCHEDULED·CANCELLED는 발송 전, 필드 없음은 미상', () => {
    expect(isInstructorAssignmentNotificationSent('SENT')).toBe(true)
    expect(isInstructorAssignmentNotificationSent('NONE')).toBe(false)
    expect(isInstructorAssignmentNotificationSent('SCHEDULED')).toBe(false)
    expect(isInstructorAssignmentNotificationSent('CANCELLED')).toBe(false)
    expect(isInstructorAssignmentNotificationSent(undefined)).toBeUndefined()
  })

  it('선택 배정 중 하나라도 발송 후면 발송 후, 미상이 섞이면 미상(기존 발송 후 시안)', () => {
    expect(resolveInstructorUnassignNotificationSent([false, false])).toBe(false)
    expect(resolveInstructorUnassignNotificationSent([false, true])).toBe(true)
    expect(resolveInstructorUnassignNotificationSent([false, undefined])).toBeUndefined()
    expect(resolveInstructorUnassignNotificationSent([])).toBeUndefined()
  })

  it('발송 전 body는 {}, 발송 후는 reason·timing(즉시면 scheduledAt 없음), faultParty 미전송', () => {
    const payload = { reason: '강사 일정 변경', notifyTiming: 'immediate' as const }
    expect(toInstructorUnassignCancelBody(payload, false)).toEqual({})
    expect(toInstructorUnassignCancelBody(payload, true)).toEqual({
      reason: '강사 일정 변경',
      timing: 'IMMEDIATE',
    })
    expect(toInstructorUnassignCancelBody(payload, undefined)).toEqual({
      reason: '강사 일정 변경',
      timing: 'IMMEDIATE',
    })
    const at = dayjs('2026-11-20T09:00:00+09:00')
    expect(
      toInstructorUnassignCancelBody(
        { reason: '강사 일정 변경', notifyTiming: 'manual', manualNotifyAt: at },
        true
      )
    ).toEqual({ reason: '강사 일정 변경', timing: 'SCHEDULED', scheduledAt: at.toISOString() })
  })

  it('400 VALIDATION_FAILED·409 INSTRUCTOR_ASSIGNMENT_CONFLICT 판별', () => {
    expect(isInstructorUnassignReasonRequiredError(apiError(400, 'VALIDATION_FAILED'))).toBe(true)
    expect(
      isInstructorUnassignReasonRequiredError(apiError(400, 'INVALID_NOTIFICATION_SCHEDULE'))
    ).toBe(false)
    expect(
      isInstructorAssignmentConflictError(apiError(409, 'INSTRUCTOR_ASSIGNMENT_CONFLICT'))
    ).toBe(true)
  })
})

describe('강사 배정 생성 — 발표일에 맞춰서 (BE 항목 2)', () => {
  it('일반: 발표일은 ON_ANNOUNCEMENT만(scheduledAt 미전송), 즉시는 생략, 직접 설정은 SCHEDULED', () => {
    expect(
      toInstructorAssignmentCreateNotifyTiming('on_announcement', dayjs(), {
        allowOnAnnouncement: true,
      })
    ).toEqual({ timing: 'ON_ANNOUNCEMENT' })
    expect(
      toInstructorAssignmentCreateNotifyTiming('immediate', null, { allowOnAnnouncement: true })
    ).toBeUndefined()
    const scheduled = toInstructorAssignmentCreateNotifyTiming(
      'manual',
      dayjs('2026-11-20T09:00:00+09:00'),
      { allowOnAnnouncement: true }
    )
    expect(scheduled).toEqual({ timing: 'SCHEDULED', scheduledAt: '2026-11-20T09:00:00+09:00' })
  })

  it('1사1교 등(allowOnAnnouncement=false)은 기존처럼 발표일을 막는다', () => {
    expect(() =>
      toInstructorAssignmentCreateNotifyTiming('on_announcement', null, {
        allowOnAnnouncement: false,
      })
    ).toThrow(UnsupportedNotifyTimingError)
  })

  it('409 APPLICATION_ANNOUNCEMENT_DATE_NOT_CONFIGURED → 「프로그램 발표일을 먼저 설정해 주세요」', () => {
    expect(
      formatInstructorAssignmentAnnouncementDateMessage(
        apiError(409, 'APPLICATION_ANNOUNCEMENT_DATE_NOT_CONFIGURED')
      )
    ).toBe(INSTRUCTOR_ASSIGNMENT_ANNOUNCEMENT_DATE_REQUIRED_MESSAGE)
    expect(
      formatInstructorAssignmentAnnouncementDateMessage(apiError(400, 'VALIDATION_FAILED'))
    ).toBeNull()
  })
})
