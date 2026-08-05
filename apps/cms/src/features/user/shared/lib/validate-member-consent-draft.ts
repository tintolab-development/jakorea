import { resolveParagraphTitleRequiredMark } from '@/features/template/lib/paragraph-required-mark'
import {
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  type MultipleChoiceParagraph,
  type TableBottomConsent,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import {
  portraitPersonalConsentAffiliationState,
  portraitPersonalConsentNameValue,
} from '@/features/template/ui/paragraph/table/agreement-portrait-personal-consent-name-row'

function readParagraphBottomConsent(
  paragraph: WritingFormParagraph
): TableBottomConsent | undefined {
  if (!('showBottomConsent' in paragraph) || paragraph.showBottomConsent !== true) {
    return undefined
  }
  return (paragraph as { bottomConsent?: TableBottomConsent }).bottomConsent
}

/** 동의 양식 — 하단 동의 선택이 있는 단락 중 미동의가 있으면 true */
export function hasMemberConsentDisagreement(draft: WritingFormDraft): boolean {
  return draft.paragraphs.some(paragraph => readParagraphBottomConsent(paragraph) === 'disagree')
}

function isDisagreeChoiceItem(item: { id: string; label: string }): boolean {
  const label = item.label.trim()
  if (label === '동의하지 않음' || label.includes('동의하지 않')) return true
  if (item.id.includes('-disagree')) return true
  return false
}

function isMultipleChoiceAnswerComplete(paragraph: MultipleChoiceParagraph): boolean {
  if (paragraph.allowMultiple) {
    const selected = paragraph.selectedPreviewMultipleIds ?? []
    if (selected.length === 0) return false
    return !selected.some(id => {
      const item = paragraph.items.find(entry => entry.id === id)
      return item != null && isDisagreeChoiceItem(item)
    })
  }

  const selectedId = paragraph.selectedPreviewSingleId
  if (selectedId == null || selectedId === '') return false
  const item = paragraph.items.find(entry => entry.id === selectedId)
  if (item == null) return false
  return !isDisagreeChoiceItem(item)
}

function isShortEssayAnswerComplete(paragraph: {
  items?: { bodyText: string }[]
  bodyText?: string
}): boolean {
  const items = paragraph.items ?? []
  if (items.length === 0) {
    return (paragraph.bodyText ?? '').trim() !== ''
  }
  return items.every(item => (item.bodyText ?? '').trim() !== '')
}

function isRequiredBottomConsentComplete(paragraph: WritingFormParagraph): boolean {
  if (!('showBottomConsent' in paragraph) || paragraph.showBottomConsent !== true) {
    return true
  }
  return readParagraphBottomConsent(paragraph) === 'agree'
}

function isIdTypeWithInputComplete(paragraph: WritingFormParagraph): boolean {
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'horizontal_table') {
    return true
  }
  const nested = paragraph.idTypeWithInput
  if (nested == null) return true
  if (!nested.answerRequired && !nested.requiredMark) return true
  if (nested.selectedOptionId == null || nested.selectedOptionId === '') return false
  return nested.inputValue.trim() !== ''
}

function isPortraitPersonalConsentResponseComplete(draft: WritingFormDraft): boolean {
  const table = draft.paragraphs.find(
    paragraph => paragraph.id === AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable
  )
  if (table == null || table.kind !== 'single_item' || table.variant !== 'vertical_table') {
    return false
  }
  const row = table.rows[0]
  if (row == null || row.stageCount !== 2) return false

  const name = portraitPersonalConsentNameValue(row.cells[0] ?? '').trim()
  if (name === '') return false

  const { noAffiliation, affiliation } = portraitPersonalConsentAffiliationState(row.cells[1] ?? '')
  return noAffiliation || affiliation.trim() !== ''
}

/** 필수 단락의 응답(선택·입력)이 채워졌는지 */
function isRequiredParagraphResponseComplete(paragraph: WritingFormParagraph): boolean {
  if (!resolveParagraphTitleRequiredMark(paragraph)) return true
  if (paragraph.kind !== 'single_item') return true

  if (!isRequiredBottomConsentComplete(paragraph)) return false

  switch (paragraph.variant) {
    case 'multiple_choice':
      return isMultipleChoiceAnswerComplete(paragraph)
    case 'agreement_explanation_text':
      if (paragraph.answerRequired === true && paragraph.bodyText.trim() === '') {
        return false
      }
      return true
    case 'short_essay':
    case 'session_plan_short_essay':
      return isShortEssayAnswerComplete(paragraph)
    case 'horizontal_table':
      return isIdTypeWithInputComplete(paragraph)
    case 'vertical_table':
      return true
    default:
      return true
  }
}

export type MemberConsentDraftValidationOptions = {
  templateId?: string
  /** 지급조서 기본정보 성명 — draft 밖 로컬 폼 값 */
  paymentAuthorName?: string
}

const PAYMENT_STATEMENT_TEMPLATE_IDS = new Set([
  'agreement-third-party',
  'document-payment-order-pre-consent',
])

/**
 * 회원 동의서 작성 — 필수 응답이 비어 있거나 미동의하면 true.
 * 제출 전 Alert(필수 항목을 모두 작성해주세요) 조건.
 * 모든 동의 양식(초상권·지급조서·교육진행자 서약·행정정보 등) 공통.
 */
export function hasMemberConsentIncompleteRequiredFields(
  draft: WritingFormDraft,
  options?: MemberConsentDraftValidationOptions
): boolean {
  if (draft.paragraphs.some(paragraph => !isRequiredParagraphResponseComplete(paragraph))) {
    return true
  }

  const templateId = options?.templateId
  if (templateId === 'agreement-portrait') {
    return !isPortraitPersonalConsentResponseComplete(draft)
  }

  if (templateId != null && PAYMENT_STATEMENT_TEMPLATE_IDS.has(templateId)) {
    return (options?.paymentAuthorName ?? '').trim() === ''
  }

  return false
}
