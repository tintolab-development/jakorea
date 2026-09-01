import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS } from '@/features/template/model/gemini-visiting-training-application-form-instructor-draft'
import { GeminiInstructorAvailableScheduleParagraph } from '@/features/template/ui/form-set/application-form/gemini-instructor/paragraphs/gemini-instructor-available-schedule-paragraph'
import { GeminiInstructorOfficialDocumentParagraph } from '@/features/template/ui/form-set/application-form/gemini-instructor/paragraphs/gemini-instructor-official-document-paragraph'

/** Gemini 찾아가는 연수 강사 신청 폼 — 시드 단락 본문 */
export function renderGeminiVisitingTrainingApplicationFormInstructorParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled: boolean | undefined
): ReactNode | null {
  if (!enabled) return null
  switch (paragraph.id) {
    case GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule:
      return <GeminiInstructorAvailableScheduleParagraph />
    case GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS.officialDocument:
      return <GeminiInstructorOfficialDocumentParagraph />
    default:
      return null
  }
}
