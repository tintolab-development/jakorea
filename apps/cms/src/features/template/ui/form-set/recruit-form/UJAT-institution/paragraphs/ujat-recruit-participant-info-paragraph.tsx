import type { Program } from '@/types/domain'
import { useProgramDetailEditForm } from '@/features/program/general/hooks/use-program-detail-edit-form'
import { UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM } from '@/features/program/ujat/lib/ujat-institution-recruit-template-preview-program'
import { useUjatRecruitTemplateProgram } from '@/features/program/ujat/lib/use-ujat-recruit-template-program'
import type { UjatRecruitParagraphProps } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import {
  isUjatRecruitProgramContext,
  resolveUjatRecruitParagraphMode,
} from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import { UjatRecruitParticipantInfoProgramView } from '@/features/program/ujat/ui/detail-modal/info/recruit-paragraph-views/participant-info-program'

function UjatRecruitParticipantInfoTemplateEditor() {
  const { program, revision } = useUjatRecruitTemplateProgram(
    UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
    'institution'
  )
  return <UjatRecruitParticipantInfoTemplateEditorForm key={revision} program={program} />
}

function UjatRecruitParticipantInfoTemplateEditorForm({ program }: { program: Program }) {
  const form = useProgramDetailEditForm({ program, isEditMode: true })

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
      />
    )
  }
  return <UjatRecruitParticipantInfoTemplateEditor />
}
