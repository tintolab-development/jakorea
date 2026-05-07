import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { APPLICANT_RECRUIT_FORM_INDIVIDUAL_IDS } from '@/features/template/model/applicant-recruit-form-individual-draft'
import { ApplicantRecruitDetailInfoParagraph } from '@/features/template/ui/form-set/applicant-recruit-form-institution/paragraphs/applicant-recruit-detail-info-paragraph'
import { ApplicantRecruitIndividualParticipantInfoParagraph } from '@/features/template/ui/form-set/applicant-recruit-form-individual/paragraphs/applicant-recruit-individual-participant-info-paragraph'

/** 템플릿 편집기 — 프로그램 참여자 모집 폼 (개인) 시드 단락 본문 */
export function renderApplicantRecruitFormIndividualParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled: boolean | undefined
): ReactNode | null {
  if (!enabled) return null
  switch (paragraph.id) {
    case APPLICANT_RECRUIT_FORM_INDIVIDUAL_IDS.participantRecruitInfo:
      return <ApplicantRecruitIndividualParticipantInfoParagraph />
    case APPLICANT_RECRUIT_FORM_INDIVIDUAL_IDS.detailInfo:
      return (
        <ApplicantRecruitDetailInfoParagraph wysiwygResetKey="applicant-recruit-individual-extra-body" />
      )
    default:
      return null
  }
}
