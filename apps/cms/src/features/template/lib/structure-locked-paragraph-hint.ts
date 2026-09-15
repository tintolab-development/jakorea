import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/gemini-visiting-training-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@/features/template/model/program-application-form-economy-draft'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@/features/template/model/program-application-form-individual-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@/features/template/model/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/program-application-form-volunteer-draft'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@/features/template/model/program-application-form-trained-teachers-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/ujat-program-application-form-institution-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import { PERSONAL_INFO_HORIZONTAL_TABLE_DISCLAIMER_PARAGRAPH_IDS } from '@/features/template/lib/personal-info-horizontal-table-disclaimer-paragraph-ids'

/** 구조 잠금이지만 일부 본문 텍스트(표 셀·하단 안내)만 수정 가능 */
export const PARTIAL_EDIT_STRUCTURE_LOCKED_PARAGRAPH_IDS = new Set<string>([
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.personalInfoCollection,
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.thirdPartyConsent,
  PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection,
  PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent,
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection,
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
  PROGRAM_PARTICIPANT_APPLICATION_IDS.personalInfoCollection,
  PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent,
  PROGRAM_APPLICATION_FORM_ECONOMY_IDS.personalInfoCollection,
  PROGRAM_APPLICATION_FORM_ECONOMY_IDS.thirdPartyConsent,
  GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection,
  GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
  GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.portraitConsent,
  UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection,
  UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
  UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection,
  UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent,
  PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.personalInfoCollection,
  PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.thirdPartyConsent,
])

/**
 * partial 잠금이지만 보유기간 열이 없고 본문 전 열 수정 가능
 * (Gemini 초상권: 동의 내용·권리)
 */
export const PARTIAL_EDIT_ALL_BODY_COLUMNS_PARAGRAPH_IDS = new Set<string>([
  GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.portraitConsent,
])

const STRUCTURE_LOCKED_HINT_FULL = '* 해당 단락은 수정 및 삭제가 불가합니다.'
const STRUCTURE_LOCKED_HINT_PARTIAL_EDIT =
  '* 해당 단락은 삭제 불가하며, 일부 텍스트만 수정이 가능합니다.'

export function isStructureLockedPartialTextParagraph(paragraphId: string): boolean {
  return PARTIAL_EDIT_STRUCTURE_LOCKED_PARAGRAPH_IDS.has(paragraphId)
}

/** 개인정보·제3자 — 하단 안내 ParagraphInput 수정 허용 */
export function isStructureLockedPartialDisclaimerEdit(paragraphId: string): boolean {
  return (
    isStructureLockedPartialTextParagraph(paragraphId) &&
    PERSONAL_INFO_HORIZONTAL_TABLE_DISCLAIMER_PARAGRAPH_IDS.has(paragraphId)
  )
}

/**
 * 개인정보·제3자 동의 표 — 보유기간(마지막 열)은 고정, 그 외 본문 셀만 수정.
 * 초상권 등 전 열 수정 단락은 빈 Set(잠금 열 없음) — TextCellInput 경로는 유지.
 */
export function getStructureLockedPartialLockedBodyColumnIndexes(
  paragraphId: string,
  columnCount: number
): ReadonlySet<number> {
  if (columnCount <= 0) return new Set()
  if (PARTIAL_EDIT_ALL_BODY_COLUMNS_PARAGRAPH_IDS.has(paragraphId)) return new Set()
  return new Set([columnCount - 1])
}

export function resolveStructureLockedParagraphHint(paragraphId: string): string {
  return isStructureLockedPartialTextParagraph(paragraphId)
    ? STRUCTURE_LOCKED_HINT_PARTIAL_EDIT
    : STRUCTURE_LOCKED_HINT_FULL
}
