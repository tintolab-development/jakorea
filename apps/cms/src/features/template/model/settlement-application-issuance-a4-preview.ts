import type { FormDocumentPreviewParagraphGapResolver } from '@/features/template/lib/a4-document-preview'
import { A4_DOCUMENT_PARAGRAPH_GAP_PX } from '@/features/template/lib/a4-document-pagination-constants'
import {
  createPaymentStatementIssuanceDraft,
  PAYMENT_STATEMENT_ISSUANCE_IDS,
} from '@/features/template/model/payment-statement-issuance-draft'
import {
  normalizeWritingFormDraft,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

/** 정산 신청서 문서 미리보기 — 지급조서 title 단락을 A4 본문에서 숨김(헤더만 사용) */
export const SETTLEMENT_APPLICATION_DOCUMENT_PREVIEW_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  PAYMENT_STATEMENT_ISSUANCE_IDS.title,
])

/** @deprecated Use `SETTLEMENT_APPLICATION_DOCUMENT_PREVIEW_A4_HIDDEN_PARAGRAPH_IDS` */
export const SETTLEMENT_APPLICATION_A4_HIDDEN_PARAGRAPH_IDS =
  SETTLEMENT_APPLICATION_DOCUMENT_PREVIEW_A4_HIDDEN_PARAGRAPH_IDS

export const getSettlementApplicationA4ParagraphGap: FormDocumentPreviewParagraphGapResolver =
  () => A4_DOCUMENT_PARAGRAPH_GAP_PX

/**
 * 정산 신청서 A4/PDF 미리보기용 draft.
 * 편집 시드(교통·숙박 신청)와 분리 — 지급조서형 본문 3단락 + 정산 신청서 제목.
 */
export function buildSettlementApplicationDocumentPreviewDraft(): WritingFormDraft {
  const paymentDraft = createPaymentStatementIssuanceDraft()
  const keepIds = new Set<string>([
    PAYMENT_STATEMENT_ISSUANCE_IDS.title,
    PAYMENT_STATEMENT_ISSUANCE_IDS.tableBasic,
    PAYMENT_STATEMENT_ISSUANCE_IDS.tableCalcInfo,
    PAYMENT_STATEMENT_ISSUANCE_IDS.tableCalcLines,
  ])
  const paragraphs = paymentDraft.paragraphs
    .filter(p => keepIds.has(p.id))
    .map(p => {
      if (
        p.id === PAYMENT_STATEMENT_ISSUANCE_IDS.title &&
        p.kind === 'description' &&
        p.variant === 'survey_title_with_period'
      ) {
        return { ...p, surveyTitle: 'JA KOREA 정산 신청서' }
      }
      return p
    })
  return normalizeWritingFormDraft({
    ...paymentDraft,
    formSettings: { titleNumbering: 'none' },
    paragraphs,
  })
}
