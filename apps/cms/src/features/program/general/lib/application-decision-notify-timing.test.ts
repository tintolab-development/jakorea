import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
  toFlatDecisionNotifyTiming,
  toOrganizationApproveNotifyTiming,
  toTrainedTeacherApproveNotifyTiming,
  toInterviewAssignNotifyFields,
  toNestedDecisionNotification,
  toScreeningNotifyFields,
} from './application-decision-notify-timing'

const scheduled = dayjs('2026-10-20T09:00:00+09:00')

describe('toFlatDecisionNotifyTiming', () => {
  it('직접설정만 SCHEDULED + scheduledAt을 반환한다', () => {
    expect(toFlatDecisionNotifyTiming('manual', scheduled)).toEqual({
      timing: 'SCHEDULED',
      scheduledAt: scheduled.toISOString(),
    })
  })

  it('즉시·발표일은 생략한다', () => {
    expect(toFlatDecisionNotifyTiming('immediate')).toBeUndefined()
    expect(toFlatDecisionNotifyTiming('on_announcement')).toBeUndefined()
  })

  it('시각이 없으면 생략한다', () => {
    expect(toFlatDecisionNotifyTiming('manual')).toBeUndefined()
  })
})

describe('toOrganizationApproveNotifyTiming', () => {
  it('즉시 승인에는 IMMEDIATE를 명시한다', () => {
    expect(toOrganizationApproveNotifyTiming('immediate')).toEqual({ timing: 'IMMEDIATE' })
  })

  it('예약 승인에는 SCHEDULED와 scheduledAt을 보낸다', () => {
    expect(toOrganizationApproveNotifyTiming('manual', scheduled)).toEqual({
      timing: 'SCHEDULED',
      scheduledAt: scheduled.toISOString(),
    })
  })
})

describe('toTrainedTeacherApproveNotifyTiming', () => {
  it('발표일 알림을 ON_ANNOUNCEMENT로 전달한다', () => {
    expect(toTrainedTeacherApproveNotifyTiming('on_announcement')).toEqual({
      timing: 'ON_ANNOUNCEMENT',
    })
  })

  it('직접 설정은 SCHEDULED로 전달한다', () => {
    expect(toTrainedTeacherApproveNotifyTiming('manual', scheduled)).toEqual({
      timing: 'SCHEDULED',
      scheduledAt: scheduled.toISOString(),
    })
  })
})

describe('toNestedDecisionNotification', () => {
  it('직접설정을 notification 객체로 감싼다', () => {
    expect(toNestedDecisionNotification('manual', scheduled)).toEqual({
      notification: {
        timing: 'SCHEDULED',
        scheduledAt: scheduled.toISOString(),
      },
    })
  })

  it('즉시 발송은 IMMEDIATE를 명시한다', () => {
    expect(toNestedDecisionNotification('immediate')).toEqual({
      notification: { timing: 'IMMEDIATE' },
    })
  })

  it('발표일 발송은 ON_ANNOUNCEMENT를 명시한다', () => {
    expect(toNestedDecisionNotification('on_announcement')).toEqual({
      notification: { timing: 'ON_ANNOUNCEMENT' },
    })
  })
})

describe('toScreeningNotifyFields', () => {
  it('즉시·발표일에는 scheduledAt을 붙이지 않는다', () => {
    expect(toScreeningNotifyFields('immediate')).toEqual({ notifyTiming: 'IMMEDIATE' })
    expect(toScreeningNotifyFields('on_announcement', scheduled)).toEqual({
      notifyTiming: 'ON_ANNOUNCEMENT',
    })
  })

  it('직접설정은 MANUAL + scheduledAt이다', () => {
    expect(toScreeningNotifyFields('manual', scheduled)).toEqual({
      notifyTiming: 'MANUAL',
      scheduledAt: scheduled.toISOString(),
    })
  })
})

describe('toInterviewAssignNotifyFields', () => {
  it('면접 배정 직접설정만 scheduledAt을 붙인다', () => {
    expect(toInterviewAssignNotifyFields('manual', scheduled)).toEqual({
      notifyTiming: 'MANUAL',
      scheduledAt: scheduled.toISOString(),
    })
    expect(toInterviewAssignNotifyFields('immediate')).toEqual({ notifyTiming: 'IMMEDIATE' })
  })
})
