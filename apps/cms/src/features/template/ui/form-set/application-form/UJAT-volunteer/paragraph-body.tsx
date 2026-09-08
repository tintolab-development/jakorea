import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import { UjatProgramApplicationVolunteerBasicInfoParagraph } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/paragraphs/ujat-program-application-volunteer-basic-info-paragraph'
import { UjatProgramApplicationVolunteerEducationExperienceParagraph } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/paragraphs/ujat-program-application-volunteer-education-experience-paragraph'
import { UjatProgramApplicationVolunteerFreeTextParagraph } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/paragraphs/ujat-program-application-volunteer-free-text-paragraph'
import { UjatProgramApplicationVolunteerInterviewScheduleParagraph } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/paragraphs/ujat-program-application-volunteer-interview-schedule-paragraph'
import { UjatProgramApplicationVolunteerPreferredRegionParagraph } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/paragraphs/ujat-program-application-volunteer-preferred-region-paragraph'
import { UjatProgramApplicationVolunteerPreviousTermParagraph } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/paragraphs/ujat-program-application-volunteer-previous-term-paragraph'

export type UjatProgramApplicationVolunteerType = 'new' | 'ujat-graduate'

export type UjatProgramApplicationVolunteerBodyOptions = {
  enabled: boolean
  applicationType: UjatProgramApplicationVolunteerType
  onApplicationTypeChange: (next: UjatProgramApplicationVolunteerType) => void
  isTemplateAuthoringMode?: boolean
  /** 사용자 작성 모드 — 제출 확인 MC `N기` 치환용(모집 폼 활동 기수) */
  recruitCohortLabel?: string
}

/** 템플릿 편집기 — UJAT 프로그램 봉사자 신청 폼 시드 단락 본문 */
export function renderUjatProgramApplicationFormVolunteerParagraphBody(
  paragraph: HorizontalTableParagraph,
  options: UjatProgramApplicationVolunteerBodyOptions | undefined
): ReactNode | null {
  if (options?.enabled !== true) return null
  switch (paragraph.id) {
    case UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.basicInfo:
      return (
        <UjatProgramApplicationVolunteerBasicInfoParagraph
          applicationType={options.applicationType}
          onApplicationTypeChange={options.onApplicationTypeChange}
        />
      )
    case UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousTerm:
      if (options.isTemplateAuthoringMode !== true && options.applicationType === 'new') {
        return null
      }
      return <UjatProgramApplicationVolunteerPreviousTermParagraph />
    case UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.preferredRegion:
      return <UjatProgramApplicationVolunteerPreferredRegionParagraph />
    case UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.educationExperience:
      return <UjatProgramApplicationVolunteerEducationExperienceParagraph />
    case UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule:
      return (
        <UjatProgramApplicationVolunteerInterviewScheduleParagraph
          isTemplateAuthoringMode={options.isTemplateAuthoringMode !== false}
        />
      )
    case UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems:
      if (options.isTemplateAuthoringMode !== true && options.applicationType === 'ujat-graduate') {
        return null
      }
      return <UjatProgramApplicationVolunteerFreeTextParagraph />
    default:
      return null
  }
}
