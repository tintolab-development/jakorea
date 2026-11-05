import { describe, expect, it } from 'vitest'
import { RECEIPT_PRE_CONSENT_IDS } from '@/features/template/model/receipt-pre-consent-draft'
import {
  RECEIPT_PRE_CONSENT_A4_PAGE_BREAK_BEFORE_PARAGRAPH_IDS,
  RECEIPT_PRE_CONSENT_A4_PREVIEW_BODY_CLASS_NAME,
} from '@/features/template/model/receipt-pre-consent-a4-preview'

describe('receipt-pre-consent A4 preview', () => {
  it('starts page 2 at the payment confirmation record', () => {
    expect(RECEIPT_PRE_CONSENT_A4_PAGE_BREAK_BEFORE_PARAGRAPH_IDS).toEqual(
      new Set([RECEIPT_PRE_CONSENT_IDS.paymentRecord])
    )
  })

  it('scopes document preview CSS to the receipt-pre-consent body class', () => {
    expect(RECEIPT_PRE_CONSENT_A4_PREVIEW_BODY_CLASS_NAME).toBe(
      'form-document-preview-body--payment-pre-consent'
    )
  })
})
