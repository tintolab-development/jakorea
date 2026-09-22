import { useProgramDetailEditForm } from '@/features/program/general/hooks/use-program-detail-edit-form'
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
  const previewProgram = useUjatRecruitTemplateProgram(
    UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
    'volunteer'
  )
  const form = useProgramDetailEditForm({ program: previewProgram, isEditMode: true })

  return (
    <UjatRecruitVolunteerInfoProgramView
      program={previewProgram}
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
