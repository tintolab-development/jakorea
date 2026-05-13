import { PAYMENT_STATEMENT_BASIC_INFO_SAMPLE_VALUES } from '@/features/template/model/payment-statement-basic-info-sample'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

export const PAYMENT_STATEMENT_PRE_CONSENT_HIDDEN_DRAG_HANDLE_IDS = new Set<string>([
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.title,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.midConsentLine,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.midDate,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.midSignature,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.finalConfirm,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailDate,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.tailSignature,
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.closingRecipient,
])

export const PAYMENT_STATEMENT_PRE_CONSENT_PARAGRAPH_BODY_OPTIONS = {
  paymentStatementBasicInfoValues: PAYMENT_STATEMENT_BASIC_INFO_SAMPLE_VALUES,
  paymentStatementBasicInfoOnlyPaymentPurposeLocked: true,
} satisfies RenderFormParagraphBodyOptions
