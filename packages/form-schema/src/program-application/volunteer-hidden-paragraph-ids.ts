import {
  PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS,
  PROGRAM_VOLUNTEER_JA_EXPERIENCE_OPTION_IDS,
} from '../paragraph-ids/program-application-form-volunteer-draft.js'

export type VolunteerApplicationParagraphLike = {
  id: string
  variant?: string
  selectedPreviewSingleId?: string | null
}

export type JaVolunteerExperience = 'yes' | 'no' | undefined

export function resolveJaVolunteerExperienceFromParagraph(
  paragraph: VolunteerApplicationParagraphLike | undefined
): JaVolunteerExperience {
  if (!paragraph || paragraph.variant !== 'multiple_choice') return undefined
  const selectedId = paragraph.selectedPreviewSingleId
  if (selectedId === PROGRAM_VOLUNTEER_JA_EXPERIENCE_OPTION_IDS.yes) return 'yes'
  if (selectedId === PROGRAM_VOLUNTEER_JA_EXPERIENCE_OPTION_IDS.no) return 'no'
  return undefined
}

export function getVolunteerApplicationFormHiddenParagraphIds(
  paragraphs: readonly VolunteerApplicationParagraphLike[],
  options?: { interviewEnabled?: boolean; isTemplateAuthoringMode?: boolean }
): ReadonlySet<string> | undefined {
  const hidden = new Set<string>()

  if (options?.isTemplateAuthoringMode !== true) {
    const experienceParagraph = paragraphs.find(
      p => p.id === PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.jaVolunteerExperience
    )
    const experience = resolveJaVolunteerExperienceFromParagraph(experienceParagraph)
    if (experience !== 'yes') {
      hidden.add(PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousJaProgram)
    }
  }

  if (options?.interviewEnabled === false) {
    hidden.add(PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule)
  }

  return hidden.size > 0 ? hidden : undefined
}
