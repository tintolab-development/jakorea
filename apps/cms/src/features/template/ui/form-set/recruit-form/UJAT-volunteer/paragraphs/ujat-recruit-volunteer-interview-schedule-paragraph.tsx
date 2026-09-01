import { useMemo } from 'react'
import { useProgramDetailEditForm } from '@/features/program/general/hooks/use-program-detail-edit-form'
import { resolveUjatRecruitDisplayProgram } from '@/features/program/ujat/lib/ujat-recruit-display-program'
import { UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM } from '@/features/program/ujat/lib/ujat-volunteer-recruit-template-preview-program'
import type { VolunteerInterviewScheduleEditSeed } from '@/features/program/shared/lib/volunteer-interview-schedule-edit-seed'
import type { UjatRecruitParagraphProps } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import {
  isUjatRecruitProgramContext,
  resolveUjatRecruitParagraphMode,
} from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import type { UnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { UjatRecruitInterviewScheduleProgramView } from '@/features/program/ujat/ui/detail-modal/info/recruit-paragraph-views/interview-schedule-program'

function UjatRecruitVolunteerInterviewScheduleTemplateEditor() {
  const previewProgram = useMemo(
    () => resolveUjatRecruitDisplayProgram(UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM),
    []
  )
  const form = useProgramDetailEditForm({ program: previewProgram, isEditMode: true })

  return (
    <UjatRecruitInterviewScheduleProgramView
      program={previewProgram}
      form={form}
      isEdit
      volunteerHalf="h2"
    />
  )
}

/** UJAT 프로그램 봉사자 모집 폼 — 면접 진행 가능 일정 */
export function UjatRecruitVolunteerInterviewScheduleParagraph({
  exceptionScheduleCount: _exceptionScheduleCount = 0,
  commonScheduleSeed: _commonScheduleSeed,
  onCommonExclusionChange: _onCommonExclusionChange,
  ...props
}: UjatRecruitParagraphProps & {
  exceptionScheduleCount?: number
  commonScheduleSeed?: VolunteerInterviewScheduleEditSeed
  onCommonExclusionChange?: (state: UnavailableDatesExclusionState) => void
}) {
  if (isUjatRecruitProgramContext(props) && props.program) {
    const mode = resolveUjatRecruitParagraphMode(props)
    return (
      <UjatRecruitInterviewScheduleProgramView
        program={props.program}
        form={props.form}
        isEdit={mode === 'edit'}
        volunteerHalf={props.volunteerHalf}
        sectionTitle={props.sectionTitle}
      />
    )
  }

  return <UjatRecruitVolunteerInterviewScheduleTemplateEditor />
}
