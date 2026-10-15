import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import type { Dayjs } from 'dayjs'
import { CalendarMini } from '@/shared/components/calendar'
import {
  dayjsTimeParts,
  findNextEnabledDate,
  useDateTimePickerPopoverLayer,
} from '@/shared/components/date-time-picker-shared'
import {
  DateTimePickerTimeInlineSelects,
  buildTimeFrom24Hour,
  parseNum,
} from '@/shared/components/date-time-picker-time-selects'
import { CMS_DATE_TIME_PICKER_DEFAULT_Z_INDEX } from '@/shared/constants/modal-z-index'
import { formatAppDatepickerDisplay } from '@/shared/ui/cms-datepicker'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsInput } from '@/shared/ui/cms-input'
import './date-time-picker-modal.css'

export {
  ParagraphDatePickerPopover,
  ParagraphTimePickerPopover,
} from '@/shared/components/date-time-picker-paragraph-popovers'
export type {
  ParagraphDatePickerPopoverProps,
  ParagraphTimePickerPopoverProps,
} from '@/shared/components/date-time-picker-paragraph-popovers'
export {
  DateTimePickerTimeInlineSelects,
  ParagraphTimeInlineSelects,
  buildTime,
  buildTimeFrom24Hour,
  from24h,
  parseNum,
} from '@/shared/components/date-time-picker-time-selects'
export type {
  DateTimePickerTimeInlineSelectsProps,
  ParagraphTimeInlineSelectsProps,
} from '@/shared/components/date-time-picker-time-selects'

const EMPTY_SCHEDULES = new Set<string>()

export type DateTimePickerPopoverProps = {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  dismissExcludeRef?: RefObject<HTMLElement | null>
  value: Dayjs
  onApply: (value: Dayjs) => void
  /** 팝오버 열림 중 날짜·시간 변경 시마다 호출(라디오 요약 등 실시간 반영) */
  onChange?: (value: Dayjs) => void
  disabledDate?: (date: Dayjs) => boolean
  disabled?: boolean
  footerExtra?: ReactNode
  applyLabel?: string
  zIndex?: number
  /** 분 선택 스텝(예: 30 → 00/30만). 기본 1분 */
  minuteStep?: number
  /** 예약 가능한 최소 일시. 지정 시 날짜·시간 선택과 저장 시점에 함께 적용 */
  minDateTime?: Dayjs
}

function snapDayjsMinute(value: Dayjs, minuteStep?: number): Dayjs {
  if (minuteStep == null || minuteStep <= 1) return value.second(0).millisecond(0)
  const step = Math.floor(minuteStep)
  const rawMinute = value.minute()
  let snappedMinute = Math.round(rawMinute / step) * step
  let next = value.second(0).millisecond(0)
  if (snappedMinute >= 60) {
    next = next.add(1, 'hour')
    snappedMinute = 0
  }
  return next.minute(snappedMinute)
}

