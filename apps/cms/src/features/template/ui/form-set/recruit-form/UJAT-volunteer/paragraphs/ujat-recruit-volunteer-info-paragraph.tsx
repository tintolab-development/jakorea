import type { Program } from '@/types/domain'
import { useProgramDetailEditForm } from '@/features/program/general/hooks/use-program-detail-edit-form'
import {
  programToUjatRecruitTemplateFormValues,
  useUjatRecruitTemplateFormOverlaySync,
} from '@/features/program/ujat/lib/use-ujat-recruit-template-form-overlay-sync'
import { useUjatRecruitTemplateProgram } from '@/features/program/ujat/lib/use-ujat-recruit-template-program'
import { UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM } from '@/features/program/ujat/lib/ujat-volunteer-recruit-template-preview-program'
import type { UjatRecruitParagraphProps } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import {
  isUjatRecruitProgramContext,
  resolveUjatRecruitParagraphMode,
} from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import { UjatRecruitVolunteerInfoProgramView } from '@/features/program/ujat/ui/detail-modal/info/recruit-paragraph-views/volunteer-info-program'
import '@/features/program/ujat/ui/detail-modal/info/recruit-paragraph-views/volunteer-info-program.css'

function UjatRecruitVolunteerInfoTemplateEditor({
  volunteerHalf = 'h2',
}: {
  volunteerHalf?: 'h1' | 'h2'
}) {
  const { program, revision } = useUjatRecruitTemplateProgram(
    UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
    'volunteer',
    volunteerHalf
  )
  return (
    <UjatRecruitVolunteerInfoTemplateEditorForm
      program={program}
      revision={revision}
      volunteerHalf={volunteerHalf}
    />
  )
}

function UjatRecruitVolunteerInfoTemplateEditorForm({
  program,
  revision,
  volunteerHalf,
}: {
  program: Program
  revision: number
  volunteerHalf: 'h1' | 'h2'
}) {
  const form = useProgramDetailEditForm({
    program,
    isEditMode: true,
    resetOnProgramChange: false,
    mapToValues: next => programToUjatRecruitTemplateFormValues(next, 'volunteer', volunteerHalf),
  })
  useUjatRecruitTemplateFormOverlaySync(form, 'volunteer', program, revision, volunteerHalf)

  return (
    <UjatRecruitVolunteerInfoProgramView
      program={program}
      sponsorName={program.managerName}
      form={form}
      isEdit
      volunteerHalf={volunteerHalf}
      showNoticeExposure={volunteerHalf === 'h2'}
      hideSectionHeader
      isTemplateAuthoring
    />
  )
}

/** UJAT 프로그램 봉사자 모집 폼 — 봉사자 모집 정보 */
export function UjatRecruitVolunteerInfoParagraph(props: UjatRecruitParagraphProps = {}) {
  if (isUjatRecruitProgramContext(props) && props.program) {
    const mode = resolveUjatRecruitParagraphMode(props)
    const half = props.volunteerHalf ?? 'h1'
    return (
      <UjatRecruitVolunteerInfoProgramView
        program={props.program}
        sponsorName={props.sponsorName}
        form={props.form}
        isEdit={mode === 'edit'}
        volunteerHalf={half}
        showNoticeExposure={half === 'h2'}
        sectionTitle={props.sectionTitle}
      />
    )
  }
  return <UjatRecruitVolunteerInfoTemplateEditor volunteerHalf={props.volunteerHalf ?? 'h2'} />
}
