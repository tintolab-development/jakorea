import { CmsSelect } from '@/shared/ui/cms-select'
import type { Dayjs } from 'dayjs'

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const TIME_SELECT_FIELD_WIDTH_PX = 80

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const n = i + 1
  return { value: String(n), label: String(n) }
})

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  value: String(i),
  label: String(i).padStart(2, '0'),
}))

const MERIDIEM_OPTIONS = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
] as const

function to24h(h12: number, mer: 'AM' | 'PM'): number {
  if (mer === 'AM') return h12 === 12 ? 0 : h12
  return h12 === 12 ? 12 : h12 + 12
}

export function from24h(h24: number): { h12: number; mer: 'AM' | 'PM' } {
  const mer: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM'
  let h12 = h24 % 12
  if (h12 === 0) h12 = 12
  return { h12, mer }
}

export function buildTime(base: Dayjs, h12: number, minute: number, mer: 'AM' | 'PM'): Dayjs {
  const h24 = to24h(h12, mer)
  return base.hour(h24).minute(minute).second(0).millisecond(0)
}

export function parseNum(s: string, fallback: number): number {
  const n = Number.parseInt(s, 10)
  return Number.isFinite(n) ? n : fallback
}

export interface DateTimePickerTimeInlineSelectsProps {
  hour: string
  minute: string
  meridiem: 'AM' | 'PM'
  onHourChange: (v: string) => void
  onMinuteChange: (v: string) => void
  onMeridiemChange: (v: 'AM' | 'PM') => void
  getPopupContainer: () => HTMLElement
  disabled?: boolean
  hourActive: boolean
  invalid?: boolean
  rowPhase?: 'single' | 'start' | 'end'
}

/** 날짜·시간 팝오버 공용 시·분·AM/PM 셀렉트 행 */
export function DateTimePickerTimeInlineSelects({
  hour,
  minute,
  meridiem,
  onHourChange,
  onMinuteChange,
  onMeridiemChange,
  getPopupContainer,
  disabled,
  hourActive,
  invalid = false,
  rowPhase = 'single',
}: DateTimePickerTimeInlineSelectsProps) {
  const selectCommon = {
    inputSize: 'large' as const,
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

  const wrapMuted = cn(
    'date-time-picker-time-selects__wrap',
    invalid && 'date-time-picker-time-selects__wrap--invalid',
    !invalid && 'date-time-picker-time-selects__wrap--muted'
  )

  const endMer = rowPhase === 'end'

  return (
    <div className="date-time-picker-time-selects__row">
      <CmsSelect
        {...selectCommon}
        className={wrapHour}
        width={TIME_SELECT_FIELD_WIDTH_PX}
        placeholder="시"
        options={HOUR_OPTIONS}
        value={hour}
        onChange={v => onHourChange(String(v ?? '12'))}
        disabled={disabled}
        aria-label={endMer ? '종료 시' : '시'}
      />
      <span className="date-time-picker-time-selects__colon" aria-hidden>
        :
      </span>
      <CmsSelect
        {...selectCommon}
        className={wrapMuted}
        width={TIME_SELECT_FIELD_WIDTH_PX}
        placeholder="분"
        options={MINUTE_OPTIONS}
        value={minute}
        onChange={v => onMinuteChange(String(v ?? '0'))}
        disabled={disabled}
        aria-label={endMer ? '종료 분' : '분'}
      />
      <CmsSelect
        {...selectCommon}
        className={wrapMuted}
        width={TIME_SELECT_FIELD_WIDTH_PX}
        options={[...MERIDIEM_OPTIONS]}
        value={meridiem}
        onChange={v => onMeridiemChange(v === 'PM' ? 'PM' : 'AM')}
        disabled={disabled}
        aria-label={endMer ? '종료 AM/PM' : 'AM/PM'}
      />
    </div>
  )
}

/** @deprecated `DateTimePickerTimeInlineSelects` 사용 */
export const ParagraphTimeInlineSelects = DateTimePickerTimeInlineSelects
export type ParagraphTimeInlineSelectsProps = DateTimePickerTimeInlineSelectsProps
