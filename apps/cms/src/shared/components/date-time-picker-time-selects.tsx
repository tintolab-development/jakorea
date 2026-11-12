import { CmsSelect } from '@/shared/ui/cms-select'
import type { CmsControlSize } from '@/shared/ui/cms-control-size'
import type { Dayjs } from 'dayjs'

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: `${i}시`,
}))

const ALL_MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  value: String(i),
  label: `${String(i).padStart(2, '0')}분`,
}))

function minuteOptionsForStep(minuteStep?: number) {
  const step = minuteStep != null && minuteStep > 0 ? Math.floor(minuteStep) : 1
  if (step <= 1) return ALL_MINUTE_OPTIONS
  const options: Array<{ value: string; label: string }> = []
  for (let minute = 0; minute < 60; minute += step) {
    options.push({
      value: String(minute),
      label: `${String(minute).padStart(2, '0')}분`,
    })
  }
  return options
}

function to24h(h12: number, mer: 'AM' | 'PM'): number {
  if (mer === 'AM') return h12 === 12 ? 0 : h12
  return h12 === 12 ? 12 : h12 + 12
}

/** @deprecated 24h UI만 사용 — `buildTimeFrom24Hour` 권장 */
export function from24h(h24: number): { h12: number; mer: 'AM' | 'PM' } {
  const mer: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM'
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  return { h12, mer }
}

/** @deprecated 24h draft state — `buildTimeFrom24Hour` 권장 */
export function buildTime(base: Dayjs, h12: number, minute: number, mer: 'AM' | 'PM'): Dayjs {
  return buildTimeFrom24Hour(base, to24h(h12, mer), minute)
}

export function buildTimeFrom24Hour(base: Dayjs, hour24: number, minute: number): Dayjs {
  const h = Math.min(23, Math.max(0, hour24))
  const m = Math.min(59, Math.max(0, minute))
  return base.hour(h).minute(m).second(0).millisecond(0)
}

export function parseNum(s: string, fallback: number): number {
  const n = Number.parseInt(s, 10)
  return Number.isFinite(n) ? n : fallback
}

export interface DateTimePickerTimeInlineSelectsProps {
  hour: string
  minute: string
  onHourChange: (v: string) => void
  onMinuteChange: (v: string) => void
  getPopupContainer: () => HTMLElement
  disabled?: boolean
  hourActive: boolean
  invalid?: boolean
  rowPhase?: 'single' | 'start' | 'end'
  /** 분 선택 스텝(예: 30 → 00/30만). 기본 1분 */
  minuteStep?: number
  /** opt-in: 활성 행이면 분 셀렉트도 시와 같이 강조한다(기본 false — 분은 항상 muted) */
  emphasizeActiveMinute?: boolean
  /** 현재 선택 날짜. 최소 일시와 같은 날짜일 때 시간 선택지를 제한한다. */
  date?: Dayjs
  /** 예약 가능한 최소 일시 */
  minDateTime?: Dayjs
  inputSize?: CmsControlSize
}

/** 날짜·시간 팝오버 공용 시·분 셀렉트 (24시간) */
export function DateTimePickerTimeInlineSelects({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  getPopupContainer,
  disabled,
  hourActive,
  invalid = false,
  rowPhase = 'single',
  minuteStep,
  emphasizeActiveMinute = false,
  date,
  minDateTime,
  inputSize = 'medium',
}: DateTimePickerTimeInlineSelectsProps) {
  const allMinuteOptions = minuteOptionsForStep(minuteStep)
  const sameMinimumDate =
    date != null && minDateTime != null && minDateTime.isValid() && date.isSame(minDateTime, 'day')
  const minimumHour = sameMinimumDate && minDateTime != null ? minDateTime.hour() : undefined
  const minimumMinute = sameMinimumDate && minDateTime != null ? minDateTime.minute() : undefined
  const hourOptions =
    minimumHour == null
      ? HOUR_OPTIONS
      : HOUR_OPTIONS.filter(option => Number(option.value) >= minimumHour)
  const minuteOptions =
    minimumHour == null || minimumMinute == null || Number(hour) !== minimumHour
      ? allMinuteOptions
      : allMinuteOptions.filter(option => Number(option.value) >= minimumMinute)
  const selectCommon = {
    inputSize,
    withAllOption: false,
    getPopupContainer,
    popupMatchSelectWidth: true,
    placement: 'bottomLeft' as const,
    popupClassName: 'date-time-picker-time-selects__dropdown',
  }

  const wrapHour = cn(
    'date-time-picker-time-selects__wrap',
    invalid && 'date-time-picker-time-selects__wrap--invalid',
    !invalid && hourActive && 'date-time-picker-time-selects__wrap--hour-active',
    !invalid && !hourActive && 'date-time-picker-time-selects__wrap--muted'
  )

  const wrapMuted = emphasizeActiveMinute
    ? wrapHour
    : cn(
        'date-time-picker-time-selects__wrap',
        invalid && 'date-time-picker-time-selects__wrap--invalid',
        !invalid && 'date-time-picker-time-selects__wrap--muted'
      )

  const endPhase = rowPhase === 'end'

  return (
    <div className="date-time-picker-time-selects__row date-time-picker-time-selects__row--24h">
      <CmsSelect
        {...selectCommon}
        className={wrapHour}
        placeholder="시"
        options={hourOptions}
        value={hour}
        onChange={v => onHourChange(String(v ?? '0'))}
        disabled={disabled}
        aria-label={endPhase ? '종료 시' : '시'}
      />
      <CmsSelect
        {...selectCommon}
        className={wrapMuted}
        placeholder="분"
        options={minuteOptions}
        value={minute}
        onChange={v => onMinuteChange(String(v ?? minuteOptions[0]?.value ?? '0'))}
        disabled={disabled}
        aria-label={endPhase ? '종료 분' : '분'}
      />
    </div>
  )
}

/** @deprecated `DateTimePickerTimeInlineSelects` 사용 */
export const ParagraphTimeInlineSelects = DateTimePickerTimeInlineSelects
export type ParagraphTimeInlineSelectsProps = DateTimePickerTimeInlineSelectsProps
