import { SETTLEMENT_APPLICATION_LECTURE_FEE_CALCULATION_SAMPLE_VALUES } from '@/features/template/model/lecture-fee-calculation-sample'
import { PAYMENT_STATEMENT_BASIC_INFO_SAMPLE_VALUES } from '@/features/template/model/payment-statement-basic-info-sample'
import { SETTLEMENT_APPLICATION_ISSUANCE_IDS } from '@/features/template/model/settlement-application-issuance-draft'
import { PAYMENT_STATEMENT_ISSUANCE_PARAGRAPH_BODY_OPTIONS } from '@/features/template/ui/form-set/payment-statement-issuance/paragraph-config'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

export const SETTLEMENT_APPLICATION_ISSUANCE_HIDDEN_DRAG_HANDLE_IDS = new Set<string>([
  SETTLEMENT_APPLICATION_ISSUANCE_IDS.title,
])

/** 정산 신청서 기본 정보 「지급 목적」 고정 문구 (시안 5767:44580) — 지급조서(발급용)는 「강사비 또는 활동비 지급」 */
export const SETTLEMENT_APPLICATION_PAYMENT_PURPOSE = '강사비 및 교통비 등 실비 지급'

/** 편집기 카드 — 교통·숙박 신청 단락용 샘플(산출 내역 없음) */
export const SETTLEMENT_APPLICATION_ISSUANCE_PARAGRAPH_BODY_OPTIONS = {
  paymentStatementBasicInfoValues: {
    ...PAYMENT_STATEMENT_BASIC_INFO_SAMPLE_VALUES,
    paymentPurpose: SETTLEMENT_APPLICATION_PAYMENT_PURPOSE,
  },
  lectureFeeCalculationValues: SETTLEMENT_APPLICATION_LECTURE_FEE_CALCULATION_SAMPLE_VALUES,
} satisfies RenderFormParagraphBodyOptions

/** A4/PDF 문서 미리보기 — 지급조서와 동일 샘플(산출 내역 포함) */
export const SETTLEMENT_APPLICATION_DOCUMENT_PREVIEW_PARAGRAPH_BODY_OPTIONS =
  PAYMENT_STATEMENT_ISSUANCE_PARAGRAPH_BODY_OPTIONS
