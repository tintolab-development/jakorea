import { useMemo } from 'react'
import { useProgramDetailEditForm } from '@/features/program/general/hooks/use-program-detail-edit-form'
import { UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM } from '@/features/program/ujat/lib/ujat-institution-recruit-template-preview-program'
import { resolveUjatRecruitDisplayProgram } from '@/features/program/ujat/lib/ujat-recruit-display-program'
import type { UjatRecruitParagraphProps } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import {
  isUjatRecruitProgramContext,
  resolveUjatRecruitParagraphMode,
} from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import { UjatRecruitParticipantInfoProgramView } from '@/features/program/ujat/ui/detail-modal/info/recruit-paragraph-views/participant-info-program'

function UjatRecruitParticipantInfoTemplateEditor() {
  const previewProgram = useMemo(
    () => resolveUjatRecruitDisplayProgram(UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM),
    []
  )
  const form = useProgramDetailEditForm({ program: previewProgram, isEditMode: true })

  return (
    <UjatRecruitParticipantInfoProgramView
      program={previewProgram}
      form={form}
      isEdit
      hideSectionHeader
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
