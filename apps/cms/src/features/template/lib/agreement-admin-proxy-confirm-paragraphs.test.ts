import { describe, expect, it } from 'vitest'
import {
  isSubmittedAgreementA4SignaturePreview,
  resolveAgreementA4DocumentHiddenParagraphIds,
  shouldFlattenAgreementAdminProxyConfirmInA4Preview,
} from '@/features/template/lib/agreement-admin-proxy-confirm-paragraphs'
import { PAYMENT_STATEMENT_PRE_CONSENT_A4_PREVIEW_BODY_CLASS_NAME } from '@/features/template/model/payment-statement-pre-consent-a4-preview'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'
import { AGREEMENT_EXPENSE_A4_PREVIEW_BODY_CLASS_NAME } from '@/features/template/model/agreement-expense-a4-preview'
import { AGREEMENT_NOTICE_A4_PREVIEW_BODY_CLASS_NAME } from '@/features/template/model/agreement-notice-a4-preview'
import { AGREEMENT_PORTRAIT_A4_PREVIEW_BODY_CLASS_NAME } from '@/features/template/model/agreement-portrait-a4-preview'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
} from '@/features/template/model/writing-form-draft.schema'

describe('shouldFlattenAgreementAdminProxyConfirmInA4Preview', () => {
  it('flattens when proxy confirm is already off', () => {
    expect(
      shouldFlattenAgreementAdminProxyConfirmInA4Preview({
        agreementAdminProxyConfirm: false,
      })
    ).toBe(true)
  })

  it('flattens payment-statement A4 preview even when proxy confirm is on', () => {
    expect(
      shouldFlattenAgreementAdminProxyConfirmInA4Preview({
        agreementAdminProxyConfirm: true,
        documentPreviewClassName: PAYMENT_STATEMENT_PRE_CONSENT_A4_PREVIEW_BODY_CLASS_NAME,
      })
    ).toBe(true)
  })

  it('flattens educator-facilitator pledge A4 preview even when proxy confirm is on', () => {
    expect(
      shouldFlattenAgreementAdminProxyConfirmInA4Preview({
        agreementAdminProxyConfirm: true,
        documentPreviewClassName: AGREEMENT_EXPENSE_A4_PREVIEW_BODY_CLASS_NAME,
      })
    ).toBe(true)
  })

  it('flattens agreement-notice A4 preview even when proxy confirm is on', () => {
    expect(
      shouldFlattenAgreementAdminProxyConfirmInA4Preview({
        agreementAdminProxyConfirm: true,
        documentPreviewClassName: AGREEMENT_NOTICE_A4_PREVIEW_BODY_CLASS_NAME,
      })
    ).toBe(true)
  })

  it('flattens agreement-portrait A4 preview even when proxy confirm is on', () => {
    expect(
      shouldFlattenAgreementAdminProxyConfirmInA4Preview({
        agreementAdminProxyConfirm: true,
        documentPreviewClassName: AGREEMENT_PORTRAIT_A4_PREVIEW_BODY_CLASS_NAME,
      })
    ).toBe(true)
  })
})

describe('resolveAgreementA4DocumentHiddenParagraphIds', () => {
  it('unhides payment-statement mid/tail date and signature', () => {
    const hidden = new Set([
      PAYMENT_STATEMENT_PRE_CONSENT_IDS.midDate,
      PAYMENT_STATEMENT_PRE_CONSENT_IDS.midSignature,
      PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailDate,
      PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailSignature,
      PAYMENT_STATEMENT_PRE_CONSENT_IDS.closingRecipient,
    ])
    const next = resolveAgreementA4DocumentHiddenParagraphIds(hidden)
    expect(next?.has(PAYMENT_STATEMENT_PRE_CONSENT_IDS.closingRecipient)).toBe(true)
    expect(next?.has(PAYMENT_STATEMENT_PRE_CONSENT_IDS.midDate)).toBe(false)
    expect(next?.has(PAYMENT_STATEMENT_PRE_CONSENT_IDS.midSignature)).toBe(false)
    expect(next?.has(PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailDate)).toBe(false)
    expect(next?.has(PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailSignature)).toBe(false)
  })

  it('unhides educator-facilitator pledge system date and signature', () => {
    const hidden = new Set([
      EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.systemDate,
      EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.systemSignature,
    ])
    const next = resolveAgreementA4DocumentHiddenParagraphIds(hidden)
    expect(next).toBeUndefined()
  })

  it('unhides agreement-notice system date and signature', () => {
    const hidden = new Set([
      AGREEMENT_NOTICE_PARAGRAPH_IDS.systemDate,
      AGREEMENT_NOTICE_PARAGRAPH_IDS.systemSignature,
    ])
    const next = resolveAgreementA4DocumentHiddenParagraphIds(hidden)
    expect(next).toBeUndefined()
  })

  it('unhides agreement-portrait system date and signature', () => {
    const hidden = new Set([
      AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemDate,
      AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemSignature,
    ])
    const next = resolveAgreementA4DocumentHiddenParagraphIds(hidden)
    expect(next).toBeUndefined()
  })
})

describe('isSubmittedAgreementA4SignaturePreview', () => {
  it('treats saved date, signature, or document mode as submitted', () => {
    expect(isSubmittedAgreementA4SignaturePreview({ agreementSystemNow: new Date() })).toBe(true)
    expect(
      isSubmittedAgreementA4SignaturePreview({
        agreementSystemSignatureImageSrc: 'blob:sig',
      })
    ).toBe(true)
    expect(
      isSubmittedAgreementA4SignaturePreview({ agreementSystemDisplayMode: 'document' })
    ).toBe(true)
    expect(isSubmittedAgreementA4SignaturePreview({})).toBe(false)
  })
})
