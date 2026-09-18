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
  /** 템플릿 관리만 true — 프로그램 등록·상세 편집은 false */
  freezeUnavailableCalendar = false,
}: {
  exceptionScheduleCount?: number
  exceptionBlockKeys?: number[]
  onRemoveExceptionBlock?: (key: number) => void
  commonScheduleSeed?: VolunteerInterviewScheduleEditSeed
  onCommonExclusionChange?: (state: UnavailableDatesExclusionState) => void
  /** 템플릿 관리 화면 — 진행 불가일 모달 달력 샘플 고정 */
  freezeUnavailableCalendar?: boolean
}) {
  return (
    <VolunteerInterviewAvailableScheduleParagraph
      isTemplateAuthoringMode
      overlayStore="recruit"
      exceptionScheduleCount={exceptionScheduleCount}
      exceptionBlockKeys={exceptionBlockKeys}
      onRemoveExceptionBlock={onRemoveExceptionBlock}
      commonScheduleSeed={commonScheduleSeed}
      onCommonExclusionChange={onCommonExclusionChange}
      freezeUnavailableCalendar={freezeUnavailableCalendar}
    />
  )
}
