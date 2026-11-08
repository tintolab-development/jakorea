import { describe, expect, it } from 'vitest'
import {
  REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
  buildRequiredConsentDisagreeAlertMessage,
  collectDisagreedRequiredConsentLabels,
  EXPIRED_CONSENT_DISPLAY_LABEL,
  hasUnsetConsentSelections,
  PARTIAL_CONSENT_DISPLAY_LABEL,
  resolveConsentStatusDisplayLabel,
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

  it('consentStatus PARTIAL은 부분동의로 표시한다', () => {
    expect(
      resolveConsentStatusDisplayLabel({
        agreed: true,
        consentStatus: 'PARTIAL',
        agreedLabel: '동의함',
      })
    ).toBe(PARTIAL_CONSENT_DISPLAY_LABEL)
    expect(
      resolveConsentStatusDisplayLabel({
        agreed: true,
        consentStatus: 'partial',
        agreedLabel: '동의',
      })
    ).toBe('부분 동의')
    expect(
      resolveConsentStatusDisplayLabel({
        agreed: true,
        agreedLabel: '동의함',
      })
    ).toBe('동의함')
  })

  describe('초상권 allItemsAgreed', () => {
    const portrait = (agreed: boolean, allItemsAgreed: boolean | null | undefined) =>
      resolveConsentStatusDisplayLabel({
        agreed,
        consentStatus: 'PARTIAL',
        allItemsAgreed,
        agreedLabel: '동의함',
      })

    it('동의했고 1·2·3 모두 동의(true)면 동의 라벨을 쓴다', () => {
      expect(portrait(true, true)).toBe('동의함')
      expect(
        resolveConsentStatusDisplayLabel({
          agreed: true,
          consentStatus: 'PARTIAL',
          allItemsAgreed: true,
          agreedLabel: '동의',
        })
      ).toBe('동의')
    })

    it('일부 미동의(false)면 부분동의를 유지한다', () => {
      expect(portrait(true, false)).toBe(PARTIAL_CONSENT_DISPLAY_LABEL)
    })

    it('판정 불가(null/누락) 과거 기록은 기존 표시(부분동의)를 유지한다', () => {
      expect(portrait(true, null)).toBe(PARTIAL_CONSENT_DISPLAY_LABEL)
      expect(portrait(true, undefined)).toBe(PARTIAL_CONSENT_DISPLAY_LABEL)
    })

    it('미동의 상태는 allItemsAgreed와 무관하게 기존 표시를 유지한다', () => {
      expect(portrait(false, true)).toBe(PARTIAL_CONSENT_DISPLAY_LABEL)
      expect(
        resolveConsentStatusDisplayLabel({
          agreed: false,
          consentStatus: 'DISAGREED',
          allItemsAgreed: false,
          agreedLabel: '동의함',
        })
      ).toBe('미동의')
    })

    it('비초상권(consentStatus 없음)은 allItemsAgreed를 보지 않는다', () => {
      expect(
        resolveConsentStatusDisplayLabel({
          agreed: true,
          allItemsAgreed: null,
          agreedLabel: '동의함',
        })
      ).toBe('동의함')
      expect(
        resolveConsentStatusDisplayLabel({
          agreed: false,
          allItemsAgreed: null,
          agreedLabel: '동의함',
        })
      ).toBe('미동의')
    })
  })

  describe('동의 만료', () => {
    it('expired이면 동의·부분 동의·미동의보다 「동의 만료」를 우선한다', () => {
      for (const options of [
        { agreed: true },
        { agreed: false },
        { agreed: true, consentStatus: 'PARTIAL', allItemsAgreed: true },
        { agreed: true, consentStatus: 'PARTIAL', allItemsAgreed: false },
        { agreed: false, consentStatus: 'DISAGREED' },
      ]) {
        expect(
          resolveConsentStatusDisplayLabel({ ...options, expired: true, agreedLabel: '동의' })
        ).toBe(EXPIRED_CONSENT_DISPLAY_LABEL)
      }
      expect(EXPIRED_CONSENT_DISPLAY_LABEL).toBe('동의 만료')
    })

    it('expired가 false·누락이면 기존 표시를 유지한다', () => {
      expect(
        resolveConsentStatusDisplayLabel({ agreed: true, expired: false, agreedLabel: '동의' })
      ).toBe('동의')
      expect(resolveConsentStatusDisplayLabel({ agreed: false, agreedLabel: '동의' })).toBe(
        '미동의'
      )
    })
  })
})
