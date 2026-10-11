import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '../paragraph-ids/program-application-form-institution-draft.js'
import {
  shouldShowApplicationScheduleParagraph,
  type ApplicationScheduleVisibilityInput,
} from './schedule-paragraph-visibility.js'

export type InstitutionApplicationHiddenParagraphInput = ApplicationScheduleVisibilityInput & {
  /** false면 안내 사항 단락 숨김. null/undefined는 필요(기본 true) */
  preEducationNoticeRequired?: boolean | null
  /** false면 성범죄 조회 방식 단락 숨김 (동의서 제출 요청 아님) */
  showSexOffenseConsentInquiryParagraph?: boolean
}

export function getInstitutionApplicationFormHiddenParagraphIds(
  input: InstitutionApplicationHiddenParagraphInput
): ReadonlySet<string> | undefined {
  const hidden = new Set<string>()
  if (input.preEducationNoticeRequired === false) {
    hidden.add(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance)
  }
  if (!shouldShowApplicationScheduleParagraph(input)) {
    hidden.add(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice)
  }
  if (input.showSexOffenseConsentInquiryParagraph === false) {
    hidden.add(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod)
  }
  return hidden.size > 0 ? hidden : undefined
}
