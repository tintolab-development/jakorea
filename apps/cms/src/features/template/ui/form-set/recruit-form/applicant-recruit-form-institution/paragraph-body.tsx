import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { APPLICANT_RECRUIT_FORM_INSTITUTION_IDS } from '@/features/template/model/applicant-recruit-form-institution-draft'
import { ApplicantRecruitDetailInfoParagraph } from '@/features/template/ui/form-set/recruit-form/applicant-recruit-form-institution/paragraphs/applicant-recruit-detail-info-paragraph'
import { ApplicantRecruitParticipantInfoParagraph } from '@/features/template/ui/form-set/recruit-form/applicant-recruit-form-institution/paragraphs/applicant-recruit-participant-info-paragraph'

/** 템플릿 편집기 — 프로그램 참여자 모집 폼 (학교) 시드 단락 본문 */
export function renderApplicantRecruitFormInstitutionParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled: boolean | undefined
): ReactNode | null {
  if (!enabled) return null
  switch (paragraph.id) {
    case APPLICANT_RECRUIT_FORM_INSTITUTION_IDS.participantRecruitInfo:
      return <ApplicantRecruitParticipantInfoParagraph />
    case APPLICANT_RECRUIT_FORM_INSTITUTION_IDS.detailInfo:
      return <ApplicantRecruitDetailInfoParagraph />
    default:
      return null
  }
}
