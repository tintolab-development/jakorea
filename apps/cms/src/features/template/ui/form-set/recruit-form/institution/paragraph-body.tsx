import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { APPLICANT_RECRUIT_FORM_INSTITUTION_IDS } from '@/features/template/model/applicant-recruit-form-institution-draft'
import {
  ApplicantRecruitParticipantInfoParagraph,
  type ApplicantRecruitParticipantInfoParagraphProps,
} from '@/features/template/ui/form-set/recruit-form/institution/paragraphs/applicant-recruit-participant-info-paragraph'
import { RecruitDetailInfoParagraph } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-paragraph'

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
      return (
        <RecruitDetailInfoParagraph
          wysiwygResetKey="applicant-recruit-institution-extra-body"
          overlayKeyPrefix="recruit.detailInfo"
          textFields={[
            { label: '프로그램 설명', placeholder: '프로그램 설명을 작성하세요' },
            { label: '모집 안내', placeholder: '모집 안내를 작성하세요' },
            { label: '지원 방법', placeholder: '지원 방법을 작성하세요' },
            { label: '학습 지원 내용', placeholder: '학습 지원 내용을 작성하세요' },
          ]}
        />
      )
    default:
      return null
  }
}
