import {
  getA4DocumentTitle,
  getAgreementClosingStackGapBefore,
  type FormDocumentPreviewParagraphGapResolver,
} from '@/features/template/lib/a4-document-preview'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
} from '@/features/template/model/writing-form-draft.schema'

export const AGREEMENT_EXPENSE_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.title,
])

/** A4 본문 스코프 — 교육진행자 서약서 전용 미리보기 CSS */
export const AGREEMENT_EXPENSE_A4_PREVIEW_BODY_CLASS_NAME =
  'form-document-preview-body--agreement-expense'

/** 시안 1페이지 수용 — 항목 간 간격(공통 40px보다 축소) */
export const AGREEMENT_EXPENSE_A4_SECTION_GAP_PX = 28

/** A4 문서 헤더·PDF 파일명 — 시드 `(안)` 접미만 제거(목록·schema 제목은 유지) */
export function stripAgreementExpenseAuthoringTitleSuffix(title: string): string {
  const trimmed = title.trim()
  const without = trimmed.replace(/\(안\)/gu, '').replace(/\s+/g, ' ').trim()
  return without.length > 0 ? without : trimmed
}

export function getAgreementExpenseA4DocumentDisplayTitle(
  draft: WritingFormDraft,
  fallback: string
): string {
  return stripAgreementExpenseAuthoringTitleSuffix(getA4DocumentTitle(draft, fallback))
}

export const getAgreementExpenseA4ParagraphGap: FormDocumentPreviewParagraphGapResolver = (
  paragraph,
  index,
  pageParagraphs
) => {
  const fallback = AGREEMENT_EXPENSE_A4_SECTION_GAP_PX
  return getAgreementClosingStackGapBefore(paragraph, index, pageParagraphs, fallback)
}
