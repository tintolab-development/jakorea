import type { CSSProperties, ReactNode } from 'react'
import type { Dayjs } from 'dayjs'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'

export const WRITING_FORM_PERIOD_PICKER_WIDTH = 240

/** `startOf('day')`가 아닌 시각이 하나라도 있으면 시간 포함으로 간주 */
export function dateRangeUsesClockTime(a: Dayjs, b: Dayjs): boolean {
  const atMidnight = (d: Dayjs) =>
    d.hour() === 0 && d.minute() === 0 && d.second() === 0 && d.millisecond() === 0
  return !atMidnight(a) || !atMidnight(b)
}

type WritingFormPeriodDatePickerFieldProps = {
  label?: ReactNode
  className?: string
  style?: CSSProperties
  width?: number | string
  /** 모달·트리거 앵커(단일 캘린더 기준일) */
  anchorDate: Dayjs
  /** 확정된 기간이 있으면 트리거에 표시 */
  appliedSurfaceRange: [Dayjs, Dayjs] | null
  appliedSurfaceWithTime?: boolean
  onCommitRange: (range: [Dayjs, Dayjs]) => void
  onCommitSingleDay: (d: Dayjs) => void
  placeholder?: string
}

/**
 * 설문 제목형「작성 기간」ON·단일항목 날짜형(기간 ON) 등 — 동일 트리거 + 포털 모달 UX.
 */
export function WritingFormPeriodDatePickerField({
  label,
  className,
  style,
  width = WRITING_FORM_PERIOD_PICKER_WIDTH,
  anchorDate,
  appliedSurfaceRange,
  appliedSurfaceWithTime = false,
  onCommitRange,
  onCommitSingleDay,
  placeholder,
}: WritingFormPeriodDatePickerFieldProps) {
  return (
    <ParagraphDatePicker
      mode="single"
      presetMode="period"
      className={className}
      style={style}
      label={label}
      width={width}
      value={anchorDate}
      placeholder={placeholder}
      preferPeriodModeInPopover
      appliedSurfaceRange={appliedSurfaceRange}
      appliedSurfaceWithTime={appliedSurfaceWithTime}
      onRangeChange={onCommitRange}
      onChange={d => {
        if (d) onCommitSingleDay(d)
      }}
    />
  )
}
