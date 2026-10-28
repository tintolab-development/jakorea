import type { Program } from '@/types/domain'
import { useProgramDetailEditForm } from '@/features/program/general/hooks/use-program-detail-edit-form'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM } from '@/features/program/ujat/lib/ujat-institution-recruit-template-preview-program'
import {
  programToUjatRecruitTemplateFormValues,
  useUjatRecruitTemplateFormOverlaySync,
} from '@/features/program/ujat/lib/use-ujat-recruit-template-form-overlay-sync'
import { useUjatRecruitTemplateFormTypedSync } from '@/features/program/ujat/lib/ujat-recruit-template-typed-state'
import { useUjatRecruitTemplateProgram } from '@/features/program/ujat/lib/use-ujat-recruit-template-program'
import type { UjatRecruitParagraphProps } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import {
  isUjatRecruitProgramContext,
  resolveUjatRecruitParagraphMode,
} from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import { UjatRecruitParticipantInfoProgramView } from '@/features/program/ujat/ui/detail-modal/info/recruit-paragraph-views/participant-info-program'

function UjatRecruitParticipantInfoTemplateEditor({
  templateCode,
  templateAuthoring,
}: {
  templateCode?: string
  templateAuthoring?: boolean
}) {
  if (templateAuthoring && templateCode) {
    return <UjatRecruitParticipantInfoTypedTemplateEditor templateCode={templateCode} />
  }
  return <UjatRecruitParticipantInfoLegacyTemplateEditor />
}

function UjatRecruitParticipantInfoLegacyTemplateEditor() {
  const { program, revision } = useUjatRecruitTemplateProgram(
    UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
    'institution'
  )
  return <UjatRecruitParticipantInfoTemplateEditorForm program={program} revision={revision} />
}

function UjatRecruitParticipantInfoTypedTemplateEditor({
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
    <UjatRecruitParticipantInfoProgramView
      program={program}
      sponsorName={program.managerName}
      form={form}
      isEdit
      hideSectionHeader
      isTemplateAuthoring
    />
  )
}

function UjatRecruitParticipantInfoTemplateEditorForm({
  program,
  revision,
}: {
  program: Program
  revision: number
}) {
  const form = useProgramDetailEditForm({
    program,
    isEditMode: true,
    resetOnProgramChange: false,
    mapToValues: next => programToUjatRecruitTemplateFormValues(next, 'institution'),
  })
  useUjatRecruitTemplateFormOverlaySync(form, 'institution', program, revision)

  return (
    <UjatRecruitParticipantInfoProgramView
      program={program}
      sponsorName={program.managerName}
      form={form}
      isEdit
      hideSectionHeader
      isTemplateAuthoring
    />
  )
}

/** UJAT 프로그램 학교 모집 폼 — 참여자 모집 정보 */
export function UjatRecruitParticipantInfoParagraph(props: UjatRecruitParagraphProps = {}) {
  if (isUjatRecruitProgramContext(props) && props.program) {
    const mode = resolveUjatRecruitParagraphMode(props)
    return (
      <UjatRecruitParticipantInfoProgramView
        program={props.program}
        sponsorName={props.sponsorName}
        form={props.form}
        isEdit={mode === 'edit'}
        sectionTitle={props.sectionTitle}
        highlightParagraphId={props.highlightParagraphId}
        hideSectionHeader={props.hideSectionHeader}
      />
    )
  }
  return (
    <UjatRecruitParticipantInfoTemplateEditor
      templateCode={props.templateCode}
      templateAuthoring={props.templateAuthoring}
    />
  )
}
