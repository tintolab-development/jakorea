import { describe, expect, it } from 'vitest'
import {
  formatApplicationEligibilityConflictMessage,
  isVolunteer1365ApprovalBlockedFailure,
  parseMissingEligibilityRequirements,
  readVolunteer1365ApprovalBlockedAlert,
  VOLUNTEER_1365_APPROVAL_BLOCKED_ALERT,
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

  it('1365 ID만 없는 봉사자 승인은 승인 불가 안내를 쓴다', () => {
    expect(
      readVolunteer1365ApprovalBlockedAlert(
        conflictError({
          external1365Provided: 'false',
          memberId: '190109',
          missingRequirements: 'EXTERNAL_1365_ID_REQUIRED',
          programId: '186550',
          participantType: 'VOLUNTEER',
          reason: 'EXTERNAL_1365_ID_REQUIRED',
        })
      )
    ).toEqual(VOLUNTEER_1365_APPROVAL_BLOCKED_ALERT)
    expect(VOLUNTEER_1365_APPROVAL_BLOCKED_ALERT).toEqual({
      title: '봉사자 신청 승인 불가 안내',
      content:
        '1365 ID가 등록되지 않은 봉사 신청자는\n프로그램 신청 승인이 불가합니다.',
    })
  })

  it('초상권 미동의가 함께 있으면 1365 전용 안내를 쓰지 않는다', () => {
    expect(
      readVolunteer1365ApprovalBlockedAlert(
        conflictError({
          missingRequirements: 'PORTRAIT_RIGHTS_CONSENT_REQUIRED,EXTERNAL_1365_ID_REQUIRED',
          participantType: 'VOLUNTEER',
          reason: 'PORTRAIT_RIGHTS_CONSENT_REQUIRED',
        })
      )
    ).toBeNull()
  })

  it('일괄 실패 항목은 1365 문구와 코드로 구분한다', () => {
    expect(
      isVolunteer1365ApprovalBlockedFailure({
        code: 'APPLICATION_DECISION_CONFLICT',
        message: '1365 ID 등록 후 봉사 프로그램 참여 승인이 가능합니다.',
      })
    ).toBe(true)
    expect(
      isVolunteer1365ApprovalBlockedFailure({
        code: 'APPLICATION_DECISION_CONFLICT',
        message: '초상권 동의 완료 후 프로그램 참여 승인이 가능합니다.',
      })
    ).toBe(false)
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
