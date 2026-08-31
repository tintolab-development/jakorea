import {
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS,
  type TitleWithPeriodParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'

export type FormDocumentPreviewRenderMode = 'card' | 'contentOnly'

export type FormDocumentPreviewParagraphGapResolver = (
  paragraph: WritingFormParagraph,
  index: number,
  pageParagraphs: WritingFormParagraph[]
) => number

export interface FormDocumentPreviewParagraphViewModel {
  title: string
  description?: string
  showHeader: boolean
  showWritingPeriod: boolean
  isClosing: boolean
  /** closing 또는 제목 없는 동의 확인 문구 — A4 우측 볼드 스펙 */
  isConfirmText: boolean
  /** 확인 문구 위에 table-line 구분선 (지급조서 최종확인·서약 위반·초상권 확인) */
  isConfirmTextRule: boolean
  isClosingSignature: boolean
}

/**
 * A4 하단 동의 확인 문구.
 * - `closing` 단락
 * - 제목 없는 설명글이 **바로 다음이 날짜(system date)** 일 때 (지급조서 사전 동의 mid/final confirm)
 * 초상권 intro처럼 본문 위쪽 설명글은 제목이 비어도 확인 문구가 아니다.
 */
export function isAgreementDocumentConfirmTextParagraph(
  paragraph: WritingFormParagraph,
  nextParagraph?: WritingFormParagraph | null
): boolean {
  if (paragraph.kind === 'description' && paragraph.variant === 'closing') return true
  if (
    paragraph.kind !== 'single_item' ||
    paragraph.variant !== 'agreement_explanation_text' ||
    paragraph.paragraphTitle.trim().length !== 0
  ) {
    return false
  }
  return nextParagraph != null && isAgreementDocumentDateParagraph(nextParagraph)
}

export function isAgreementDocumentDateParagraph(paragraph: WritingFormParagraph): boolean {
  return (
    paragraph.kind === 'description' &&
    paragraph.variant === 'system' &&
    paragraph.systemPreset === 'agreement_date'
  )
}

export function isAgreementDocumentSignatureParagraph(
  paragraph: WritingFormParagraph
): boolean {
  return (
    paragraph.kind === 'description' &&
    paragraph.variant === 'system' &&
    paragraph.systemPreset === 'agreement_signature'
  )
}

const AGREEMENT_A4_CONFIRM_TEXT_RULE_IDS = new Set<string>([
  PAYMENT_STATEMENT_PRE_CONSENT_IDS.finalConfirm,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.violationClosing,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS.confirmationClosing,
])

/** 문서 미리보기 — 확인 문구 위에 구분선을 그리는 단락 */
export function isAgreementA4ConfirmTextRuleParagraph(
  paragraph: WritingFormParagraph
): boolean {
  return AGREEMENT_A4_CONFIRM_TEXT_RULE_IDS.has(paragraph.id)
}

/**
 * 동의 A4 closing 스택(확인문구 → 날짜 → 서명)은 요소 margin-bottom이 SSOT.
 * 스택 내부 전환(confirm→date, date→signature)만 gap을 0으로 둔다.
 */
export function getAgreementClosingStackGapBefore(
  paragraph: WritingFormParagraph,
  index: number,
  pageParagraphs: WritingFormParagraph[],
  fallback: number
): number {
  if (index < 1) return fallback
  const previous = pageParagraphs[index - 1]
  if (previous == null) return fallback
  if (isAgreementA4ConfirmTextRuleParagraph(paragraph)) return 0
  if (
    isAgreementDocumentConfirmTextParagraph(previous, paragraph) &&
    isAgreementDocumentDateParagraph(paragraph)
  ) {
    return 0
  }
  if (
    isAgreementDocumentDateParagraph(previous) &&
    isAgreementDocumentSignatureParagraph(paragraph)
  ) {
    return 0
  }
  return fallback
}

export function getA4DocumentTitle(draft: WritingFormDraft, fallback: string): string {
  const firstParagraph = draft.paragraphs[0]
  if (firstParagraph?.variant === 'survey_title_with_period') {
    const surveyTitle = firstParagraph.surveyTitle.trim()
    if (surveyTitle.length > 0) return surveyTitle
  }
  const paragraphTitle = firstParagraph?.paragraphTitle.trim()
  return paragraphTitle != null && paragraphTitle.length > 0 ? paragraphTitle : fallback
}

export function getA4PreviewParagraphs(
  paragraphs: WritingFormParagraph[],
  hiddenParagraphIds?: ReadonlySet<string>
): WritingFormParagraph[] {
  if (hiddenParagraphIds == null || hiddenParagraphIds.size === 0) {
    return paragraphs
  }
  return paragraphs.filter(p => !hiddenParagraphIds.has(p.id))
}

export function getDocumentPreviewParagraphTitle(
  paragraph: WritingFormParagraph,
  fallback: string
): string {
  if (paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period') {
    const surveyTitle = (paragraph as TitleWithPeriodParagraph).surveyTitle.trim()
    if (surveyTitle.length > 0) return surveyTitle
  }
  const paragraphTitle = paragraph.paragraphTitle.trim()
  return paragraphTitle.length > 0 ? paragraphTitle : fallback
}

export function getDocumentPreviewParagraphViewModel(
  paragraph: WritingFormParagraph,
  displayTitle: string,
  renderMode: FormDocumentPreviewRenderMode,
  nextParagraph?: WritingFormParagraph | null
): FormDocumentPreviewParagraphViewModel {
  const isClosing = paragraph.kind === 'description' && paragraph.variant === 'closing'
  const isSystem = paragraph.kind === 'description' && paragraph.variant === 'system'
  const isConfirmText = isAgreementDocumentConfirmTextParagraph(paragraph, nextParagraph)
  const isUntitledAgreementExplanation =
    paragraph.kind === 'single_item' &&
    paragraph.variant === 'agreement_explanation_text' &&
    paragraph.paragraphTitle.trim().length === 0

  const isFileAttachmentContentOnly =
    renderMode === 'contentOnly' &&
    paragraph.kind === 'single_item' &&
    paragraph.variant === 'file_attachment'

  return {
    title: getDocumentPreviewParagraphTitle(paragraph, displayTitle),
    description: paragraph.paragraphDescription?.trim() || undefined,
    showHeader:
      renderMode !== 'contentOnly' ||
      (!isClosing && !isSystem && !isUntitledAgreementExplanation && !isFileAttachmentContentOnly),
    showWritingPeriod: renderMode !== 'contentOnly',
    isClosing,
    isConfirmText,
    isConfirmTextRule: isAgreementA4ConfirmTextRuleParagraph(paragraph),
    isClosingSignature: isClosing && paragraph.id.includes('closing-signature'),
  }
}
