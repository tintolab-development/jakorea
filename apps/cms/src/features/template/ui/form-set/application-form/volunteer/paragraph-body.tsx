import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/program-application-form-volunteer-draft'
import { VolunteerFreeTextItemsParagraph } from '@/features/template/ui/form-set/application-form/shared/volunteer-free-text-items-paragraph'
import { VolunteerInterviewAvailableScheduleParagraph } from '@/features/template/ui/form-set/application-form/volunteer/paragraphs/volunteer-interview-available-schedule-paragraph'
import { VolunteerPreviousJaProgramParagraph } from '@/features/template/ui/form-set/application-form/volunteer/paragraphs/volunteer-previous-ja-program-paragraph'
import type { VolunteerInterviewScheduleEditSeed } from '@/features/program/shared/lib/volunteer-interview-schedule-edit-seed'
import type { UnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'

export type ProgramApplicationFormVolunteerBodyOptions = {
  enabled: boolean
  /** 프로그램 상세 양식 수정·미리보기 — 등록·모집 설정 연동 면접 일정 UI */
  programLinkedPreview?: boolean
  isTemplateAuthoringMode?: boolean
  readOnlyPreview?: boolean
  exceptionScheduleCount?: number
  exceptionScheduleAddDisabled?: boolean
  onAddExceptionSchedule?: () => void
  onCommonExclusionChange?: (state: UnavailableDatesExclusionState) => void
  /** 모집 폼·프로그램에 등록된 면접 일정 시드 — 미지정 시 mock fallback */
  commonScheduleSeed?: VolunteerInterviewScheduleEditSeed
}

export function renderProgramApplicationFormVolunteerParagraphBody(
  paragraph: HorizontalTableParagraph,
  options: ProgramApplicationFormVolunteerBodyOptions | undefined
): ReactNode | null {
  if (options?.enabled !== true) return null
  switch (paragraph.id) {
    case PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousJaProgram:
      return <VolunteerPreviousJaProgramParagraph />
    case PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems:
      return <VolunteerFreeTextItemsParagraph />
    case PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule:
      return (
        <VolunteerInterviewAvailableScheduleParagraph
          isTemplateAuthoringMode={options.isTemplateAuthoringMode === true}
          readOnlyPreview={options.readOnlyPreview === true}
          exceptionScheduleCount={options.exceptionScheduleCount ?? 0}
          onCommonExclusionChange={options.onCommonExclusionChange}
          commonScheduleSeed={options.commonScheduleSeed}
        />
      )
    default:
      return null
  }
}
