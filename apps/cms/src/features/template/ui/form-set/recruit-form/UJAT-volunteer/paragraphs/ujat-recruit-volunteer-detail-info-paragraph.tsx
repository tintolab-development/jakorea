import { RecruitFormVolunteerDetailInfoParagraph } from '@/features/template/ui/form-set/recruit-form/volunteer/paragraphs/recruit-form-volunteer-detail-info-paragraph'
import type { UjatRecruitParagraphProps } from '@/features/program/ui/detail-modal/ujat-recruit-paragraph-props'
import {
  isUjatRecruitProgramContext,
  resolveUjatRecruitParagraphMode,
} from '@/features/program/ui/detail-modal/ujat-recruit-paragraph-props'
import { VolunteerDetailInfoSection } from '@/features/program/program-detail/ui/project-info/detail-info/project-info-detail-info-section'

/** UJAT 프로그램 봉사자 모집 폼 — 상세 정보 */
export function UjatRecruitVolunteerDetailInfoParagraph(props: UjatRecruitParagraphProps = {}) {
  if (isUjatRecruitProgramContext(props) && props.program) {
    const mode = resolveUjatRecruitParagraphMode(props)
    return (
      <VolunteerDetailInfoSection
        program={props.program}
        isEditMode={mode === 'edit'}
        form={props.form}
        onRegisterGetAdditionalContentHtml={props.onRegisterGetAdditionalContentHtml}
        sectionTitle={props.sectionTitle}
        sectionDescription={props.sectionDescription}
      />
    )
  }
  return <RecruitFormVolunteerDetailInfoParagraph />
}
