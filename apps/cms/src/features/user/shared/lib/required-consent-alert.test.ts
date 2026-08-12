import { describe, expect, it } from 'vitest'
import {
  REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
  buildRequiredConsentDisagreeAlertMessage,
  collectDisagreedRequiredConsentLabels,
  hasUnsetConsentSelections,
} from '@jakorea/domain/shared/required-consent-alert'

describe('required-consent-alert', () => {
  it('제목 상수를 제공한다', () => {
    expect(REQUIRED_CONSENT_DISAGREE_ALERT_TITLE).toBe('필수 동의 항목 안내')
  })

  it('단건 미동의 메시지를 만든다', () => {
    expect(buildRequiredConsentDisagreeAlertMessage(['서비스 이용약관'])).toBe(
      '서비스 이용약관에 동의하지 않을 경우, 가입이 불가합니다.'
    )
  })

  it('다건 미동의 메시지를 쉼표로 나열한다', () => {
    expect(
      buildRequiredConsentDisagreeAlertMessage([
        '서비스 이용약관',
        '개인정보 수집·이용 동의',
        '2단계 인증(MFA) 설정 동의',
      ])
    ).toBe(
      '서비스 이용약관, 개인정보 수집·이용 동의, 2단계 인증(MFA) 설정 동의에 동의하지 않을 경우, 가입이 불가합니다.'
    )
  })

  it('동의하지 않은 필수 항목 라벨만 수집한다', () => {
    const labels = collectDisagreedRequiredConsentLabels(
      {
        consentTermsOfService: 'agree',
        consentPersonalInfo: 'disagree',
        consentMfaSetup: undefined,
      },
      [
        { key: 'consentTermsOfService', label: '서비스 이용약관' },
        { key: 'consentPersonalInfo', label: '개인정보 수집·이용 동의' },
        { key: 'consentMfaSetup', label: '2단계 인증(MFA) 설정 동의' },
      ]
    )
    expect(labels).toEqual(['개인정보 수집·이용 동의'])
  })

  it('미선택 항목은 미동의 라벨 수집에서 제외한다', () => {
    expect(
      hasUnsetConsentSelections(
        {
          consentTermsOfService: undefined,
          consentPersonalInfo: 'disagree',
        },
        ['consentTermsOfService', 'consentPersonalInfo'] as const
      )
    ).toBe(true)

    expect(
      hasUnsetConsentSelections(
        {
          consentTermsOfService: 'agree',
          consentPersonalInfo: 'disagree',
        },
        ['consentTermsOfService', 'consentPersonalInfo'] as const
      )
    ).toBe(false)
  })
})
