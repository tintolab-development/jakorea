import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import type { UjatRecruitParagraphProps } from '@/features/program/ui/detail-modal/ujat-recruit-paragraph-props'
import { UJAT_RECRUIT_FORM_VOLUNTEER_IDS } from '@/features/template/model/ujat-recruit-form-volunteer-draft'
import { UjatRecruitVolunteerDetailInfoParagraph } from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/paragraphs/ujat-recruit-volunteer-detail-info-paragraph'
import { UjatRecruitVolunteerInfoParagraph } from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/paragraphs/ujat-recruit-volunteer-info-paragraph'
import { UjatRecruitVolunteerInterviewScheduleParagraph } from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/paragraphs/ujat-recruit-volunteer-interview-schedule-paragraph'

/** 템플릿 편집기 — UJAT 프로그램 봉사자 모집 폼 시드 단락 본문 */
export function renderUjatRecruitFormVolunteerParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled: boolean | undefined,
  options?: UjatRecruitParagraphProps
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
          {...options}
        />
      )
    default:
      return null
  }
}
