import { isRequiredAddressIncomplete } from '@jakorea/domain/shared/required-address'
import {
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  type MultipleChoiceParagraph,
  type TableBottomConsent,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '../writing-form/draft-schema.js'
import {
  isIdTypeResidentInputFilled,
  isIdTypeResidentOptionId,
} from '../writing-form/id-type-resident-input.js'
import type { PaymentStatementBasicInfoValues } from './payment-statement-basic-info.js'
import { RECEIPT_PRE_CONSENT_IDS } from '../paragraph-ids/receipt-pre-consent-draft.js'
import {
  isIdTypeResidentNumberFormatInvalid,
  isPaymentStatementResidentNumberFormatInvalid,
} from './payment-statement-resident-number.js'
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
  if (isIdTypeResidentOptionId(nested.selectedOptionId)) {
    return isIdTypeResidentInputFilled(nested.inputValue)
  }
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

const RECEIPT_PRE_CONSENT_TEMPLATE_IDS = new Set(['agreement-receipt-pre-consent'])

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

export type MemberConsentIncompleteRequiredField = {
  paragraphId: string
  fieldId: string
  label: string
}

function describeIncompleteRequiredParagraph(
  paragraph: WritingFormParagraph
): MemberConsentIncompleteRequiredField[] {
  if (isRequiredParagraphResponseComplete(paragraph)) return []

  const paragraphLabel = resolveParagraphConsentLabel(paragraph)

  if (!isRequiredBottomConsentComplete(paragraph)) {
    return [{ paragraphId: paragraph.id, fieldId: paragraph.id, label: paragraphLabel }]
  }

  if (paragraph.kind !== 'single_item') {
    return [{ paragraphId: paragraph.id, fieldId: paragraph.id, label: paragraphLabel }]
  }

  if (paragraph.variant === 'short_essay' || paragraph.variant === 'session_plan_short_essay') {
    const items = paragraph.items ?? []
    if (items.length === 0) {
      return [{ paragraphId: paragraph.id, fieldId: paragraph.id, label: paragraphLabel }]
    }
    return items
      .filter(item => (item.bodyText ?? '').trim() === '')
      .map(item => ({
        paragraphId: paragraph.id,
        fieldId: item.id,
        label: item.label?.trim() || paragraphLabel,
      }))
  }

  return [{ paragraphId: paragraph.id, fieldId: paragraph.id, label: paragraphLabel }]
}

export function listMemberConsentIncompleteRequiredFields(
  draft: WritingFormDraft,
  options?: MemberConsentDraftValidationOptions
): MemberConsentIncompleteRequiredField[] {
  const fields = draft.paragraphs.flatMap(describeIncompleteRequiredParagraph)

  const templateId = options?.templateId
  if (templateId === 'agreement-portrait' && !isPortraitPersonalConsentResponseComplete(draft)) {
    fields.push({
      paragraphId: AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable,
      fieldId: AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable,
      label: '성명·소속',
    })
  }

  if (templateId != null && PAYMENT_STATEMENT_TEMPLATE_IDS.has(templateId)) {
    if (isPaymentStatementBasicInfoIncomplete(options?.paymentStatementBasicInfo)) {
      fields.push({
        paragraphId: 'paymentRecord',
        fieldId: 'paymentRecord',
        label: '지급조서 기본 정보',
      })
    }
  }

  if (templateId != null && RECEIPT_PRE_CONSENT_TEMPLATE_IDS.has(templateId)) {
    return fields.filter(field => field.paragraphId !== RECEIPT_PRE_CONSENT_IDS.paymentRecord)
  }

  return fields
}

export function hasMemberConsentIncompleteRequiredFields(
  draft: WritingFormDraft,
  options?: MemberConsentDraftValidationOptions
): boolean {
  return listMemberConsentIncompleteRequiredFields(draft, options).length > 0
}

export function formatMemberConsentIncompleteRequiredAlertMessage(
  fields: MemberConsentIncompleteRequiredField[]
): string {
  if (fields.length === 0) return '필수 항목을 모두 작성해주세요'
  if (fields.length === 1) return `${fields[0].label} 항목을 작성해 주세요.`
  return `${fields.map(field => field.label).join(', ')} 항목을 작성해 주세요.`
}

/** 지급조서 작성완료 — 필수 값은 채워졌으나 주민등록번호 형식이 잘못된 경우 */
export function hasMemberConsentInvalidPaymentStatementResidentNumber(
  options?: MemberConsentDraftValidationOptions
): boolean {
  const templateId = options?.templateId
  if (templateId == null || !PAYMENT_STATEMENT_TEMPLATE_IDS.has(templateId)) return false
  return isPaymentStatementResidentNumberFormatInvalid(options?.paymentStatementBasicInfo)
}

function collectIdTypeWithInputBlocks(draft: WritingFormDraft) {
  const blocks: { selectedOptionId: string | null; inputValue: string }[] = []
  for (const paragraph of draft.paragraphs) {
    if (paragraph.kind !== 'single_item') continue
    if (paragraph.variant === 'id_type_with_input') {
      blocks.push(paragraph)
      continue
    }
    if (paragraph.variant === 'horizontal_table' && paragraph.idTypeWithInput != null) {
      blocks.push(paragraph.idTypeWithInput)
    }
  }
  return blocks
}

/** 행정정보 공동이용 — 주민등록번호 라디오 + 입력값이 있는데 형식이 잘못된 경우 */
export function hasMemberConsentInvalidIdTypeResidentNumber(draft: WritingFormDraft): boolean {
  return collectIdTypeWithInputBlocks(draft).some(block => {
    if (!isIdTypeResidentOptionId(block.selectedOptionId)) return false
    return isIdTypeResidentNumberFormatInvalid(block.inputValue)
  })
}

/** 작성완료 — 지급조서 또는 행정정보 식별번호 주민등록번호 형식 오류 */
export function hasMemberConsentInvalidResidentNumberFormat(
  draft: WritingFormDraft,
  options?: MemberConsentDraftValidationOptions
): boolean {
  return (
    hasMemberConsentInvalidPaymentStatementResidentNumber(options) ||
    hasMemberConsentInvalidIdTypeResidentNumber(draft)
  )
}
