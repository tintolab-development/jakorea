import { describe, expect, it } from 'vitest'
import {
  formatApplicationEligibilityConflictMessage,
  parseMissingEligibilityRequirements,
} from './application-eligibility-conflict'

function conflictError(details: Record<string, string>, code = 'APPLICATION_DECISION_CONFLICT') {
  return {
    response: {
      status: 409,
      data: {
        success: false,
        message: '초상권 동의 완료 후 프로그램 참여 승인이 가능합니다.',
        error: { code, field: 'status', details },
      },
    },
  }
}

describe('parseMissingEligibilityRequirements', () => {
  it('missingRequirements 전체를 순서대로 반환한다', () => {
    expect(
      parseMissingEligibilityRequirements({
        reason: 'PORTRAIT_RIGHTS_CONSENT_REQUIRED',
        missingRequirements: 'PORTRAIT_RIGHTS_CONSENT_REQUIRED,EXTERNAL_1365_ID_REQUIRED',
      })
    ).toEqual(['PORTRAIT_RIGHTS_CONSENT_REQUIRED', 'EXTERNAL_1365_ID_REQUIRED'])
  })

  it('구버전 서버는 reason만 사용한다', () => {
    expect(parseMissingEligibilityRequirements({ reason: 'EXTERNAL_1365_ID_REQUIRED' })).toEqual([
      'EXTERNAL_1365_ID_REQUIRED',
    ])
  })
})

describe('formatApplicationEligibilityConflictMessage', () => {
  it('철회된 초상권 동의는 재동의 안내와 날짜를 보여준다', () => {
    const message = formatApplicationEligibilityConflictMessage(
      conflictError({
        reason: 'PORTRAIT_RIGHTS_CONSENT_REQUIRED',
        missingRequirements: 'PORTRAIT_RIGHTS_CONSENT_REQUIRED',
        participantType: 'INDIVIDUAL',
        portraitConsentStatus: 'WITHDRAWN',
        portraitConsentAgreedAt: '2026-10-01T03:30:34.489687Z',
        portraitConsentExpiresAt: '2027-10-01T03:30:34.489687Z',
        portraitConsentWithdrawnAt: '2026-10-06T00:52:15.508871Z',
      })
    )
    expect(message).toContain('초상권 동의가 철회되었습니다. 재동의를 요청해 주세요.')
    expect(message).toContain('동의일 2026.10.01, 만료일 2027.10.01, 철회일 2026.10.06')
    expect(message).not.toContain('1365')
  })

  it('봉사 신청에서 두 요건이 모두 빠지면 둘 다 안내한다', () => {
    const message = formatApplicationEligibilityConflictMessage(
      conflictError({
        reason: 'PORTRAIT_RIGHTS_CONSENT_REQUIRED',
        missingRequirements: 'PORTRAIT_RIGHTS_CONSENT_REQUIRED,EXTERNAL_1365_ID_REQUIRED',
        participantType: 'VOLUNTEER',
        portraitConsentStatus: 'NOT_FOUND',
        external1365Provided: 'false',
      })
    )
    expect(message).toContain('초상권 동의 이력이 없습니다.')
    expect(message).toContain('1365 ID가 등록되지 않았습니다.')
  })

  it('약관 개정은 동의·현행 버전을 함께 보여준다', () => {
    const message = formatApplicationEligibilityConflictMessage(
      conflictError({
        reason: 'PORTRAIT_RIGHTS_CONSENT_REQUIRED',
        portraitConsentStatus: 'POLICY_UPDATED',
        portraitConsentTermsVersion: '2025-01',
        portraitConsentCurrentPolicyVersion: '2026-01',
      })
    )
    expect(message).toContain('동의 버전 2025-01, 현행 버전 2026-01')
  })

  it('참여자격과 무관한 409는 null', () => {
    expect(
      formatApplicationEligibilityConflictMessage(conflictError({ reason: 'INVALID_TRANSITION' }))
    ).toBeNull()
    expect(
      formatApplicationEligibilityConflictMessage(
        conflictError({ reason: 'PORTRAIT_RIGHTS_CONSENT_REQUIRED' }, 'OTHER_CONFLICT')
      )
    ).toBeNull()
    expect(formatApplicationEligibilityConflictMessage(new Error('network'))).toBeNull()
  })
})
