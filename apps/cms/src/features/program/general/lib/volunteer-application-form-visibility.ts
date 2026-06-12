import {
  PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS,
  PROGRAM_VOLUNTEER_JA_EXPERIENCE_OPTION_IDS,
} from '@/features/template/model/program-application-form-volunteer-draft'
import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'

export type JaVolunteerExperience = 'yes' | 'no' | undefined

export function resolveJaVolunteerExperienceFromParagraph(
  paragraph: WritingFormParagraph | undefined
): JaVolunteerExperience {
  if (!paragraph || paragraph.variant !== 'multiple_choice') return undefined
  const selectedId = paragraph.selectedPreviewSingleId
  if (selectedId === PROGRAM_VOLUNTEER_JA_EXPERIENCE_OPTION_IDS.yes) return 'yes'
  if (selectedId === PROGRAM_VOLUNTEER_JA_EXPERIENCE_OPTION_IDS.no) return 'no'
  return undefined
}

/** 「있음」 선택 시에만 이전 참여 JA 봉사 프로그램 단락 노출 */
export function getVolunteerApplicationFormHiddenParagraphIds(
  paragraphs: readonly WritingFormParagraph[]
): ReadonlySet<string> | undefined {
  const experienceParagraph = paragraphs.find(
    p => p.id === PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.jaVolunteerExperience
  )
  const experience = resolveJaVolunteerExperienceFromParagraph(experienceParagraph)
  if (experience === 'yes') return undefined
  return new Set([PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousJaProgram])
}
