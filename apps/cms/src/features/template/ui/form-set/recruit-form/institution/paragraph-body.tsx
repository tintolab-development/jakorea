import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { APPLICANT_RECRUIT_FORM_INSTITUTION_IDS } from '@/features/template/model/applicant-recruit-form-institution-draft'
import {
  ApplicantRecruitParticipantInfoParagraph,
  type ApplicantRecruitParticipantInfoParagraphProps,
} from '@/features/template/ui/form-set/recruit-form/institution/paragraphs/applicant-recruit-participant-info-paragraph'
import { ApplicantRecruitDetailInfoParagraph } from '@/features/template/ui/form-set/recruit-form/institution/paragraphs/applicant-recruit-detail-info-paragraph'

export type ApplicantRecruitFormInstitutionParagraphBodyOptions = {
  showInstitutionApplicationLimits?: boolean
  layoutVariant?: ApplicantRecruitParticipantInfoParagraphProps['layoutVariant']
  defaults?: ApplicantRecruitParticipantInfoParagraphProps['defaults']
}

/** 템플릿 편집기 — 프로그램 참여자 모집 폼 (학교) 시드 단락 본문 */
export function renderApplicantRecruitFormInstitutionParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled: boolean | undefined,
  options?: ApplicantRecruitFormInstitutionParagraphBodyOptions
): ReactNode | null {
  if (!enabled) return null
  const limitsProps: ApplicantRecruitParticipantInfoParagraphProps = {
    showInstitutionApplicationLimits: options?.showInstitutionApplicationLimits ?? true,
    layoutVariant: options?.layoutVariant,
    defaults: options?.defaults,
  }
  switch (paragraph.id) {
    case APPLICANT_RECRUIT_FORM_INSTITUTION_IDS.participantRecruitInfo:
      return <ApplicantRecruitParticipantInfoParagraph {...limitsProps} />
    case APPLICANT_RECRUIT_FORM_INSTITUTION_IDS.detailInfo:
      return <ApplicantRecruitDetailInfoParagraph />
    default:
      return null
  }
}
