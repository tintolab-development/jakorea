import { RecruitDetailInfoParagraph } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-paragraph'
import { ujatVolunteerRecruitDetailInfoPrefix } from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'
import type { UjatRecruitParagraphProps } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import {
  isUjatRecruitProgramContext,
  resolveUjatRecruitParagraphMode,
} from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import { VolunteerDetailInfoSection } from '@/features/program/shared/ui/program-detail/project-info/detail-info/project-info-detail-info-section'

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
        sectionTitleOnly
      />
    )
  }
  const half = props.volunteerHalf ?? 'h1'
  return (
    <RecruitDetailInfoParagraph
      wysiwygResetKey={`ujat-recruit-volunteer-${half}-extra-body`}
      overlayKeyPrefix={ujatVolunteerRecruitDetailInfoPrefix(half)}
      textFields={[
        { label: '프로그램 설명', placeholder: '프로그램 설명을 작성하세요' },
        { label: '모집 안내', placeholder: '모집 안내를 작성하세요' },
        { label: '지원 방법', placeholder: '지원 방법을 작성하세요' },
        { label: '기타사항', placeholder: '기타 안내 사항을 작성하세요' },
      ]}
    />
  )
}
