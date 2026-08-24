import { isRequiredAddressIncomplete } from '@jakorea/domain/shared/required-address'
import {
  AGREEMENT_NOTICE_PARAGRAPH_IDS,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  type MultipleChoiceParagraph,
  type TableBottomConsent,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'
import type { PaymentStatementBasicInfoValues } from './payment-statement-basic-info.js'
import {
  portraitPersonalConsentAffiliationState,
  portraitPersonalConsentNameValue,
} from './portrait-consent-cell.js'

function resolveParagraphTitleRequiredMark(paragraph: WritingFormParagraph): boolean {
  if (paragraph.kind === 'single_item') {
    if (paragraph.variant === 'horizontal_table') {
      return paragraph.answerRequired
    }
    if (paragraph.variant === 'vertical_table') {
      return paragraph.answerRequired
    }
    return paragraph.answerRequired ?? paragraph.requiredMark
  }
  return paragraph.requiredMark
}

function readParagraphBottomConsent(
  paragraph: WritingFormParagraph
): TableBottomConsent | undefined {
  if (!('showBottomConsent' in paragraph) || paragraph.showBottomConsent !== true) {
    return undefined
  }
  return (paragraph as { bottomConsent?: TableBottomConsent }).bottomConsent
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

function isAgreementNoticeIdTypeComplete(draft: WritingFormDraft): boolean {
  const table = draft.paragraphs.find(
    paragraph => paragraph.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.table
  )
  if (table == null || table.kind !== 'single_item' || table.variant !== 'horizontal_table') {
    return false
  }
  const nested = table.idTypeWithInput
  if (nested == null) return false
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

export function isPaymentStatementBasicInfoIncomplete(
  values: Partial<PaymentStatementBasicInfoValues> | undefined
): boolean {
  if (values == null) return true

  if (!values.nameKo?.trim()) return true
  if (!values.residentFront?.trim()) return true
  if (!values.residentBack?.trim()) return true
  if (
    isRequiredAddressIncomplete({
      address: values.addressRoad,
      addressDetail: values.addressDetail,
      subject: 'person',
    })
  ) {
    return true
  }
  if (!values.bankName?.trim()) return true
  if (!values.accountNumber?.trim()) return true
  if (!values.accountHolder?.trim()) return true

  if (values.noAffiliation) return false
  return !values.affiliation?.trim()
}

const PAYMENT_STATEMENT_TEMPLATE_IDS = new Set([
  'agreement-third-party',
  'document-payment-order-pre-consent',
])

export type MemberConsentDraftValidationOptions = {
  templateId?: string
  paymentStatementBasicInfo?: Partial<PaymentStatementBasicInfoValues>
}

function resolveParagraphConsentLabel(paragraph: WritingFormParagraph): string {
  if ('paragraphTitle' in paragraph) {
    const title = String(paragraph.paragraphTitle ?? '').trim()
    if (title) return title
  }
  return '필수 동의 항목'
}

function isRequiredParagraphExplicitlyDisagreed(paragraph: WritingFormParagraph): boolean {
  if (!resolveParagraphTitleRequiredMark(paragraph)) return false

  if (readParagraphBottomConsent(paragraph) === 'disagree') return true

  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'multiple_choice') {
    return false
  }

  if (paragraph.allowMultiple) {
    const selected = paragraph.selectedPreviewMultipleIds ?? []
    return selected.some(id => {
      const item = paragraph.items.find(entry => entry.id === id)
      return item != null && isDisagreeChoiceItem(item)
    })
  }

  const selectedId = paragraph.selectedPreviewSingleId
  if (selectedId == null || selectedId === '') return false
  const item = paragraph.items.find(entry => entry.id === selectedId)
  return item != null && isDisagreeChoiceItem(item)
}

/** 필수 동의 단락에서 명시적 「동의하지 않음」 선택 항목 라벨 */
export function collectMemberConsentDisagreedRequiredLabels(
  draft: WritingFormDraft
): string[] {
  return draft.paragraphs
    .filter(isRequiredParagraphExplicitlyDisagreed)
    .map(resolveParagraphConsentLabel)
}

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

  if (templateId === 'agreement-notice') {
    return !isAgreementNoticeIdTypeComplete(draft)
  }

  if (templateId != null && PAYMENT_STATEMENT_TEMPLATE_IDS.has(templateId)) {
    return isPaymentStatementBasicInfoIncomplete(options?.paymentStatementBasicInfo)
  }

  return false
}
