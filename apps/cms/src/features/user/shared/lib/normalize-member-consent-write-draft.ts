import { AGREEMENT_NOTICE_CONSENT_FILL_INTERACTIVE_PARAGRAPH_IDS } from '@/features/template/lib/agreement-notice-consent-fill-interactive'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'

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

function clearPortraitPersonalConsentTable(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (
    paragraph.id !== AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable ||
    paragraph.kind !== 'single_item' ||
    paragraph.variant !== 'vertical_table'
  ) {
    return paragraph
  }

  const rows = [...paragraph.rows]
  if (rows[0] != null && rows[0].stageCount === 2) {
    rows[0] = { ...rows[0], cells: ['', ''] }
  }

  return { ...paragraph, rows }
}

function clearNoticeInteractiveParagraph(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (!AGREEMENT_NOTICE_CONSENT_FILL_INTERACTIVE_PARAGRAPH_IDS.has(paragraph.id)) {
    return paragraph
  }
  if (paragraph.kind !== 'single_item') return paragraph

  if (paragraph.variant === 'short_essay') {
    return {
      ...paragraph,
      bodyText: '',
      items: (paragraph.items ?? []).map(item => ({ ...item, bodyText: '' })),
    }
  }

  if (paragraph.variant === 'agreement_explanation_text') {
    return { ...paragraph, bodyText: '' }
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
      selectedOptionId: null,
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

  if (templateId === 'agreement-portrait') {
    next = clearPortraitPersonalConsentTable(next)
  }

  if (templateId === 'agreement-notice') {
    next = clearNoticeInteractiveParagraph(next)
    next = clearNoticeIdTypeWithInput(next)
  }

  return next
}

/** 회원 동의서 작성 모달 진입 — 시드/저장본의 응답 기본값을 모두 비움 */
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
