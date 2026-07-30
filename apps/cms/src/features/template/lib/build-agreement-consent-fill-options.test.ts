import { describe, expect, it } from 'vitest'
import { PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS } from '@/features/template/ui/form-set/payment-statement-pre-consent/paragraph-config'
import { PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'
import {
  buildAgreementConsentFillParagraphBodyOptions,
  resolveAgreementConsentFillInteractionMode,
} from '@/features/template/lib/build-agreement-consent-fill-options'

const agreementConfig = {
  initialDraft: {
    schemaVersion: 1 as const,
    formSettings: { titleNumbering: 'none' as const },
    paragraphs: [],
  },
  modalTitle: '지급조서 사전 동의서',
  structureLockedParagraphIds: PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS,
  paragraphBodyOptions: PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS,
}

describe('resolveAgreementConsentFillInteractionMode', () => {
  it('returns preview (read-only body) for member-management consent fill', () => {
    expect(resolveAgreementConsentFillInteractionMode()).toBe('preview')
    expect(resolveAgreementConsentFillInteractionMode('agreement-portrait')).toBe('preview')
    expect(resolveAgreementConsentFillInteractionMode('agreement-third-party')).toBe('preview')
  })
})

describe('buildAgreementConsentFillParagraphBodyOptions', () => {
  it('enables admin proxy confirm for payment statement with participant name', () => {
    const options = buildAgreementConsentFillParagraphBodyOptions(agreementConfig, {
      templateId: 'agreement-third-party',
      participantName: '홍길동',
    })

    expect(options?.paymentStatementBasicInfoValues).toEqual(
      PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS.paymentStatementBasicInfoValues
    )
    expect(options?.paragraphInteractionMode).toBe('preview')
    expect(options?.agreementSystemDisplayMode).toBe('write')
    expect(options?.agreementSystemParticipantName).toBe('홍길동')
    expect(options?.paymentStatementDisplayMode).toBe('document')
    expect(options?.agreementAdminProxyConfirm).toBe(true)
    expect(options?.hiddenParagraphIds).toEqual(
      new Set([
        PAYMENT_STATEMENT_PRE_CONSENT_IDS.midDate,
        PAYMENT_STATEMENT_PRE_CONSENT_IDS.midSignature,
        PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailDate,
        PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailSignature,
        PAYMENT_STATEMENT_PRE_CONSENT_IDS.closingRecipient,
      ])
    )
  })

  it('uses write(user) mode for portrait consent', () => {
    const portraitConfig = {
      ...agreementConfig,
      paragraphBodyOptions: undefined,
    }
    const options = buildAgreementConsentFillParagraphBodyOptions(portraitConfig, {
      templateId: 'agreement-portrait',
      participantName: '김철수',
    })

    expect(options?.paragraphInteractionMode).toBe('preview')
    expect(options?.agreementSystemParticipantName).toBe('김철수')
    expect(options?.portraitConsentResponseFieldsInteractive).toBe(true)
    expect(options?.agreementAdminProxyConfirm).toBe(true)
    expect(options?.hiddenParagraphIds).toEqual(
      new Set(['agreement-portrait-system-date', 'agreement-portrait-system-signature'])
    )
  })

  it('keeps admin proxy confirm for payment statement even without participant name', () => {
    const options = buildAgreementConsentFillParagraphBodyOptions(agreementConfig, {
      templateId: 'agreement-third-party',
    })

    expect(options?.agreementAdminProxyConfirm).toBe(true)
    expect(options?.agreementSystemParticipantName).toBe('홍길동')
    expect(options?.hiddenParagraphIds).toEqual(
      PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS.hiddenParagraphIds
    )
  })

  it('skips admin proxy confirm layout for portrait when participant name is missing', () => {
    const portraitConfig = {
      ...agreementConfig,
      paragraphBodyOptions: undefined,
    }
    const options = buildAgreementConsentFillParagraphBodyOptions(portraitConfig, {
      templateId: 'agreement-portrait',
    })

    expect(options?.agreementAdminProxyConfirm).toBeUndefined()
    expect(options?.hiddenParagraphIds).toBeUndefined()
  })

  it('returns undefined when agreement config is missing', () => {
    expect(buildAgreementConsentFillParagraphBodyOptions(null)).toBeUndefined()
  })
})
