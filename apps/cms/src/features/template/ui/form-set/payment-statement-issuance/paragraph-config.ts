import {
  LECTURE_FEE_CALCULATION_LINES_SAMPLE,
  type PaymentStatementCalculationLinesViewModel,
} from '@/features/template/model/lecture-fee-calculation-lines-sample'
import { LECTURE_FEE_CALCULATION_SAMPLE_VALUES } from '@/features/template/model/lecture-fee-calculation-sample'
import {
  PAYMENT_STATEMENT_BASIC_INFO_SAMPLE_VALUES,
  PAYMENT_STATEMENT_PRE_CONSENT_BASIC_INFO_AUTHORING_VALUES,
} from '@/features/template/model/payment-statement-basic-info-sample'
import { PAYMENT_STATEMENT_ISSUANCE_IDS } from '@/features/template/model/payment-statement-issuance-draft'
import type { LectureFeeCalculationAutofillValues } from '@/features/template/ui/form-set/detail-forms/lecture-fee-calculation-detail-form'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

export const PAYMENT_STATEMENT_ISSUANCE_HIDDEN_DRAG_HANDLE_IDS = new Set<string>([
  PAYMENT_STATEMENT_ISSUANCE_IDS.title,
  PAYMENT_STATEMENT_ISSUANCE_IDS.closingDate,
  PAYMENT_STATEMENT_ISSUANCE_IDS.closingSignature,
])

/** 양식 관리 편집·A4 미리보기 전용 목 데이터. 사용자 발급 화면에는 쓰지 않음. */
export const PAYMENT_STATEMENT_ISSUANCE_PARAGRAPH_BODY_OPTIONS = {
  paymentStatementBasicInfoValues: PAYMENT_STATEMENT_BASIC_INFO_SAMPLE_VALUES,
  lectureFeeCalculationValues: LECTURE_FEE_CALCULATION_SAMPLE_VALUES,
  paymentStatementCalculationLines: LECTURE_FEE_CALCULATION_LINES_SAMPLE,
} satisfies RenderFormParagraphBodyOptions

export const PAYMENT_STATEMENT_ISSUANCE_EMPTY_CALCULATION_LINES: PaymentStatementCalculationLinesViewModel =
  {
    blocks: [],
    formulaLabel: '',
    totalAmount: 0,
  }

const EMPTY_BASIC_INFO_VALUES: PaymentStatementBasicInfoAutofillValues = {
  nameKo: '',
  nameEn: '',
  residentFront: '',
  residentBack: '',
  affiliation: '',
  noAffiliation: false,
  addressRoad: '',
  addressDetail: '',
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  paymentPurpose: PAYMENT_STATEMENT_PRE_CONSENT_BASIC_INFO_AUTHORING_VALUES.paymentPurpose ?? '',
}

const EMPTY_LECTURE_FEE_VALUES: LectureFeeCalculationAutofillValues = {
  lectureFeeType: '',
  feeBasisLeft: '',
  feeBasisRight: '',
  businessIncomeLeft: '',
  businessIncomeRight: '',
  sessionCount: '',
  sessionHours: '',
  transportFee: false,
  lodgingFee: false,
  totalStudents: '',
  totalLectureFee: '',
}

/** 사용자 발급 미리보기 — 샘플 인물·기관 없음 */
export const PAYMENT_STATEMENT_ISSUANCE_EMPTY_PARAGRAPH_BODY_OPTIONS = {
  paymentStatementBasicInfoValues: EMPTY_BASIC_INFO_VALUES,
  lectureFeeCalculationValues: EMPTY_LECTURE_FEE_VALUES,
  paymentStatementCalculationLines: PAYMENT_STATEMENT_ISSUANCE_EMPTY_CALCULATION_LINES,
} satisfies RenderFormParagraphBodyOptions

export function resolvePaymentStatementIssuanceDocumentParagraphBodyOptions(
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
): RenderFormParagraphBodyOptions {
  return {
    ...PAYMENT_STATEMENT_ISSUANCE_EMPTY_PARAGRAPH_BODY_OPTIONS,
    ...paragraphBodyOptions,
    paymentStatementDisplayMode: 'document',
  }
}