export function DateTimePickerPopover({
  open,
  onClose,
  anchorRef,
  dismissExcludeRef,
  value,
  onApply,
  onChange,
  disabledDate,
  disabled,
  footerExtra,
  applyLabel = '설정',
  zIndex = CMS_DATE_TIME_PICKER_DEFAULT_Z_INDEX,
  minuteStep,
  minDateTime,
}: DateTimePickerPopoverProps) {
  const panelId = useId()

  const pickerMinimum =
    minDateTime?.isValid() && minDateTime.second() !== 0
      ? minDateTime.second(0).millisecond(0).add(1, 'minute')
      : minDateTime?.isValid()
        ? minDateTime.second(0).millisecond(0)
        : undefined
  const isDateDisabled = useCallback(
    (date: Dayjs) =>
      disabledDate?.(date) === true ||
      (pickerMinimum != null && date.isBefore(pickerMinimum, 'day')),
    [disabledDate, pickerMinimum]
  )
  const normalizeDateTime = useCallback(
    (next: Dayjs) => {
      const enabledDate = findNextEnabledDate(next, isDateDisabled)
      const minimumApplied =
        pickerMinimum != null && enabledDate.isBefore(pickerMinimum) ? pickerMinimum : enabledDate
      return snapDayjsMinute(minimumApplied, minuteStep)
    },
    [isDateDisabled, minuteStep, pickerMinimum]
  )

  const initialDate = normalizeDateTime(value)
  const initialTimeParts = dayjsTimeParts(initialDate)

  const [draft, setDraft] = useState(initialDate)
  const [calendarMonth, setCalendarMonth] = useState(() => initialDate.startOf('month'))
  const [singleHour, setSingleHour] = useState(initialTimeParts.h)
  const [singleMinute, setSingleMinute] = useState(initialTimeParts.m)

  const { popoverRef, popoverStyle } = useDateTimePickerPopoverLayer({
    open,
    onClose,
    anchorRef,
    dismissExcludeRef,
  })

  const wasOpenRef = useRef(false)

  /** 팝오버를 열 때만 부모 `value`로 초기화 — 열린 동안 `onChange` 갱신은 덮어쓰지 않음 */
  useLayoutEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      return
    }
    if (wasOpenRef.current) return
    wasOpenRef.current = true

    const next = normalizeDateTime(value)
    const timeParts = dayjsTimeParts(next)
    setDraft(next)
    setCalendarMonth(next.startOf('month'))
    setSingleHour(timeParts.h)
    setSingleMinute(timeParts.m)
  }, [open, value, normalizeDateTime])

  const buildDraftDateTime = useCallback(
    (date: Dayjs, hour = singleHour, minute = singleMinute) =>
      buildTimeFrom24Hour(date, parseNum(hour, 0), parseNum(minute, 0)),
    [singleHour, singleMinute]
  )

  const lastEmittedAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (!open) {
      lastEmittedAtRef.current = null
      return
    }
    if (!onChange) return
    const next = snapDayjsMinute(buildDraftDateTime(draft), minuteStep)
    const ts = next.valueOf()
    if (lastEmittedAtRef.current === ts) return
    lastEmittedAtRef.current = ts
    onChange(next)
  }, [open, onChange, draft, singleHour, singleMinute, buildDraftDateTime, minuteStep])

  const handleCalendarSelect = (next: Dayjs) => {
    if (isDateDisabled(next)) return
    setDraft(next)
    setCalendarMonth(next.startOf('month'))
  }

  const handleApply = () => {
    const next = snapDayjsMinute(buildDraftDateTime(draft), minuteStep)
    if (pickerMinimum != null && next.isBefore(pickerMinimum)) return
    onApply(next)
    onClose()
  }

  if (!open) return null

  return createPortal(
    <>
      <div
        className="date-time-picker-popover__backdrop"
        style={{ zIndex: zIndex - 5 }}
        aria-hidden
      />
      <div
        ref={popoverRef}
        id={panelId}
        className="date-time-picker-popover date-time-picker-popover--with-time"
        style={{ ...popoverStyle, zIndex }}
        role="dialog"
        aria-modal="true"
        aria-label="날짜·시간 선택"
      >
        <div className="date-time-picker-popover__body">
          <div className="date-time-picker-popover__calendar">
            <div className="date-time-picker-popover__calendar-mini">
              <CalendarMini
                currentMonth={calendarMonth}
                selectedDate={draft}
                onMonthChange={setCalendarMonth}
                onSelectDate={handleCalendarSelect}
                programDates={EMPTY_SCHEDULES}
                disabledDate={isDateDisabled}
              />
            </div>
          </div>
          <div className="date-time-picker-popover__side">
            <div className="date-time-picker-popover__datetime-stack">
              <CmsInput
                className="date-time-picker-popover__input date-time-picker-popover__input--active"
                width="100%"
                inputSize="medium"
                readOnly
                allowClear={false}
                tabIndex={-1}
                value={formatAppDatepickerDisplay(draft)}
                aria-label="선택한 날짜"
              />
              <DateTimePickerTimeInlineSelects
                hour={singleHour}
                minute={singleMinute}
                onHourChange={setSingleHour}
                onMinuteChange={setSingleMinute}
                getPopupContainer={() => popoverRef.current ?? document.body}
                disabled={disabled}
                hourActive
                rowPhase="single"
                minuteStep={minuteStep}
                date={draft}
                minDateTime={pickerMinimum}
              />
            </div>
            <div className="date-time-picker-popover__footer">
              <div className="date-time-picker-popover__toggles">{footerExtra ?? null}</div>
              <div className="date-time-picker-popover__actions">
                <CmsButton
                  type="button"
                  variant="primary"
                  size="medium"
                  width="80px"
                  disabled={disabled}
                  onClick={handleApply}
                >
                  {applyLabel}
                </CmsButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
