import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@/features/template/model/program-application-form-economy-draft'
import { EconomyProgramApplicationBasicInfoParagraph } from '@/features/template/ui/form-set/application-form/1c-1s/paragraphs/basic-info-paragraph'
import { EconomyProgramApplicationEducationExperienceParagraph } from '@/features/template/ui/form-set/application-form/1c-1s/paragraphs/education-experience-paragraph'
import { EconomyProgramApplicationGuidanceParagraph } from '@/features/template/ui/form-set/application-form/1c-1s/paragraphs/guidance-paragraph'
import { EconomyProgramApplicationLessonReplyParagraph } from '@/features/template/ui/form-set/application-form/1c-1s/paragraphs/lesson-reply-paragraph'
import { EconomyProgramApplicationPreferredScheduleParagraph } from '@/features/template/ui/form-set/application-form/1c-1s/paragraphs/preferred-schedule-paragraph'

/** 1사1교 프로그램 참여자 신청 폼 — 시드 단락 본문 */
export function renderEconomyProgramApplicationParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled: boolean | undefined
): ReactNode | null {
  if (!enabled) return null

  switch (paragraph.id) {
    case PROGRAM_APPLICATION_FORM_ECONOMY_IDS.basicInfo:
      return <EconomyProgramApplicationBasicInfoParagraph />
    case PROGRAM_APPLICATION_FORM_ECONOMY_IDS.guidance:
      return <EconomyProgramApplicationGuidanceParagraph />
    case PROGRAM_APPLICATION_FORM_ECONOMY_IDS.lessonReply:
      return <EconomyProgramApplicationLessonReplyParagraph />
    case PROGRAM_APPLICATION_FORM_ECONOMY_IDS.educationExperience:
      return <EconomyProgramApplicationEducationExperienceParagraph />
    case PROGRAM_APPLICATION_FORM_ECONOMY_IDS.preferredSchedule:
      return <EconomyProgramApplicationPreferredScheduleParagraph />
    default:
      return null
  }
}
