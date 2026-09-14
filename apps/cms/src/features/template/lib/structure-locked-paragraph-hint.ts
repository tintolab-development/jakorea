import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@/features/template/model/program-application-form-individual-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@/features/template/model/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/program-application-form-volunteer-draft'

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
])

const STRUCTURE_LOCKED_HINT_FULL = '* 해당 단락은 수정 및 삭제가 불가합니다.'
const STRUCTURE_LOCKED_HINT_PARTIAL_EDIT =
  '* 해당 단락은 삭제 불가하며, 일부 텍스트만 수정이 가능합니다.'

export function isStructureLockedPartialTextParagraph(paragraphId: string): boolean {
  return PARTIAL_EDIT_STRUCTURE_LOCKED_PARAGRAPH_IDS.has(paragraphId)
}

/**
 * 개인정보·제3자 동의 표 — 보유기간(마지막 열)은 고정, 그 외 본문 셀만 수정.
 */
export function getStructureLockedPartialLockedBodyColumnIndexes(
  columnCount: number
): ReadonlySet<number> {
  if (columnCount <= 0) return new Set()
  return new Set([columnCount - 1])
}

export function resolveStructureLockedParagraphHint(paragraphId: string): string {
  return isStructureLockedPartialTextParagraph(paragraphId)
    ? STRUCTURE_LOCKED_HINT_PARTIAL_EDIT
    : STRUCTURE_LOCKED_HINT_FULL
}
