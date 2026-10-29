import { describe, expect, it } from 'vitest'
import {
  formatGeminiOrganizationApplicationDecisionError,
  toGeminiOrganizationApplicationApproveBody,
} from './organization-application-approve'

function axiosError(code: string, message: string, status = 409) {
  return {
    response: {
      status,
      data: {
        success: false,
        message,
        error: { code, field: 'status', message },
      },
    },
  }
}

describe('toGeminiOrganizationApplicationApproveBody', () => {
  it('즉시 발송은 빈 body 로 IMMEDIATE 를 생략한다', () => {
    expect(toGeminiOrganizationApplicationApproveBody()).toEqual({})
    expect(toGeminiOrganizationApplicationApproveBody({ timing: 'IMMEDIATE' })).toEqual({})
  })

  it('알림 직접 설정은 SCHEDULED + scheduledAt 이고 DIRECT 를 쓰지 않는다', () => {
    expect(
      toGeminiOrganizationApplicationApproveBody({
        timing: 'SCHEDULED',
        scheduledAt: '2026-10-29T03:00:00.000Z',
      })
    ).toEqual({
      timing: 'SCHEDULED',
      scheduledAt: '2026-10-29T03:00:00.000Z',
    })
    expect(
      JSON.stringify(
        toGeminiOrganizationApplicationApproveBody({
          timing: 'SCHEDULED',
          scheduledAt: '2026-10-29T03:00:00.000Z',
        })
      )
    ).not.toContain('DIRECT')
  })

  it('발표일은 ON_ANNOUNCEMENT 만 보내고 scheduledAt 을 넣지 않는다', () => {
    expect(
      toGeminiOrganizationApplicationApproveBody({
        timing: 'ON_ANNOUNCEMENT',
        scheduledAt: '2026-10-29T03:00:00.000Z',
      })
    ).toEqual({ timing: 'ON_ANNOUNCEMENT' })
  })

  it('preferredScheduleRank 를 body 에 넣지 않는다', () => {
    const body = toGeminiOrganizationApplicationApproveBody({
      timing: 'IMMEDIATE',
    })
    expect(body).not.toHaveProperty('preferredScheduleRank')
    expect(body).not.toHaveProperty('selectedScheduleId')
    expect(body).not.toHaveProperty('requestedScheduleId')
    expect(body).not.toHaveProperty('slots')
  })
})

describe('formatGeminiOrganizationApplicationDecisionError', () => {
  it('REJECTED 가 아닌 종료 상태 409 는 상태 충돌 메시지를 쓴다', () => {
    expect(
      formatGeminiOrganizationApplicationDecisionError(
        axiosError(
          'APPLICATION_DECISION_CONFLICT',
          '현재 신청 상태에서는 승인·반려·취소 처리를 수행할 수 없습니다.'
        )
      )
    ).toBe('현재 신청 상태에서는 승인·반려·취소 처리를 수행할 수 없습니다.')
  })

  it('INVALID_NOTIFICATION_SCHEDULE 은 예약 일시 안내로 구분한다', () => {
    expect(
      formatGeminiOrganizationApplicationDecisionError(
        axiosError('INVALID_NOTIFICATION_SCHEDULE', 'invalid', 400)
      )
    ).toContain('현재 시각보다 최소 1분 이후')
  })

  it('최소 인원 409 는 상태 충돌과 구분한다', () => {
    expect(
      formatGeminiOrganizationApplicationDecisionError(
        axiosError('GEMINI_MINIMUM_PARTICIPANTS_NOT_MET', '최소 인원을 충족하지 않았습니다.')
      )
    ).toBe('최소 인원을 충족하지 않았습니다.')
  })
})
