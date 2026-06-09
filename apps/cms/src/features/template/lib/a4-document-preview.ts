import type {
  TitleWithPeriodParagraph,
  WritingFormDraft,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

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
  isClosingSignature: boolean
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
  renderMode: FormDocumentPreviewRenderMode
): FormDocumentPreviewParagraphViewModel {
  const isClosing = paragraph.kind === 'description' && paragraph.variant === 'closing'
  const isSystem = paragraph.kind === 'description' && paragraph.variant === 'system'
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
    isClosingSignature: isClosing && paragraph.id.includes('closing-signature'),
  }
}
