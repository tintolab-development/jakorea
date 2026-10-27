import { ApplicantRecruitDetailInfoParagraph } from '@/features/template/ui/form-set/recruit-form/institution/paragraphs/applicant-recruit-detail-info-paragraph'
import { useProgramDetailEditForm } from '@/features/program/general/hooks/use-program-detail-edit-form'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM } from '@/features/program/ujat/lib/ujat-institution-recruit-template-preview-program'
import { useUjatRecruitTemplateFormTypedSync } from '@/features/program/ujat/lib/ujat-recruit-template-typed-state'
import type { UjatRecruitParagraphProps } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import {
  isUjatRecruitProgramContext,
  resolveUjatRecruitParagraphMode,
} from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import { DetailInfoSection } from '@/features/program/shared/ui/program-detail/project-info/detail-info/project-info-detail-info-section'

const UJAT_PARTICIPANT_DETAIL_INFO_DESCRIPTION =
  '공란인 경우, 홈페이지 모집 상세에서 항목 미노출 됩니다.'

function UjatRecruitDetailInfoTypedTemplateEditor({
  templateCode,
}: {
  templateCode: string
}) {
  const program = UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM
  const form = useProgramDetailEditForm({
    program,
    isEditMode: true,
    resetOnProgramChange: false,
    mapToValues: programToDetailEditValues,
  })
  useUjatRecruitTemplateFormTypedSync(form, {
    templateCode,
    kind: 'institution',
  })
  return (
    <DetailInfoSection
      program={program}
      isEditMode
      form={form}
      showThumbnail
      showRecruitmentMethod
      recruitmentMethodLabel="지원 방법"
      sectionTitle="상세 정보"
      sectionDescription={UJAT_PARTICIPANT_DETAIL_INFO_DESCRIPTION}
      emptyReadDisplay="dash"
      textFieldControl="input"
    />
  )
}

/** UJAT 프로그램 학교 모집 폼 — 참여자 상세 정보 */
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
        showRecruitmentMethod
        recruitmentMethodLabel="지원 방법"
        sectionTitle={props.sectionTitle ?? '상세 정보'}
        sectionDescription={UJAT_PARTICIPANT_DETAIL_INFO_DESCRIPTION}
        emptyReadDisplay="dash"
        textFieldControl="input"
        hideFormHeader={props.hideSectionHeader}
      />
    )
  }
  if (props.templateAuthoring && props.templateCode) {
    return <UjatRecruitDetailInfoTypedTemplateEditor templateCode={props.templateCode} />
  }
  return (
    <ApplicantRecruitDetailInfoParagraph
      wysiwygResetKey="ujat-recruit-institution-extra-body"
      overlayKeyPrefix="ujatRecruit.detailInfo"
      textFieldControl="input"
    />
  )
}
