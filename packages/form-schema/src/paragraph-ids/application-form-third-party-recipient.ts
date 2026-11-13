import {
  HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
  resolveHorizontalTableCellPlainText,
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
 * 공통 강사·봉사자·UJAT 봉사자 신청 폼 placeholder — Figma 12875:514537·12875:514060·12875:515697.
 * 셀 값으로 남아 있으면 미입력으로 본다.
 */
export const APPLICATION_FORM_THIRD_PARTY_RECIPIENT_INSTITUTION_NAME_PLACEHOLDER =
  '제공받는 기관명을 입력해 주세요'

/**
 * 예전 공통 강사·봉사자·UJAT 봉사자 신청 폼 시드 기본값.
 * 시안(빈칸 + placeholder)에 맞춰 시드에서는 쓰지 않는다. 서버 저장본에 남은 값은 그대로 읽는다.
 */
export const APPLICATION_FORM_THIRD_PARTY_RECIPIENT_ASSIGNED_SCHOOL = '배정된 교육 대상 학교'

/** Gemini 찾아가는 연수 신청 폼 시드 기본값 */
export const APPLICATION_FORM_THIRD_PARTY_RECIPIENT_GEMINI = 'Google'

/**
 * 등록 위저드·템플릿 관리 시드 「제공받는 곳」 기본값.
 * 공백은 `''`. placeholder 문구를 값으로 넣지 않는다.
 */
export const APPLICATION_FORM_THIRD_PARTY_RECIPIENT_SEED_BY_PARAGRAPH_ID: Record<string, string> = {
  [PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent]: '',
  [PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent]: '',
  [PROGRAM_APPLICATION_FORM_ECONOMY_IDS.thirdPartyConsent]: '',
  [PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.thirdPartyConsent]: '',
  [UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent]: '',
  [GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent]:
    APPLICATION_FORM_THIRD_PARTY_RECIPIENT_GEMINI,
  [PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.thirdPartyConsent]: '',
  [PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent]: '',
  [UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent]: '',
}

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
  if (value === APPLICATION_FORM_THIRD_PARTY_RECIPIENT_INSTITUTION_NAME_PLACEHOLDER) return true
  if (value === HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER) return true
  return false
}

/** 미입력 「제공받는 곳」 셀 — `application.thirdParty.{paragraphId}.{rowIndex}.{columnIndex}` */
export function listIncompleteApplicationFormThirdPartyRecipientKeys(
  draft: WritingFormDraft
): string[] {
  const keys: string[] = []
  for (const paragraph of draft.paragraphs) {
    if (paragraph.variant !== 'horizontal_table') continue
    if (!isApplicationFormThirdPartyConsentParagraph(paragraph.id)) continue
    const col = recipientColumnIndex(paragraph.columnHeaders)
    const rowCount = Math.max(paragraph.dataRows.length, paragraph.fieldDataRows?.length ?? 0, 1)
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const text = resolveHorizontalTableCellPlainText(paragraph, rowIndex, col)
      if (isBlankApplicationFormThirdPartyRecipientValue(text)) {
        keys.push(`application.thirdParty.${paragraph.id}.${rowIndex}.${col}`)
      }
    }
  }
  return keys
}

/** 신청 양식 draft에 제3자 「제공받는 곳」이 비어 있으면 true */
export function hasIncompleteApplicationFormThirdPartyRecipient(draft: WritingFormDraft): boolean {
  return listIncompleteApplicationFormThirdPartyRecipientKeys(draft).length > 0
}

/** 첫 제3자 동의 표의 「제공받는 곳」 현재 값. 단락이 없으면 null */
export function readApplicationFormThirdPartyRecipientValue(draft: WritingFormDraft): string | null {
  for (const paragraph of draft.paragraphs) {
    if (paragraph.variant !== 'horizontal_table') continue
    if (!isApplicationFormThirdPartyConsentParagraph(paragraph.id)) continue
    return resolveHorizontalTableCellPlainText(
      paragraph,
      0,
      recipientColumnIndex(paragraph.columnHeaders)
    )
  }
  return null
}

/**
 * 신청 formAnswers 제3자 동의 객체에서 「제공받는 곳」을 읽는다.
 * 우선순위: thirdPartyRecipient → dataRows[0][0] → fieldDataRows[0][0].value
 * 레거시 `"agree"` 문자열만 있으면 null (호출부에서 템플릿 기본값 fallback).
 */
export function resolveThirdPartyRecipientFromFormAnswer(answer: unknown): string | null {
  if (answer == null) return null
  if (typeof answer === 'string') {
    const trimmed = answer.trim()
    if (!trimmed || trimmed === 'agree' || trimmed === 'disagree' || trimmed === '-') return null
    if (isBlankApplicationFormThirdPartyRecipientValue(trimmed)) return null
    return trimmed
  }
  if (typeof answer !== 'object' || Array.isArray(answer)) return null
  const row = answer as Record<string, unknown>

  const fromField =
    typeof row.thirdPartyRecipient === 'string' ? row.thirdPartyRecipient.trim() : ''
  if (fromField && fromField !== '-' && !isBlankApplicationFormThirdPartyRecipientValue(fromField)) {
    return fromField
  }

  const dataCell = Array.isArray(row.dataRows) ? row.dataRows[0]?.[0] : undefined
  if (typeof dataCell === 'string') {
    const trimmed = dataCell.trim()
    if (trimmed && trimmed !== '-' && !isBlankApplicationFormThirdPartyRecipientValue(trimmed)) {
      return trimmed
    }
  }

  const fieldCell = Array.isArray(row.fieldDataRows) ? row.fieldDataRows[0]?.[0] : undefined
  if (fieldCell && typeof fieldCell === 'object' && !Array.isArray(fieldCell)) {
    const value = (fieldCell as { value?: unknown }).value
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed && trimmed !== '-' && !isBlankApplicationFormThirdPartyRecipientValue(trimmed)) {
        return trimmed
      }
    }
  }

  return null
}
