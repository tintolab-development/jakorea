import { useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import { VolunteerInterviewAvailableScheduleParagraph } from '@/features/template/ui/form-set/application-form/volunteer/paragraphs/volunteer-interview-available-schedule-paragraph'
import type { VolunteerInterviewScheduleEditSeed } from '@/features/program/shared/lib/volunteer-interview-schedule-edit-seed'
import type { UnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { useGeneralRecruitOverlayKv } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { normalizeRangeSealToLocalDayBounds } from '@/features/template/ui/form-set/shared/unavailable-dates-calendar-range'

/**
 * 봉사자 모집 폼 — 면접 진행 가능 일정(신청 폼 템플릿 UI 재사용).
 * Overlay KV(selectedSlotKeys/timeUnit/exception) 전용. 모집 행 DTO에는 슬롯 필드가 없다.
 */
export function RecruitFormVolunteerInterviewScheduleParagraph({
  exceptionScheduleCount = 0,
  exceptionBlockKeys,
  onRemoveExceptionBlock,
  commonScheduleSeed,
  onCommonExclusionChange,
  /** 템플릿 관리만 true — 프로그램 등록·상세 편집은 false */
  freezeUnavailableCalendar = false,
  overlayNamespace,
  interviewRangeSealKey,
  interviewPeriodRange: interviewPeriodRangeProp,
}: {
  exceptionScheduleCount?: number
  exceptionBlockKeys?: number[]
  onRemoveExceptionBlock?: (key: number) => void
  commonScheduleSeed?: VolunteerInterviewScheduleEditSeed
  onCommonExclusionChange?: (state: UnavailableDatesExclusionState) => void
  /** 템플릿 관리 화면 — 진행 불가일 모달 달력 샘플 고정 */
  freezeUnavailableCalendar?: boolean
  overlayNamespace?: string
  interviewRangeSealKey?: string
  interviewPeriodRange?: [Dayjs, Dayjs] | null
}) {
  const [interviewRangeSeal] = useGeneralRecruitOverlayKv<{ start: string; end: string } | null>(
    interviewRangeSealKey ?? 'recruit.volunteer.interviewRangeSeal',
    null
  )
  const interviewPeriodRangeFromOverlay = useMemo(
    () => normalizeRangeSealToLocalDayBounds(interviewRangeSeal),
    [interviewRangeSeal]
  )
  const interviewPeriodRange = interviewPeriodRangeProp ?? interviewPeriodRangeFromOverlay

  return (
    <VolunteerInterviewAvailableScheduleParagraph
      isTemplateAuthoringMode
      overlayStore="recruit"
      overlayNamespace={overlayNamespace}
      interviewRangeSealKey={interviewRangeSealKey}
      exceptionScheduleCount={exceptionScheduleCount}
      exceptionBlockKeys={exceptionBlockKeys}
      onRemoveExceptionBlock={onRemoveExceptionBlock}
      commonScheduleSeed={commonScheduleSeed}
      onCommonExclusionChange={onCommonExclusionChange}
      freezeUnavailableCalendar={freezeUnavailableCalendar}
      interviewPeriodRange={interviewPeriodRange}
    />
  )
}
