import { LECTURE_FEE_CALCULATION_LINES_SAMPLE } from '@/features/template/model/lecture-fee-calculation-lines-sample'
import { LECTURE_FEE_CALCULATION_SAMPLE_VALUES } from '@/features/template/model/lecture-fee-calculation-sample'
import { PAYMENT_STATEMENT_BASIC_INFO_SAMPLE_VALUES } from '@/features/template/model/payment-statement-basic-info-sample'
import { PAYMENT_STATEMENT_ISSUANCE_IDS } from '@/features/template/model/payment-statement-issuance-draft'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

export const PAYMENT_STATEMENT_ISSUANCE_HIDDEN_DRAG_HANDLE_IDS = new Set<string>([
  PAYMENT_STATEMENT_ISSUANCE_IDS.title,
  PAYMENT_STATEMENT_ISSUANCE_IDS.closingDate,
  PAYMENT_STATEMENT_ISSUANCE_IDS.closingSignature,
])

export const PAYMENT_STATEMENT_ISSUANCE_PARAGRAPH_BODY_OPTIONS = {
  paymentStatementBasicInfoValues: PAYMENT_STATEMENT_BASIC_INFO_SAMPLE_VALUES,
  lectureFeeCalculationValues: LECTURE_FEE_CALCULATION_SAMPLE_VALUES,
  paymentStatementCalculationLines: LECTURE_FEE_CALCULATION_LINES_SAMPLE,
} satisfies RenderFormParagraphBodyOptions
