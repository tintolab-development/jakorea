import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@/features/template/model/program-application-form-individual-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@/features/template/model/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/program-application-form-volunteer-draft'

const PARTIAL_EDIT_STRUCTURE_LOCKED_PARAGRAPH_IDS = new Set<string>([
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.personalInfoCollection,
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.thirdPartyConsent,
  PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection,
  PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent,
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection,
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
  PROGRAM_PARTICIPANT_APPLICATION_IDS.personalInfoCollection,
  PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent,
])

const STRUCTURE_LOCKED_HINT_FULL = '* 해당 단락은 삭제 및 수정이 불가합니다.'
const STRUCTURE_LOCKED_HINT_PARTIAL_EDIT =
  '* 해당 단락은 삭제 불가하며, 일부 텍스트만 수정이 가능합니다.'

export function resolveStructureLockedParagraphHint(paragraphId: string): string {
  return PARTIAL_EDIT_STRUCTURE_LOCKED_PARAGRAPH_IDS.has(paragraphId)
    ? STRUCTURE_LOCKED_HINT_PARTIAL_EDIT
    : STRUCTURE_LOCKED_HINT_FULL
}
