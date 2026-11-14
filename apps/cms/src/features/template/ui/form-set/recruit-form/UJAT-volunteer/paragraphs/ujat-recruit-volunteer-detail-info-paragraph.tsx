import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
import {
  RECRUIT_DETAIL_TEMPLATE_SPEC_CLASS,
  RECRUIT_TEMPLATE_DETAIL_PLACEHOLDERS,
  RECRUIT_TEMPLATE_UJAT_THUMBNAIL_BUTTON_LABEL,
  RecruitDetailInfoParagraph,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-paragraph'
import { ujatVolunteerRecruitDetailInfoPrefix } from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'
import { useProgramDetailEditForm } from '@/features/program/general/hooks/use-program-detail-edit-form'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM } from '@/features/program/ujat/lib/ujat-volunteer-recruit-template-preview-program'
import { useUjatRecruitTemplateFormTypedSync } from '@/features/program/ujat/lib/ujat-recruit-template-typed-state'
import type { UjatRecruitParagraphProps } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import {
  isUjatRecruitProgramContext,
  resolveUjatRecruitParagraphMode,
} from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import { VolunteerDetailInfoSection } from '@/features/program/shared/ui/program-detail/project-info/detail-info/project-info-detail-info-section'

function UjatRecruitVolunteerDetailInfoTypedTemplateEditor({
  templateCode,
  volunteerHalf,
}: {
  templateCode: string
  volunteerHalf: 'h1' | 'h2'
}) {
  // 템플릿 관리 화면만 시안 치수·문구 — UJAT 등록 위저드도 같은 편집기를 쓰므로 화면으로 가른다
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const program = UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM
  const form = useProgramDetailEditForm({
    program,
    isEditMode: true,
    resetOnProgramChange: false,
    mapToValues: programToDetailEditValues,
  })
  useUjatRecruitTemplateFormTypedSync(form, {
    templateCode,
    kind: 'volunteer',
    volunteerHalf,
  })
  return (
    // 템플릿 관리 시안(5800:158529) — 라벨 180·썸네일 62·에디터 높이, 첨부 안내·placeholder 시안 문구
    <div className={isTemplateManagementScreen ? RECRUIT_DETAIL_TEMPLATE_SPEC_CLASS : undefined}>
      <VolunteerDetailInfoSection
        program={program}
        isEditMode
        form={form}
        sectionTitle="상세 정보"
        sectionTitleOnly
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
        hideFormHeader={props.hideSectionHeader}
      />
    )
  }
  const half = props.volunteerHalf ?? 'h1'
  if (props.templateAuthoring && props.templateCode) {
    return (
      <UjatRecruitVolunteerDetailInfoTypedTemplateEditor
        templateCode={props.templateCode}
        volunteerHalf={half}
      />
    )
  }
  return (
    <RecruitDetailInfoParagraph
      wysiwygResetKey={`ujat-recruit-volunteer-${half}-extra-body`}
      overlayKeyPrefix={ujatVolunteerRecruitDetailInfoPrefix(half)}
      textFields={[
        { label: '프로그램 설명', placeholder: '프로그램 설명을 작성하세요' },
        { label: '모집 안내', placeholder: '모집 안내를 작성하세요' },
        { label: '지원 방법', placeholder: '지원 방법을 작성하세요' },
      ]}
      afterEditorFields={[{ label: '기타사항', placeholder: '기타 안내 사항을 작성하세요' }]}
    />
  )
}
