import { describe, expect, it } from 'vitest'
import { PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS } from '@/features/template/ui/form-set/payment-statement-pre-consent/paragraph-config'
import { AGREEMENT_PORTRAIT_PARAGRAPH_BODY_OPTIONS } from '@/features/template/ui/form-set/agreement-portrait/paragraph-config'
import { AGREEMENT_NOTICE_PARAGRAPH_BODY_OPTIONS } from '@/features/template/ui/form-set/agreement-notice/paragraph-config'
import { EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_BODY_OPTIONS } from '@/features/template/ui/form-set/agreement-expense/paragraph-config'
import { PAYMENT_STATEMENT_PRE_CONSENT_SEED_PARAGRAPH_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'
import { EDUCATOR_FACILITATOR_PLEDGE_SEED_PARAGRAPH_IDS } from '@/features/template/model/writing-form-draft.schema'
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

const portraitConfig = {
  ...agreementConfig,
  modalTitle: '초상권 수집/이용 동의',
  paragraphBodyOptions: AGREEMENT_PORTRAIT_PARAGRAPH_BODY_OPTIONS,
}

describe('resolveAgreementConsentFillInteractionMode', () => {
  it('returns user mode for member-management consent fill', () => {
    expect(resolveAgreementConsentFillInteractionMode()).toBe('user')
    expect(resolveAgreementConsentFillInteractionMode('agreement-portrait')).toBe('user')
    expect(resolveAgreementConsentFillInteractionMode('agreement-third-party')).toBe('user')
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
    expect(options?.paragraphInteractionMode).toBe('user')
    expect(options?.agreementConsentFillReadOnlyBody).toBe(true)
    expect(options?.agreementSystemDisplayMode).toBe('write')
    expect(options?.agreementSystemParticipantName).toBe('홍길동')
    expect(options?.paymentStatementBasicInfoOnlyPaymentPurposeLocked).toBe(true)
    expect(options?.paymentStatementDisplayMode).toBeUndefined()
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
    const options = buildAgreementConsentFillParagraphBodyOptions(portraitConfig, {
      templateId: 'agreement-portrait',
      participantName: '김철수',
    })

    expect(options?.paragraphInteractionMode).toBe('user')
    expect(options?.agreementConsentFillReadOnlyBody).toBe(true)
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

  it('keeps admin proxy confirm for portrait even without participant name', () => {
    const options = buildAgreementConsentFillParagraphBodyOptions(portraitConfig, {
      templateId: 'agreement-portrait',
    })

    expect(options?.agreementAdminProxyConfirm).toBe(true)
    expect(options?.agreementSystemParticipantName).toBe('홍길동')
    expect(options?.hiddenParagraphIds).toEqual(
      AGREEMENT_PORTRAIT_PARAGRAPH_BODY_OPTIONS.hiddenParagraphIds
    )
  })

  it('enables admin proxy confirm for agreement-notice', () => {
    const noticeConfig = {
      ...agreementConfig,
      modalTitle: '행정정보 공동이용 사전동의서',
      paragraphBodyOptions: AGREEMENT_NOTICE_PARAGRAPH_BODY_OPTIONS,
    }
    const options = buildAgreementConsentFillParagraphBodyOptions(noticeConfig, {
      templateId: 'agreement-notice',
      participantName: '김철수',
    })

    expect(options?.agreementAdminProxyConfirm).toBe(true)
    expect(options?.agreementSystemParticipantName).toBe('김철수')
    expect(options?.hideSurveyWritingPeriod).toBe(true)
    expect(options?.agreementNoticeIdTypeInteractive).toBe(true)
    expect(options?.agreementNoticeSubjectPrefilledReadOnly).toBe(false)
    expect(options?.agreementConsentFillInteractiveParagraphIds).toEqual(
      new Set([
        'agreement-notice-institution',
        'agreement-notice-purpose',
        'agreement-notice-subject',
      ])
    )
    expect(options?.hiddenParagraphIds).toEqual(
      new Set(['agreement-notice-system-date', 'agreement-notice-system-signature'])
    )
  })

  it('enables admin proxy confirm for educator facilitator pledge', () => {
    const pledgeConfig = {
      ...agreementConfig,
      modalTitle: '교육진행자 동의 서약서',
      structureLockedParagraphIds: EDUCATOR_FACILITATOR_PLEDGE_SEED_PARAGRAPH_IDS,
      paragraphBodyOptions: EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_BODY_OPTIONS,
    }
    const options = buildAgreementConsentFillParagraphBodyOptions(pledgeConfig, {
      templateId: 'agreement-expense',
      participantName: '이영희',
    })

    expect(options?.paragraphInteractionMode).toBe('user')
    expect(options?.agreementConsentFillReadOnlyBody).toBe(true)
    expect(options?.agreementSystemParticipantName).toBe('이영희')
    expect(options?.agreementAdminProxyConfirm).toBe(true)
    expect(options?.structureLockedAuthoringChoicePreview).toBe(true)
    expect(options?.hiddenParagraphIds).toEqual(
      new Set([
        'agreement-expense-pledge-system-date',
        'agreement-expense-pledge-system-signature',
      ])
    )
  })

  it('returns undefined when agreement config is missing', () => {
    expect(buildAgreementConsentFillParagraphBodyOptions(null)).toBeUndefined()
  })
})
