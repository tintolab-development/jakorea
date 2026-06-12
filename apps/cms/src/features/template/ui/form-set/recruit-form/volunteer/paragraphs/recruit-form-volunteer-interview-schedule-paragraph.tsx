import { VolunteerInterviewAvailableScheduleParagraph } from '@/features/template/ui/form-set/application-form/volunteer/paragraphs/volunteer-interview-available-schedule-paragraph'
import type { VolunteerInterviewScheduleEditSeed } from '@/features/program/shared/lib/volunteer-interview-schedule-edit-seed'
import type { UnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'

/** 봉사자 모집 폼 — 면접 진행 가능 일정(신청 폼 템플릿 UI 재사용) */
export function RecruitFormVolunteerInterviewScheduleParagraph({
  exceptionScheduleCount = 0,
  exceptionBlockKeys,
  onRemoveExceptionBlock,
  commonScheduleSeed,
  onCommonExclusionChange,
}: {
  exceptionScheduleCount?: number
  exceptionBlockKeys?: number[]
  onRemoveExceptionBlock?: (key: number) => void
  commonScheduleSeed?: VolunteerInterviewScheduleEditSeed
  onCommonExclusionChange?: (state: UnavailableDatesExclusionState) => void
}) {
  return (
    <VolunteerInterviewAvailableScheduleParagraph
      isTemplateAuthoringMode
      exceptionScheduleCount={exceptionScheduleCount}
      exceptionBlockKeys={exceptionBlockKeys}
      onRemoveExceptionBlock={onRemoveExceptionBlock}
      commonScheduleSeed={commonScheduleSeed}
      onCommonExclusionChange={onCommonExclusionChange}
    />
  )
}
