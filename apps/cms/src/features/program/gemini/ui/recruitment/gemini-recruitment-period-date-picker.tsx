import { useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'

export type GeminiRecruitmentPeriodValue = [Dayjs | null, Dayjs | null] | null

export function GeminiRecruitmentPeriodDatePicker({
  value,
  onChange,
  placeholder,
  dateOnly = false,
}: {
  value: GeminiRecruitmentPeriodValue
  onChange: (next: GeminiRecruitmentPeriodValue) => void
  placeholder: string
  /** true: 모집 기간 등 — 시간 토글/표시 없이 날짜만 */
  dateOnly?: boolean
}) {
  const appliedSurfaceRange = useMemo((): [Dayjs, Dayjs] | null => {
    const start = value?.[0]
    const end = value?.[1]
    if (start != null && end != null) return [start, end]
    return null
  }, [value])

  const [anchor, setAnchor] = useState<Dayjs | null>(() => appliedSurfaceRange?.[0] ?? null)

  const rangeWithTime = useMemo(
    () =>
      dateOnly
        ? false
        : appliedSurfaceRange == null
          ? false
          : dateRangeUsesClockTime(appliedSurfaceRange[0], appliedSurfaceRange[1]),
    [appliedSurfaceRange, dateOnly]
  )

  return (
    <ParagraphDatePicker
      mode="single"
      presetMode="period"
      value={anchor}
      width="100%"
      placeholder={placeholder}
      preferPeriodModeInPopover
      showTimeToggle={!dateOnly}
      appliedSurfaceRange={appliedSurfaceRange}
      appliedSurfaceWithTime={rangeWithTime}
      onRangeChange={range => {
        onChange([range[0], range[1]])
        setAnchor(range[0])
      }}
      onChange={next => {
        if (next == null) return
        setAnchor(next)
      }}
    />
  )
}
