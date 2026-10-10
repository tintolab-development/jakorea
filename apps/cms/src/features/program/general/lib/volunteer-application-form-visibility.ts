import {
  getVolunteerApplicationFormHiddenParagraphIds as getVolunteerApplicationFormHiddenParagraphIdsFromSchema,
  resolveJaVolunteerExperienceFromParagraph as resolveJaVolunteerExperienceFromParagraphFromSchema,
  type JaVolunteerExperience,
} from '@jakorea/form-schema/program-application'
import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'

export type { JaVolunteerExperience }

export function resolveJaVolunteerExperienceFromParagraph(
  paragraph: WritingFormParagraph | undefined
): JaVolunteerExperience {
  return resolveJaVolunteerExperienceFromParagraphFromSchema(paragraph)
}

/**
 * 「있음」 선택 시에만 이전 참여 JA 봉사 프로그램 단락 노출(템플릿 작성 화면은 항상 노출)
 * · 면접 없음 시 면접 일정 단락 숨김
 */
export function getVolunteerApplicationFormHiddenParagraphIds(
  paragraphs: readonly WritingFormParagraph[],
  options?: { interviewEnabled?: boolean; isTemplateAuthoringMode?: boolean }
): ReadonlySet<string> | undefined {
  return getVolunteerApplicationFormHiddenParagraphIdsFromSchema(paragraphs, options)
}
