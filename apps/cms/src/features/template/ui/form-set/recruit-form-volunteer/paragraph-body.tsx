import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { RECRUIT_FORM_VOLUNTEER_IDS } from '@/features/template/model/recruit-form-volunteer-draft'
import { RecruitFormVolunteerDetailInfoParagraph } from '@/features/template/ui/form-set/recruit-form-volunteer/paragraphs/recruit-form-volunteer-detail-info-paragraph'
import { RecruitFormVolunteerInfoParagraph } from '@/features/template/ui/form-set/recruit-form-volunteer/paragraphs/recruit-form-volunteer-info-paragraph'
import { RecruitFormVolunteerInterviewScheduleParagraph } from '@/features/template/ui/form-set/recruit-form-volunteer/paragraphs/recruit-form-volunteer-interview-schedule-paragraph'

/** 템플릿 편집기 — 프로그램 봉사자 모집 폼 시드 단락 본문 */
export function renderRecruitFormVolunteerParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled: boolean | undefined
): ReactNode | null {
  if (!enabled) return null
  switch (paragraph.id) {
    case RECRUIT_FORM_VOLUNTEER_IDS.recruitInfo:
      return <RecruitFormVolunteerInfoParagraph />
    case RECRUIT_FORM_VOLUNTEER_IDS.detailInfo:
      return <RecruitFormVolunteerDetailInfoParagraph />
    case RECRUIT_FORM_VOLUNTEER_IDS.interviewSchedule:
      return <RecruitFormVolunteerInterviewScheduleParagraph />
    default:
      return null
  }
}

