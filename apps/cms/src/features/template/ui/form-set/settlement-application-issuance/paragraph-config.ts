import { LECTURE_FEE_CALCULATION_SAMPLE_VALUES } from '@/features/template/model/lecture-fee-calculation-sample'
import { PAYMENT_STATEMENT_BASIC_INFO_SAMPLE_VALUES } from '@/features/template/model/payment-statement-basic-info-sample'
import { SETTLEMENT_APPLICATION_ISSUANCE_IDS } from '@/features/template/model/settlement-application-issuance-draft'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/render-form-paragraph-body'

export const SETTLEMENT_APPLICATION_ISSUANCE_HIDDEN_DRAG_HANDLE_IDS = new Set<string>([
  SETTLEMENT_APPLICATION_ISSUANCE_IDS.title,
])

export const SETTLEMENT_APPLICATION_ISSUANCE_PARAGRAPH_BODY_OPTIONS = {
  paymentStatementBasicInfoValues: PAYMENT_STATEMENT_BASIC_INFO_SAMPLE_VALUES,
  lectureFeeCalculationValues: LECTURE_FEE_CALCULATION_SAMPLE_VALUES,
} satisfies RenderFormParagraphBodyOptions
