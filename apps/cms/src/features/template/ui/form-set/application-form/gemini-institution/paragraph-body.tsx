import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/gemini-visiting-training-application-form-institution-draft'
import { GeminiVisitingTrainingContactPersonParagraph } from '@/features/template/ui/form-set/application-form/gemini-institution/paragraphs/gemini-contact-person-paragraph'
import { GeminiVisitingTrainingPreferredScheduleParagraph } from '@/features/template/ui/form-set/application-form/gemini-institution/paragraphs/gemini-preferred-schedule-paragraph'
import { GeminiVisitingTrainingTrainingInfoParagraph } from '@/features/template/ui/form-set/application-form/gemini-institution/paragraphs/gemini-training-info-paragraph'

/** Gemini 찾아가는 연수 참여 기관 신청 폼 — 시드 단락 본문 */
export function renderGeminiVisitingTrainingApplicationFormInstitutionParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled: boolean | undefined
): ReactNode | null {
  if (!enabled) return null
  switch (paragraph.id) {
    case GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.trainingInfo:
      return <GeminiVisitingTrainingTrainingInfoParagraph />
    case GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.contactPerson:
      return <GeminiVisitingTrainingContactPersonParagraph />
    case GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule:
      return <GeminiVisitingTrainingPreferredScheduleParagraph />
    default:
      return null
  }
}
