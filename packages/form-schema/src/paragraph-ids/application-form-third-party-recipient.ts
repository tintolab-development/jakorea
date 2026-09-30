import {
  fieldCellValueToPlainText,
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  type WritingFormDraft,
} from '../writing-form/draft-schema.js'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from './program-application-form-economy-draft.js'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from './program-application-form-individual-draft.js'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from './program-application-form-institution-draft.js'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from './program-application-form-instructor-draft.js'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from './program-application-form-trained-teachers-draft.js'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from './program-application-form-volunteer-draft.js'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS } from './gemini-visiting-training-application-form-institution-draft.js'
import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from './ujat-program-application-form-institution-draft.js'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from './ujat-program-application-form-volunteer-draft.js'

/** 신청 양식 제3자 동의 표 — 제공받는 곳 열 헤더 */
export const APPLICATION_FORM_THIRD_PARTY_RECIPIENT_HEADER = '제공받는 곳'

/** 시드 placeholder. 셀 값으로 남아 있으면 미입력으로 본다. */
export const APPLICATION_FORM_THIRD_PARTY_RECIPIENT_PLACEHOLDER = '제공받는 곳을 입력해 주세요'

/**
 * 프로그램 신청 양식 「개인정보 제3자 정보 제공·이용 동의」 단락.
 * 일반·1사1교·교육받은 교사·UJAT·Gemini 기관 신청을 포함한다.
 */
export const APPLICATION_FORM_THIRD_PARTY_CONSENT_PARAGRAPH_IDS = new Set<string>([
  PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent,
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.thirdPartyConsent,
  PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent,
  PROGRAM_APPLICATION_FORM_ECONOMY_IDS.thirdPartyConsent,
  PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.thirdPartyConsent,
  GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
  UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
  UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent,
])

export function isApplicationFormThirdPartyConsentParagraph(paragraphId: string): boolean {
  return APPLICATION_FORM_THIRD_PARTY_CONSENT_PARAGRAPH_IDS.has(paragraphId)
}

function recipientColumnIndex(columnHeaders: readonly string[] | undefined): number {
  const headerIndex = columnHeaders?.findIndex(
    header => header.trim() === APPLICATION_FORM_THIRD_PARTY_RECIPIENT_HEADER
  )
  return headerIndex != null && headerIndex >= 0 ? headerIndex : 0
}

/** 제3자 동의 표의 「제공받는 곳」 열인지 — 프로그램 등록 시 이 칸만 예외적으로 필수 */
export function isApplicationFormThirdPartyRecipientColumn(
  paragraphId: string,
  columnIndex: number,
  columnHeaders?: readonly string[]
): boolean {
  if (!isApplicationFormThirdPartyConsentParagraph(paragraphId)) return false
  return columnIndex === recipientColumnIndex(columnHeaders)
}

export function isBlankApplicationFormThirdPartyRecipientValue(raw: string): boolean {
  const value = raw.trim()
  if (!value) return true
  if (value === APPLICATION_FORM_THIRD_PARTY_RECIPIENT_PLACEHOLDER) return true
  if (value === HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER) return true
  return false
}

/** 신청 양식 draft에 제3자 「제공받는 곳」이 비어 있으면 true */
export function hasIncompleteApplicationFormThirdPartyRecipient(draft: WritingFormDraft): boolean {
  for (const paragraph of draft.paragraphs) {
    if (paragraph.variant !== 'horizontal_table') continue
    if (!isApplicationFormThirdPartyConsentParagraph(paragraph.id)) continue
    const col = recipientColumnIndex(paragraph.columnHeaders)
    const rowCount = Math.max(paragraph.dataRows.length, paragraph.fieldDataRows?.length ?? 0, 1)
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const fieldCell = paragraph.fieldDataRows?.[rowIndex]?.[col]
      const text =
        fieldCell != null
          ? fieldCellValueToPlainText(fieldCell)
          : (paragraph.dataRows[rowIndex]?.[col] ?? '')
      if (isBlankApplicationFormThirdPartyRecipientValue(text)) return true
    }
  }
  return false
}
