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
  buildTime,
  parseNum,
} from '@/shared/components/date-time-picker-time-selects'
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
  zIndex = 1060,
}: DateTimePickerPopoverProps) {
  const panelId = useId()

  const initialDate = findNextEnabledDate(value, disabledDate)
  const initialTimeParts = dayjsTimeParts(initialDate)

  const [draft, setDraft] = useState(initialDate)
  const [calendarMonth, setCalendarMonth] = useState(() => initialDate.startOf('month'))
  const [singleHour, setSingleHour] = useState(initialTimeParts.h)
  const [singleMinute, setSingleMinute] = useState(initialTimeParts.m)
  const [singleMer, setSingleMer] = useState<'AM' | 'PM'>(initialTimeParts.mer)

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

    const next = findNextEnabledDate(value, disabledDate)
    const timeParts = dayjsTimeParts(value)
    setDraft(next)
    setCalendarMonth(next.startOf('month'))
    setSingleHour(timeParts.h)
    setSingleMinute(timeParts.m)
    setSingleMer(timeParts.mer)
  }, [open, value, disabledDate])

  const buildDraftDateTime = useCallback(
    (
      date: Dayjs,
      hour = singleHour,
      minute = singleMinute,
      mer = singleMer
    ) => buildTime(date, parseNum(hour, 12), parseNum(minute, 0), mer),
    [singleHour, singleMinute, singleMer]
  )

  const lastEmittedAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (!open) {
      lastEmittedAtRef.current = null
      return
    }
    if (!onChange) return
    const next = buildDraftDateTime(draft)
    const ts = next.valueOf()
    if (lastEmittedAtRef.current === ts) return
    lastEmittedAtRef.current = ts
    onChange(next)
  }, [open, onChange, draft, singleHour, singleMinute, singleMer, buildDraftDateTime])

  const handleCalendarSelect = (next: Dayjs) => {
    if (disabledDate?.(next)) return
    setDraft(next)
    setCalendarMonth(next.startOf('month'))
  }

  const handleApply = () => {
    onApply(buildDraftDateTime(draft))
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
            <div className="calendar-mini date-time-picker-popover__calendar-mini">
              <CalendarMini
                currentMonth={calendarMonth}
                selectedDate={draft}
                onMonthChange={setCalendarMonth}
                onSelectDate={handleCalendarSelect}
                programDates={EMPTY_SCHEDULES}
                disabledDate={disabledDate}
              />
            </div>
          </div>
          <div className="date-time-picker-popover__side">
            <div className="date-time-picker-popover__datetime-row">
              <CmsInput
                className="date-time-picker-popover__input date-time-picker-popover__input--active"
                width="100%"
                inputSize="large"
                readOnly
                tabIndex={-1}
                value={formatAppDatepickerDisplay(draft)}
                aria-label="선택한 날짜"
              />
              <span className="date-time-picker-popover__date-time-sep" aria-hidden>
                |
              </span>
              <DateTimePickerTimeInlineSelects
                hour={singleHour}
                minute={singleMinute}
                meridiem={singleMer}
                onHourChange={setSingleHour}
                onMinuteChange={setSingleMinute}
                onMeridiemChange={setSingleMer}
                getPopupContainer={() => popoverRef.current ?? document.body}
                disabled={disabled}
                hourActive
                rowPhase="single"
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
