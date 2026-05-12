import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { RECRUIT_FORM_INSTRUCTOR_IDS } from '@/features/template/model/recruit-form-instructor-draft'
import { RecruitFormInstructorDetailInfoParagraph } from '@/features/template/ui/form-set/recruit-form/instructor/paragraphs/recruit-form-instructor-detail-info-paragraph'
import { RecruitFormInstructorInfoParagraph } from '@/features/template/ui/form-set/recruit-form/instructor/paragraphs/recruit-form-instructor-info-paragraph'

/** 템플릿 편집기 — 프로그램 강사 모집 폼 시드 단락 본문 */
export function renderRecruitFormInstructorParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled: boolean | undefined
): ReactNode | null {
  if (!enabled) return null
  switch (paragraph.id) {
    case RECRUIT_FORM_INSTRUCTOR_IDS.recruitInfo:
      return <RecruitFormInstructorInfoParagraph />
    case RECRUIT_FORM_INSTRUCTOR_IDS.detailInfo:
      return <RecruitFormInstructorDetailInfoParagraph />
    default:
      return null
  }
}
