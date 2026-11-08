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
  /**
   * 진행 희망 교육 일정 단락 노출 여부를 호출부가 이미 판정한 경우.
   * Portal은 form-bindings runtime 선택지까지 본 `shouldShowApplicationScheduleParagraphResolved`
   * 결과를 넘겨 개인 신청과 같은 규칙을 쓴다. 미지정이면 프로그램 정보만으로 판정(CMS).
   */
  scheduleParagraphVisible?: boolean
}

export function getInstitutionApplicationFormHiddenParagraphIds(
  input: InstitutionApplicationHiddenParagraphInput
): ReadonlySet<string> | undefined {
  const hidden = new Set<string>()
  if (input.preEducationNoticeRequired === false) {
    hidden.add(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance)
  }
  const scheduleParagraphVisible =
    input.scheduleParagraphVisible ?? shouldShowApplicationScheduleParagraph(input)
  if (!scheduleParagraphVisible) {
    hidden.add(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice)
  }
  if (input.showSexOffenseConsentInquiryParagraph === false) {
    hidden.add(PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod)
  }
  return hidden.size > 0 ? hidden : undefined
}
