import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@/features/template/model/program-application-form-individual-draft'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@/features/template/model/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/program-application-form-volunteer-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/ujat-program-application-form-institution-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/ujat-program-application-form-volunteer-draft'

/**
 * 개인정보 수집·이용 / 제3자 제공·이용 동의 — 하단 안내 문구.
 * `form-editor-horizontal-table__bottom-input`(ParagraphInput 설명형) 전용 타이포·셸 스타일을 적용하지 않고 일반 텍스트로만 노출한다.
 */
export const PERSONAL_INFO_HORIZONTAL_TABLE_DISCLAIMER_PARAGRAPH_IDS = new Set<string>([
  PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection,
  PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent,
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection,
  PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.personalInfoCollection,
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.thirdPartyConsent,
  PROGRAM_PARTICIPANT_APPLICATION_IDS.personalInfoCollection,
  PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent,
  UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection,
  UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
  UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection,
  UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent,
])
