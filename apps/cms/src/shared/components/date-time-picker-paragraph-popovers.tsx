import type { RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { Dayjs } from 'dayjs'
import { CalendarMini } from '@/shared/components/calendar'
import {
  findNextEnabledDate,
  useDateTimePickerPopoverLayer,
} from '@/shared/components/date-time-picker-shared'
import { DateTimePickerTimeInlineSelects } from '@/shared/components/date-time-picker-time-selects'
import { formatAppDatepickerDisplay } from '@/shared/ui/cms-datepicker'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsToggle } from '@/shared/ui/cms-toggle'

const EMPTY_SCHEDULES = new Set<string>()

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export type ParagraphDatePickerPopoverProps = {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  dismissExcludeRef?: RefObject<HTMLElement | null>
  panelId: string
  zIndex?: number
  disabled?: boolean
  disabledDate?: (date: Dayjs) => boolean
  isRangeCalendarMode: boolean
  timeOn: boolean
  calendarMonth: Dayjs
  onCalendarMonthChange: (month: Dayjs) => void
  draft: Dayjs
  rangeStart: Dayjs
  rangeEnd: Dayjs
  rangeFocus: 'start' | 'end'
  onRangeFocusChange: (focus: 'start' | 'end') => void
  onCalendarSelect: (date: Dayjs) => void
  singleHour: string
  singleMinute: string
  singleMer: 'AM' | 'PM'
  onSingleHourChange: (v: string) => void
  onSingleMinuteChange: (v: string) => void
  onSingleMerChange: (v: 'AM' | 'PM') => void
  startHour: string
  startMinute: string
  startMer: 'AM' | 'PM'
  onStartHourChange: (v: string) => void
  onStartMinuteChange: (v: string) => void
  onStartMerChange: (v: 'AM' | 'PM') => void
  endHour: string
  endMinute: string
  endMer: 'AM' | 'PM'
  onEndHourChange: (v: string) => void
  onEndMinuteChange: (v: string) => void
  onEndMerChange: (v: 'AM' | 'PM') => void
  invalidTimeRange: boolean
  showPeriodToggle: boolean
  periodOn: boolean
  onPeriodOnChange: (next: boolean) => void
  onTimeOnChange: (next: boolean) => void
  onApply: () => void
  onPeriodToggleOn?: (draft: Dayjs, nextEnd: Dayjs) => void
  onTimeToggleOn?: (ctx: { isRange: boolean; rangeStart: Dayjs; draft: Dayjs }) => void
}

