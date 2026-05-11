import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/program-application-form-volunteer-draft'
import { VolunteerInterviewAvailableScheduleParagraph } from '@/features/template/ui/form-set/application-form/volunteer/paragraphs/volunteer-interview-available-schedule-paragraph'

export type ProgramApplicationFormVolunteerBodyOptions = {
  enabled: boolean
  isTemplateAuthoringMode?: boolean
}

export function renderProgramApplicationFormVolunteerParagraphBody(
  paragraph: HorizontalTableParagraph,
  options: ProgramApplicationFormVolunteerBodyOptions | undefined
): ReactNode | null {
  if (options?.enabled !== true) return null
  switch (paragraph.id) {
    case PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule:
      return (
        <VolunteerInterviewAvailableScheduleParagraph
          isTemplateAuthoringMode={options.isTemplateAuthoringMode === true}
        />
      )
    default:
      return null
  }
}
