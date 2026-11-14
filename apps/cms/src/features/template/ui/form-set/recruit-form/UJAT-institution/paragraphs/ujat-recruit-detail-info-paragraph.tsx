import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
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
import {
  RECRUIT_DETAIL_TEMPLATE_SPEC_CLASS,
  RECRUIT_TEMPLATE_DETAIL_PLACEHOLDERS,
  RECRUIT_TEMPLATE_UJAT_THUMBNAIL_BUTTON_LABEL,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-paragraph'
import { DetailInfoSection } from '@/features/program/shared/ui/program-detail/project-info/detail-info/project-info-detail-info-section'

const UJAT_PARTICIPANT_DETAIL_INFO_DESCRIPTION =
  '공란인 경우, 홈페이지 모집 상세에서 항목 미노출 됩니다.'

function UjatRecruitDetailInfoTypedTemplateEditor({ templateCode }: { templateCode: string }) {
  // 템플릿 관리 화면만 시안 치수·문구 — UJAT 등록 위저드도 같은 편집기를 쓰므로 화면으로 가른다
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
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
    // 템플릿 관리 시안(5800:157724) — 라벨 180·썸네일 62·에디터 높이, 첨부 안내·placeholder 시안 문구
    <div className={isTemplateManagementScreen ? RECRUIT_DETAIL_TEMPLATE_SPEC_CLASS : undefined}>
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
        // 템플릿 편집기는 단락 카드가 제목·설명을 이미 그린다 — 안쪽 제목 중복 방지
        hideFormHeader
        variant={isTemplateManagementScreen ? 'general' : undefined}
        placeholderOverrides={
          isTemplateManagementScreen ? RECRUIT_TEMPLATE_DETAIL_PLACEHOLDERS : undefined
        }
        thumbnailButtonLabel={
          isTemplateManagementScreen ? RECRUIT_TEMPLATE_UJAT_THUMBNAIL_BUTTON_LABEL : undefined
        }
      />
    </div>
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
