import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_CERTIFICATE_ISSUANCE_PERIOD_EXPIRED_MESSAGE,
  ACTIVITY_CERTIFICATE_NO_COMPLETED_SCHEDULE_MESSAGE,
  activityCertificateBlockMessage,
  activityCertificateBlockMessageFromError,
} from './activity-certificate-issue-block'

describe('activityCertificateBlockMessage (기획 회신 261113 #2-2)', () => {
  it('발급 가능하거나 응답이 없으면 막지 않는다', () => {
    expect(activityCertificateBlockMessage({ eligible: true, blockingReasons: [] })).toBeNull()
    expect(activityCertificateBlockMessage(undefined)).toBeNull()
  })

  it('3년 경과 → 확정 문구', () => {
    expect(
      activityCertificateBlockMessage({
        eligible: false,
        blockingReasons: ['ISSUANCE_PERIOD_EXPIRED'],
      })
    ).toBe(ACTIVITY_CERTIFICATE_ISSUANCE_PERIOD_EXPIRED_MESSAGE)
  })

  it('진행 완료된 활동 일정 없음 → 확정 문구 (reasonCode만 와도)', () => {
    expect(
      activityCertificateBlockMessage({ eligible: false, reasonCode: 'ACTIVITY_NOT_COMPLETED' })
    ).toBe(ACTIVITY_CERTIFICATE_NO_COMPLETED_SCHEDULE_MESSAGE)
  })

  it('확정 문구가 없는 사유는 공통 증명서 문구 — 수료증 전용 문구를 쓰지 않는다', () => {
    const message = activityCertificateBlockMessage({
      eligible: false,
      blockingReasons: ['ATTENDANCE_NOT_COMPLETED'],
    })
    expect(message).toBe('증명서 발급 요건을 충족하지 않았습니다.')
    expect(message).not.toContain('수료')
  })
})

describe('activityCertificateBlockMessageFromError', () => {
  it('발급 API 409 오류 코드를 확정 문구로 바꾼다', () => {
    const error = {
      response: {
        status: 409,
        data: { success: false, error: { code: 'ISSUANCE_PERIOD_EXPIRED', message: 'x' } },
      },
    }
    expect(activityCertificateBlockMessageFromError(error)).toBe(
      ACTIVITY_CERTIFICATE_ISSUANCE_PERIOD_EXPIRED_MESSAGE
    )
  })

  it('그 밖의 오류는 null (기존 오류 처리)', () => {
    expect(activityCertificateBlockMessageFromError(new Error('network'))).toBeNull()
    expect(
      activityCertificateBlockMessageFromError({
        response: { status: 500, data: { error: { code: 'INTERNAL_SERVER_ERROR' } } },
      })
    ).toBeNull()
  })
})
