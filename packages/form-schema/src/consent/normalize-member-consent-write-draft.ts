import {
  AGREEMENT_NOTICE_DEFAULT_PURPOSE,
  AGREEMENT_NOTICE_ID_TYPE_RESIDENT_OPTION_ID,
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'

function clearBottomConsent(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (!('showBottomConsent' in paragraph) || paragraph.showBottomConsent !== true) {
    return paragraph
  }
  return { ...paragraph, bottomConsent: undefined }
}

function clearMultipleChoice(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'multiple_choice') {
    return paragraph
  }
  return {
    ...paragraph,
    selectedPreviewSingleId: null,
    selectedPreviewMultipleIds: [],
  }
}

function clearNoticeInteractiveParagraph(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (paragraph.id !== AGREEMENT_NOTICE_PARAGRAPH_IDS.subject) return paragraph
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'short_essay') return paragraph

  return {
    ...paragraph,
    bodyText: '',
    items: (paragraph.items ?? []).map(item => ({ ...item, bodyText: '' })),
  }
}

function resetNoticeInstitutionAndPurpose(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'agreement_explanation_text') {
    return paragraph
  }
  if (paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.institution) {
    return { ...paragraph, bodyText: '' }
  }
  if (paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.purpose) {
    return { ...paragraph, bodyText: AGREEMENT_NOTICE_DEFAULT_PURPOSE }
  }
  return paragraph
}

function clearNoticeIdTypeWithInput(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (
    paragraph.id !== AGREEMENT_NOTICE_PARAGRAPH_IDS.table ||
    paragraph.kind !== 'single_item' ||
    paragraph.variant !== 'horizontal_table'
  ) {
    return paragraph
  }

  const nested = paragraph.idTypeWithInput
  if (nested == null) return paragraph

  return {
    ...paragraph,
    idTypeWithInput: {
      ...nested,
      selectedOptionId: AGREEMENT_NOTICE_ID_TYPE_RESIDENT_OPTION_ID,
      inputPlaceholder: '주민등록번호를 입력해 주세요',
      inputValue: '',
    },
  }
}

function normalizeParagraphForWrite(
  paragraph: WritingFormParagraph,
  templateId: string
): WritingFormParagraph {
  let next = clearBottomConsent(paragraph)
  next = clearMultipleChoice(next)

  if (templateId === 'agreement-notice') {
    next = clearNoticeInteractiveParagraph(next)
    next = clearNoticeIdTypeWithInput(next)
    next = resetNoticeInstitutionAndPurpose(next)
  }

  return next
}

/** 동의서 작성 진입 — seed/API 구조는 유지하고 응답 필드만 비움 */
export function normalizeMemberConsentWriteDraft(
  draft: WritingFormDraft,
  templateId: string
): WritingFormDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(paragraph =>
      normalizeParagraphForWrite(paragraph, templateId)
    ),
  }
}
