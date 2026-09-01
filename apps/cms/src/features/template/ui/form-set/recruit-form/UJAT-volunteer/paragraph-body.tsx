import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import type { VolunteerInterviewScheduleEditSeed } from '@/features/program/shared/lib/volunteer-interview-schedule-edit-seed'
import type { UjatRecruitParagraphProps } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import type { UnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { UJAT_RECRUIT_FORM_VOLUNTEER_IDS } from '@/features/template/model/ujat-recruit-form-volunteer-draft'
import { UjatRecruitVolunteerDetailInfoParagraph } from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/paragraphs/ujat-recruit-volunteer-detail-info-paragraph'
import { UjatRecruitVolunteerInfoParagraph } from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/paragraphs/ujat-recruit-volunteer-info-paragraph'
import { UjatRecruitVolunteerInterviewScheduleParagraph } from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/paragraphs/ujat-recruit-volunteer-interview-schedule-paragraph'

/** 템플릿 편집기 — UJAT 프로그램 봉사자 모집 폼 시드 단락 본문 */
export function renderUjatRecruitFormVolunteerParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled: boolean | undefined,
  options?: UjatRecruitParagraphProps,
  volunteerTemplateOptions?: {
    commonScheduleSeed?: VolunteerInterviewScheduleEditSeed
    onCommonExclusionChange?: (state: UnavailableDatesExclusionState) => void
  }
): ReactNode | null {
  if (!enabled) return null
  switch (paragraph.id) {
    case UJAT_RECRUIT_FORM_VOLUNTEER_IDS.recruitInfo:
      return <UjatRecruitVolunteerInfoParagraph {...options} />
    case UJAT_RECRUIT_FORM_VOLUNTEER_IDS.detailInfo:
      return <UjatRecruitVolunteerDetailInfoParagraph {...options} />
    case UJAT_RECRUIT_FORM_VOLUNTEER_IDS.interviewSchedule:
      return (
        <UjatRecruitVolunteerInterviewScheduleParagraph
          exceptionScheduleCount={options?.exceptionScheduleCount ?? 0}
          commonScheduleSeed={volunteerTemplateOptions?.commonScheduleSeed}
          onCommonExclusionChange={volunteerTemplateOptions?.onCommonExclusionChange}
          {...options}
        />
      )
    default:
      return null
  }
}
