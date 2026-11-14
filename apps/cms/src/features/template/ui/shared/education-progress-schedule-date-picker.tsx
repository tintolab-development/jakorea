import type { Dayjs } from 'dayjs'
import { shouldLockProgressSchedulePeriodToggle } from '@/features/program/general/lib/schedule-detail-form'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'

export type EducationProgressScheduleDatePickerProps = {
  participantIndividual: boolean
  participantOrganization: boolean
  programType: 'curriculum' | 'schedule'
  sessionRound: 'single' | 'multi'
  directEventDateOnly?: boolean
  value: Dayjs | null
  onChange: (next: Dayjs | null) => void
  onRangeChange: (range: [Dayjs, Dayjs]) => void
  appliedSurfaceRange?: [Dayjs, Dayjs] | null
  appliedSurfaceWithTime?: boolean
  width?: number | string
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  disabledDate?: (date: Dayjs) => boolean
}

/** 등록·공통정보 「진행 일정」 — 기간/시간 토글 정책 SSOT */
export function EducationProgressScheduleDatePicker({
  participantIndividual,
  participantOrganization,
  programType,
  sessionRound,
  directEventDateOnly = false,
  value,
  onChange,
  onRangeChange,
  appliedSurfaceRange,
  appliedSurfaceWithTime = false,
  width = '100%',
  placeholder = '날짜를 선택해 주세요',
  disabled,
  readOnly,
  disabledDate,
}: EducationProgressScheduleDatePickerProps) {
  const lockPeriodToggleOn =
    directEventDateOnly ||
    shouldLockProgressSchedulePeriodToggle({
      participantIndividual,
      participantOrganization,
      programType,
      sessionRound,
    })
  return (
    <ParagraphDatePicker
      mode="single"
      presetMode="schedule"
      customizable={false}
      lockTimeToggleOn
      showTimeToggle={false}
      showPeriodToggle={!directEventDateOnly}
      lockPeriodToggleOn={lockPeriodToggleOn}
      suppressAutoTodayWhenEmpty
      value={value}
      onChange={onChange}
      onRangeChange={onRangeChange}
      appliedSurfaceRange={appliedSurfaceRange}
      appliedSurfaceWithTime={appliedSurfaceWithTime}
      width={width}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      disabledDate={disabledDate}
    />
  )
}
