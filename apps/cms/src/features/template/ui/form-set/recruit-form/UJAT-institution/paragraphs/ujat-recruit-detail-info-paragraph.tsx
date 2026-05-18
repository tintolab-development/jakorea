import { ApplicantRecruitDetailInfoParagraph } from '@/features/template/ui/form-set/recruit-form/institution/paragraphs/applicant-recruit-detail-info-paragraph'
import type { UjatRecruitParagraphProps } from '@/features/program/ui/detail-modal/ujat-recruit-paragraph-props'
import {
  isUjatRecruitProgramContext,
  resolveUjatRecruitParagraphMode,
} from '@/features/program/ui/detail-modal/ujat-recruit-paragraph-props'
import { DetailInfoSection } from '@/features/program/program-detail/ui/project-info/detail-info/project-info-detail-info-section'

/** UJAT 프로그램 학교 모집 폼 — 상세 정보 */
export function UjatRecruitDetailInfoParagraph(props: UjatRecruitParagraphProps = {}) {
  if (isUjatRecruitProgramContext(props) && props.program) {
    const mode = resolveUjatRecruitParagraphMode(props)
    return (
      <DetailInfoSection
        program={props.program}
        isEditMode={mode === 'edit'}
        form={props.form}
        onRegisterGetAdditionalContentHtml={props.onRegisterGetAdditionalContentHtml}
        showThumbnail
        sectionTitle={props.sectionTitle}
        sectionTitleOnly
      />
    )
  }
  return <ApplicantRecruitDetailInfoParagraph wysiwygResetKey="ujat-recruit-institution-extra-body" />
}