export function ParagraphDatePickerPopover({
  open,
  onClose,
  anchorRef,
  dismissExcludeRef,
  panelId,
  zIndex = 1060,
  disabled,
  disabledDate,
  isRangeCalendarMode,
  timeOn,
  calendarMonth,
  onCalendarMonthChange,
  draft,
  rangeStart,
  rangeEnd,
  rangeFocus,
  onRangeFocusChange,
  onCalendarSelect,
  singleHour,
  singleMinute,
  singleMer,
  onSingleHourChange,
  onSingleMinuteChange,
  onSingleMerChange,
  startHour,
  startMinute,
  startMer,
  onStartHourChange,
  onStartMinuteChange,
  onStartMerChange,
  endHour,
  endMinute,
  endMer,
  onEndHourChange,
  onEndMinuteChange,
  onEndMerChange,
  invalidTimeRange,
  showPeriodToggle,
  periodOn,
  onPeriodOnChange,
  onTimeOnChange,
  onApply,
  onPeriodToggleOn,
  onTimeToggleOn,
}: ParagraphDatePickerPopoverProps) {
  const { popoverRef, popoverStyle } = useDateTimePickerPopoverLayer({
    open,
    onClose,
    anchorRef,
    dismissExcludeRef,
    repositionDeps: [isRangeCalendarMode, timeOn],
  })

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
        className={cn(
          'date-time-picker-popover',
          timeOn && 'date-time-picker-popover--with-time',
          isRangeCalendarMode && 'date-time-picker-popover--range-fields'
        )}
        style={{ ...popoverStyle, zIndex }}
        role="dialog"
        aria-modal="true"
        aria-label="날짜 선택"
      >
        <div className="date-time-picker-popover__body">
          <div className="date-time-picker-popover__calendar">
            <div className="calendar-mini date-time-picker-popover__calendar-mini">
              <CalendarMini
                currentMonth={calendarMonth}
                selectedDate={
                  isRangeCalendarMode ? (rangeFocus === 'start' ? rangeStart : rangeEnd) : draft
                }
                onMonthChange={onCalendarMonthChange}
                onSelectDate={onCalendarSelect}
                programDates={EMPTY_SCHEDULES}
                disabledDate={disabledDate}
                rangeSelection={isRangeCalendarMode ? { start: rangeStart, end: rangeEnd } : null}
              />
            </div>
          </div>
          <div className="date-time-picker-popover__side">
            {isRangeCalendarMode ? (
              <div className="date-time-picker-popover__fields">
                <div
                  className="date-time-picker-popover__field"
                  onClick={() => onRangeFocusChange('start')}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRangeFocusChange('start')
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <span className="date-time-picker-popover__field-label">시작일</span>
                  <div className="date-time-picker-popover__datetime-row">
                    <CmsInput
                      className={cn(
                        'date-time-picker-popover__input',
                        rangeFocus === 'start' && 'date-time-picker-popover__input--active'
                      )}
                      width="100%"
                      inputSize="large"
                      readOnly
                      tabIndex={-1}
                      value={formatAppDatepickerDisplay(rangeStart)}
                      aria-label="시작일"
                    />
                    {timeOn ? (
                      <>
                        <span className="date-time-picker-popover__date-time-sep" aria-hidden>
                          |
                        </span>
                        <DateTimePickerTimeInlineSelects
                          hour={startHour}
                          minute={startMinute}
                          meridiem={startMer}
                          onHourChange={onStartHourChange}
                          onMinuteChange={onStartMinuteChange}
                          onMeridiemChange={onStartMerChange}
                          getPopupContainer={() => popoverRef.current ?? document.body}
                          disabled={disabled}
                          hourActive={rangeFocus === 'start'}
                          rowPhase="start"
                        />
                      </>
                    ) : null}
                  </div>
                </div>
                <div
                  className="date-time-picker-popover__field"
                  onClick={() => onRangeFocusChange('end')}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRangeFocusChange('end')
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <span className="date-time-picker-popover__field-label">종료일</span>
                  <div className="date-time-picker-popover__datetime-row">
                    <CmsInput
                      className={cn(
                        'date-time-picker-popover__input',
                        rangeFocus === 'end' && 'date-time-picker-popover__input--active'
                      )}
                      width="100%"
                      inputSize="large"
                      readOnly
                      tabIndex={-1}
                      value={formatAppDatepickerDisplay(rangeEnd)}
                      aria-label="종료일"
                    />
                    {timeOn ? (
                      <>
                        <span className="date-time-picker-popover__date-time-sep" aria-hidden>
                          |
                        </span>
                        <DateTimePickerTimeInlineSelects
                          hour={endHour}
                          minute={endMinute}
                          meridiem={endMer}
                          onHourChange={onEndHourChange}
                          onMinuteChange={onEndMinuteChange}
                          onMeridiemChange={onEndMerChange}
                          getPopupContainer={() => popoverRef.current ?? document.body}
                          disabled={disabled}
                          hourActive={rangeFocus === 'end'}
                          invalid={invalidTimeRange}
                          rowPhase="end"
                        />
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="date-time-picker-popover__datetime-row date-time-picker-popover__datetime-row--single">
                <CmsInput
                  className="date-time-picker-popover__input date-time-picker-popover__input--active"
                  width="100%"
                  inputSize="large"
                  readOnly
                  tabIndex={-1}
                  value={formatAppDatepickerDisplay(draft)}
                  aria-label="선택한 날짜"
                />
                {timeOn ? (
                  <>
                    <span className="date-time-picker-popover__date-time-sep" aria-hidden>
                      |
                    </span>
                    <DateTimePickerTimeInlineSelects
                      hour={singleHour}
                      minute={singleMinute}
                      meridiem={singleMer}
                      onHourChange={onSingleHourChange}
                      onMinuteChange={onSingleMinuteChange}
                      onMeridiemChange={onSingleMerChange}
                      getPopupContainer={() => popoverRef.current ?? document.body}
                      disabled={disabled}
                      hourActive
                      rowPhase="single"
                    />
                  </>
                ) : null}
              </div>
            )}
            {invalidTimeRange ? (
              <div className="date-time-picker-popover__time-error" role="alert">
                종료 일시는 시작 일시보다 이후여야 합니다.
              </div>
            ) : null}
            <div className="date-time-picker-popover__footer">
              <div className="date-time-picker-popover__toggles">
                {showPeriodToggle ? (
                  <CmsToggle
                    label="기간"
                    checked={periodOn}
                    onChange={next => {
                      onPeriodOnChange(next)
                      if (next) {
                        const nextEnd = findNextEnabledDate(draft.add(1, 'day'), disabledDate)
                        onPeriodToggleOn?.(draft, nextEnd)
                      }
                    }}
                    disabled={disabled}
                  />
                ) : null}
                <CmsToggle
                  label="시간"
                  checked={timeOn}
                  onChange={next => {
                    onTimeOnChange(next)
                    if (next) {
                      onTimeToggleOn?.({
                        isRange: isRangeCalendarMode,
                        rangeStart,
                        draft,
                      })
                    }
                  }}
                  disabled={disabled}
                />
              </div>
              <div className="date-time-picker-popover__actions">
                <CmsButton
                  type="button"
                  variant="primary"
                  size="medium"
                  width="80px"
                  onClick={onApply}
                >
                  설정
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

export type ParagraphTimePickerPopoverProps = {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  dismissExcludeRef?: RefObject<HTMLElement | null>
  panelId: string
  zIndex?: number
  disabled?: boolean
  isEndTimeOn: boolean
  endTimeAlwaysOn?: boolean
  focusPhase: 'single' | 'start' | 'end'
  onFocusPhaseChange: (phase: 'single' | 'start' | 'end') => void
  sHour: string
  sMin: string
  sMer: 'AM' | 'PM'
  onSHourChange: (v: string) => void
  onSMinChange: (v: string) => void
  onSMerChange: (v: 'AM' | 'PM') => void
  eHour: string
  eMin: string
  eMer: 'AM' | 'PM'
  onEHourChange: (v: string) => void
  onEMinChange: (v: string) => void
  onEMerChange: (v: 'AM' | 'PM') => void
  onEndTimeOnChange: (next: boolean) => void
  onEndTimeToggleOn?: () => void
  onApply: () => void
}

export function ParagraphTimePickerPopover({
  open,
  onClose,
  anchorRef,
  dismissExcludeRef,
  panelId,
  zIndex = 1060,
  disabled,
  isEndTimeOn,
  endTimeAlwaysOn = false,
  focusPhase,
  onFocusPhaseChange,
  sHour,
  sMin,
  sMer,
  onSHourChange,
  onSMinChange,
  onSMerChange,
  eHour,
  eMin,
  eMer,
  onEHourChange,
  onEMinChange,
  onEMerChange,
  onEndTimeOnChange,
  onEndTimeToggleOn,
  onApply,
}: ParagraphTimePickerPopoverProps) {
  const { popoverRef, popoverStyle } = useDateTimePickerPopoverLayer({
    open,
    onClose,
    anchorRef,
    dismissExcludeRef,
    repositionDeps: [isEndTimeOn],
  })

  const renderTimeRow = (
    phase: 'single' | 'start' | 'end',
    h: string,
    m: string,
    mer: 'AM' | 'PM',
    setH: (v: string) => void,
    setM: (v: string) => void,
    setMe: (v: 'AM' | 'PM') => void
  ) => (
    <DateTimePickerTimeInlineSelects
      hour={h}
      minute={m}
      meridiem={mer}
      onHourChange={setH}
      onMinuteChange={setM}
      onMeridiemChange={setMe}
      getPopupContainer={() => popoverRef.current ?? document.body}
      disabled={disabled}
      hourActive={
        (!isEndTimeOn && phase === 'single') ||
        (isEndTimeOn && focusPhase === 'start' && phase === 'start') ||
        (isEndTimeOn && focusPhase === 'end' && phase === 'end')
      }
      rowPhase={phase}
    />
  )

  if (!open) return null

  return createPortal(
    <>
      <div
        className="date-time-picker-time-popover__backdrop"
        style={{ zIndex: zIndex - 5 }}
        aria-hidden
      />
      <div
        ref={popoverRef}
        id={panelId}
        className="date-time-picker-time-popover"
        style={{ ...popoverStyle, zIndex }}
        role="dialog"
        aria-modal="true"
        aria-label="시간 설정"
      >
        {!isEndTimeOn ? (
          <div className="date-time-picker-time-popover__section">
            {renderTimeRow('single', sHour, sMin, sMer, onSHourChange, onSMinChange, onSMerChange)}
          </div>
        ) : (
          <>
            <div
              className="date-time-picker-time-popover__section"
              onMouseDown={() => onFocusPhaseChange('start')}
            >
              <span className="date-time-picker-time-popover__section-label">시작 시간</span>
              {renderTimeRow('start', sHour, sMin, sMer, onSHourChange, onSMinChange, onSMerChange)}
            </div>
            <div
              className="date-time-picker-time-popover__section"
              onMouseDown={() => onFocusPhaseChange('end')}
            >
              <span className="date-time-picker-time-popover__section-label">종료 시간</span>
              {renderTimeRow('end', eHour, eMin, eMer, onEHourChange, onEMinChange, onEMerChange)}
            </div>
          </>
        )}

        <div className="date-time-picker-time-popover__footer">
          <CmsToggle
            label="종료 시간"
            checked={isEndTimeOn}
            onChange={next => {
              if (endTimeAlwaysOn) return
              onEndTimeOnChange(next)
              if (next) {
                onFocusPhaseChange('start')
                onEndTimeToggleOn?.()
              } else {
                onFocusPhaseChange('single')
              }
            }}
            disabled={disabled || endTimeAlwaysOn}
          />
          <CmsButton
            type="button"
            variant="primary"
            size="medium"
            width="80px"
            onClick={onApply}
            disabled={disabled}
          >
            설정
          </CmsButton>
        </div>
      </div>
    </>,
    document.body
  )
}
