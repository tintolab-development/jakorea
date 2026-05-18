import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import type { UjatRecruitParagraphProps } from '@/features/program/ui/detail-modal/ujat-recruit-paragraph-props'
import { UJAT_RECRUIT_FORM_INSTITUTION_IDS } from '@/features/template/model/ujat-recruit-form-institution-draft'
import { UjatRecruitDetailInfoParagraph } from '@/features/template/ui/form-set/recruit-form/UJAT-institution/paragraphs/ujat-recruit-detail-info-paragraph'
import { UjatRecruitParticipantInfoParagraph } from '@/features/template/ui/form-set/recruit-form/UJAT-institution/paragraphs/ujat-recruit-participant-info-paragraph'

/** 템플릿 편집기 — UJAT 프로그램 학교 모집 폼 시드 단락 본문 */
export function renderUjatRecruitFormInstitutionParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled: boolean | undefined,
  options?: UjatRecruitParagraphProps
): ReactNode | null {
  if (!enabled) return null
  switch (paragraph.id) {
    case UJAT_RECRUIT_FORM_INSTITUTION_IDS.participantRecruitInfo:
      return <UjatRecruitParticipantInfoParagraph {...options} />
    case UJAT_RECRUIT_FORM_INSTITUTION_IDS.detailInfo:
      return <UjatRecruitDetailInfoParagraph {...options} />
    default:
      return null
  }
}
