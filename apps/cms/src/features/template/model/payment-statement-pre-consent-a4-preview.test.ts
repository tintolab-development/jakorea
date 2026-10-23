import { describe, expect, it } from 'vitest'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'
import {
  PAYMENT_STATEMENT_PRE_CONSENT_A4_PAGE_BREAK_BEFORE_PARAGRAPH_IDS,
  PAYMENT_STATEMENT_PRE_CONSENT_A4_PREVIEW_BODY_CLASS_NAME,
} from '@/features/template/model/payment-statement-pre-consent-a4-preview'

describe('payment-statement-pre-consent A4 preview', () => {
  it('starts page 2 at the payment record, not the mid consent line', () => {
    expect(PAYMENT_STATEMENT_PRE_CONSENT_A4_PAGE_BREAK_BEFORE_PARAGRAPH_IDS).toEqual(
      new Set([PAYMENT_STATEMENT_PRE_CONSENT_IDS.paymentRecord])
    )
    expect(
      PAYMENT_STATEMENT_PRE_CONSENT_A4_PAGE_BREAK_BEFORE_PARAGRAPH_IDS.has(
        PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine
      )
    ).toBe(false)
  })

  it('scopes document preview CSS to the payment-pre-consent body class', () => {
    expect(PAYMENT_STATEMENT_PRE_CONSENT_A4_PREVIEW_BODY_CLASS_NAME).toBe(
      'form-document-preview-body--payment-pre-consent'
    )
  })
})
