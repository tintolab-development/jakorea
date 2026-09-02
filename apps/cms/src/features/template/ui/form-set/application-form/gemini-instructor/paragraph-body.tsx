import type { ReactNode } from 'react'
import type { InstructorAvailableScheduleSlot } from '@/features/program/general/lib/instructor-application-available-schedule'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS } from '@/features/template/model/gemini-visiting-training-application-form-instructor-draft'
import { GeminiInstructorOfficialDocumentParagraph } from '@/features/template/ui/form-set/application-form/gemini-instructor/paragraphs/gemini-instructor-official-document-paragraph'
import { InstructorAvailableScheduleParagraph } from '@/features/template/ui/form-set/application-form/instructor/paragraphs/instructor-available-schedule-paragraph'

export type GeminiVisitingTrainingApplicationFormInstructorBodyOptions = {
  enabled: boolean
  scheduleSlots?: readonly InstructorAvailableScheduleSlot[]
  isTemplateAuthoringMode?: boolean
  readOnlyPreview?: boolean
}

/** Gemini 찾아가는 연수 강사 신청 폼 — 시드 단락 본문 */
export function renderGeminiVisitingTrainingApplicationFormInstructorParagraphBody(
  paragraph: HorizontalTableParagraph,
  options: GeminiVisitingTrainingApplicationFormInstructorBodyOptions | boolean | undefined
): ReactNode | null {
  const resolved =
    options === true
      ? { enabled: true as const }
      : options && typeof options === 'object'
        ? options
        : undefined
  if (resolved?.enabled !== true) return null
  switch (paragraph.id) {
    case GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule:
      return (
        <InstructorAvailableScheduleParagraph
          scheduleSlots={resolved.scheduleSlots}
          isTemplateAuthoringMode={resolved.isTemplateAuthoringMode === true}
          readOnlyPreview={resolved.readOnlyPreview === true}
          overlayKeyPrefix="application.gemini.instructor"
        />
      )
    case GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS.officialDocument:
      return <GeminiInstructorOfficialDocumentParagraph />
    default:
      return null
  }
}
