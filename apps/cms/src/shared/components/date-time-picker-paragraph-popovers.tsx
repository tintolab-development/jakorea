import type { RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { Dayjs } from 'dayjs'
import { CalendarMini } from '@/shared/components/calendar'
import {
  findNextEnabledDate,
  useDateTimePickerPopoverLayer,
} from '@/shared/components/date-time-picker-shared'
import { DateTimePickerTimeInlineSelects } from '@/shared/components/date-time-picker-time-selects'
import { CMS_DATE_TIME_PICKER_DEFAULT_Z_INDEX } from '@/shared/constants/modal-z-index'
import { formatAppDatepickerDisplay } from '@/shared/ui/cms-datepicker'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsToggle } from '@/shared/ui/cms-toggle'
import './date-time-picker-modal.css'

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
  /** 일정+시간 — 같은 날 시작·종료 (ParagraphTimePicker 종료 시간 고정과 동일) */
  sameDayTimeRange?: boolean
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
  onSingleHourChange: (v: string) => void
  onSingleMinuteChange: (v: string) => void
  startHour: string
  startMinute: string
  onStartHourChange: (v: string) => void
  onStartMinuteChange: (v: string) => void
  endHour: string
  endMinute: string
  onEndHourChange: (v: string) => void
  onEndMinuteChange: (v: string) => void
  invalidTimeRange: boolean
  /** 기간 OFF·ON 고정(같은 날) — 종료일 날짜 인풋은 항상 노출, true면 비활성 */
  rangeEndDateDisabled?: boolean
  showPeriodToggle: boolean
  showTimeToggle?: boolean
  /** 기간 토글 ON 고정. 조작 불가(비활성 ON)로 표시. 기본 false. */
  periodToggleDisabled?: boolean
  /** 시간 토글 ON 고정. 조작 불가하므로 팝오버에서는 숨김. 기본 false. */
  timeToggleDisabled?: boolean
  /** 시간 선택 UI 노출 + 비활성 (기관 일정형 단일 기간) */
  timeInputsDisabled?: boolean
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
  zIndex = CMS_DATE_TIME_PICKER_DEFAULT_Z_INDEX,
  disabled,
  disabledDate,
  isRangeCalendarMode,
  sameDayTimeRange = false,
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
  onSingleHourChange,
  onSingleMinuteChange,
  startHour,
  startMinute,
  onStartHourChange,
  onStartMinuteChange,
  endHour,
  endMinute,
  onEndHourChange,
  onEndMinuteChange,
  invalidTimeRange,
  rangeEndDateDisabled = false,
  showPeriodToggle,
  showTimeToggle = true,
  periodToggleDisabled = false,
  timeToggleDisabled = false,
  timeInputsDisabled = false,
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
    repositionDeps: [isRangeCalendarMode, sameDayTimeRange, timeOn],
  })
  const showRangeDateFields = isRangeCalendarMode || rangeEndDateDisabled
  const showPeriodToggleControl = showPeriodToggle && !periodToggleDisabled && !disabled
  const showTimeToggleControl = showTimeToggle && !disabled

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
            <div className="date-time-picker-popover__calendar-mini">
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
            {showRangeDateFields ? (
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
                  <div
                    className={
                      timeOn
                        ? 'date-time-picker-popover__datetime-stack'
                        : 'date-time-picker-popover__datetime-row'
                    }
                  >
                    <CmsInput
                      className={cn(
                        'date-time-picker-popover__input',
                        rangeFocus === 'start' && 'date-time-picker-popover__input--active'
                      )}
                      width="100%"
                      inputSize="medium"
                      readOnly
                      allowClear={false}
                      tabIndex={-1}
                      value={formatAppDatepickerDisplay(rangeStart)}
                      aria-label="시작일"
                    />
                    {timeOn ? (
                      <DateTimePickerTimeInlineSelects
                        hour={startHour}
                        minute={startMinute}
                        onHourChange={onStartHourChange}
                        onMinuteChange={onStartMinuteChange}
                        getPopupContainer={() => popoverRef.current ?? document.body}
                        disabled={disabled || timeInputsDisabled}
                        hourActive={rangeFocus === 'start'}
                        rowPhase="start"
                      />
                    ) : null}
                  </div>
                </div>
                <div
                  className={cn(
                    'date-time-picker-popover__field',
                    rangeEndDateDisabled && 'date-time-picker-popover__field--end-date-locked'
                  )}
                  onClick={() => {
                    if (!rangeEndDateDisabled) onRangeFocusChange('end')
                  }}
                  onKeyDown={e => {
                    if (rangeEndDateDisabled) return
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRangeFocusChange('end')
                    }
                  }}
                  role={rangeEndDateDisabled ? undefined : 'button'}
                  tabIndex={rangeEndDateDisabled ? undefined : 0}
                >
                  <span className="date-time-picker-popover__field-label">종료일</span>
                  <div
                    className={
                      timeOn
                        ? 'date-time-picker-popover__datetime-stack'
                        : 'date-time-picker-popover__datetime-row'
                    }
                  >
                    <CmsInput
                      className={cn(
                        'date-time-picker-popover__input',
                        'date-time-picker-popover__input--end-date',
                        !rangeEndDateDisabled &&
                          rangeFocus === 'end' &&
                          'date-time-picker-popover__input--active'
                      )}
                      width="100%"
                      inputSize="medium"
                      readOnly
                      disabled={disabled || rangeEndDateDisabled}
                      allowClear={false}
                      tabIndex={-1}
                      value={formatAppDatepickerDisplay(
                        rangeEndDateDisabled ? rangeStart : rangeEnd
                      )}
                      aria-label="종료일"
                    />
                    {timeOn ? (
                      <div
                        className="date-time-picker-popover__end-time-wrap"
                        onClick={e => {
                          e.stopPropagation()
                          onRangeFocusChange('end')
                        }}
                      >
                        <DateTimePickerTimeInlineSelects
                          hour={endHour}
                          minute={endMinute}
                          onHourChange={onEndHourChange}
                          onMinuteChange={onEndMinuteChange}
                          getPopupContainer={() => popoverRef.current ?? document.body}
                          disabled={disabled || timeInputsDisabled}
                          hourActive={rangeFocus === 'end'}
                          invalid={invalidTimeRange}
                          rowPhase="end"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : timeOn && sameDayTimeRange ? (
              <div className="date-time-picker-popover__fields">
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
                <div
                  className="date-time-picker-popover__field"
                  onClick={() => onRangeFocusChange('start')}
                >
                  <span className="date-time-picker-popover__field-label">시작 시간</span>
                  <DateTimePickerTimeInlineSelects
                    hour={startHour}
                    minute={startMinute}
                    onHourChange={onStartHourChange}
                    onMinuteChange={onStartMinuteChange}
                    getPopupContainer={() => popoverRef.current ?? document.body}
                    disabled={disabled}
                    hourActive={rangeFocus === 'start'}
                    invalid={invalidTimeRange}
                    rowPhase="start"
                  />
                </div>
                <div
                  className="date-time-picker-popover__field"
                  onClick={() => onRangeFocusChange('end')}
                >
                  <span className="date-time-picker-popover__field-label">종료 시간</span>
                  <DateTimePickerTimeInlineSelects
                    hour={endHour}
                    minute={endMinute}
                    onHourChange={onEndHourChange}
                    onMinuteChange={onEndMinuteChange}
                    getPopupContainer={() => popoverRef.current ?? document.body}
                    disabled={disabled}
                    hourActive={rangeFocus === 'end'}
                    invalid={invalidTimeRange}
                    rowPhase="end"
                  />
                </div>
              </div>
            ) : timeOn ? (
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
                  onHourChange={onSingleHourChange}
                  onMinuteChange={onSingleMinuteChange}
                  getPopupContainer={() => popoverRef.current ?? document.body}
                  disabled={disabled}
                  hourActive
                  rowPhase="single"
                />
              </div>
            ) : (
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
            )}
            {invalidTimeRange ? (
              <div className="date-time-picker-popover__time-error" role="alert">
                종료 일시는 시작 일시보다 이후여야 합니다.
              </div>
            ) : null}
            <div className="date-time-picker-popover__footer">
              {showPeriodToggleControl || showTimeToggleControl ? (
                <div className="date-time-picker-popover__toggles">
                  {showPeriodToggleControl ? (
                    <CmsToggle
                      label="기간"
                      checked={periodOn}
                      disabled={periodToggleDisabled}
                      onChange={next => {
                        if (periodToggleDisabled) return
                        onPeriodOnChange(next)
                        if (next) {
                          const nextEnd = findNextEnabledDate(draft.add(1, 'day'), disabledDate)
                          onPeriodToggleOn?.(draft, nextEnd)
                        }
                      }}
                    />
                  ) : null}
                  {showTimeToggleControl ? (
                    <CmsToggle
                      label="시간"
                      checked={timeOn}
                      disabled={timeToggleDisabled}
                      onChange={next => {
                        if (timeToggleDisabled) return
                        onTimeOnChange(next)
                        if (next) {
                          onTimeToggleOn?.({
                            isRange: isRangeCalendarMode,
                            rangeStart,
                            draft,
                          })
                        }
                      }}
                    />
                  ) : null}
                </div>
              ) : (
                <div />
              )}
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
  showEndTimeToggle?: boolean
  disabled?: boolean
  isEndTimeOn: boolean
  endTimeAlwaysOn?: boolean
  focusPhase: 'single' | 'start' | 'end'
  onFocusPhaseChange: (phase: 'single' | 'start' | 'end') => void
  sHour: string
  sMin: string
  onSHourChange: (v: string) => void
  onSMinChange: (v: string) => void
  eHour: string
  eMin: string
  onEHourChange: (v: string) => void
  onEMinChange: (v: string) => void
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
  zIndex = CMS_DATE_TIME_PICKER_DEFAULT_Z_INDEX,
  showEndTimeToggle = true,
  disabled,
  isEndTimeOn,
  endTimeAlwaysOn = false,
  focusPhase,
  onFocusPhaseChange,
  sHour,
  sMin,
  onSHourChange,
  onSMinChange,
  eHour,
  eMin,
  onEHourChange,
  onEMinChange,
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
  const showInteractiveEndTimeToggle =
    showEndTimeToggle && !disabled && !endTimeAlwaysOn

  const renderTimeRow = (
    phase: 'single' | 'start' | 'end',
    h: string,
    m: string,
    setH: (v: string) => void,
    setM: (v: string) => void
  ) => (
    <DateTimePickerTimeInlineSelects
      hour={h}
      minute={m}
      onHourChange={setH}
      onMinuteChange={setM}
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
            {renderTimeRow('single', sHour, sMin, onSHourChange, onSMinChange)}
          </div>
        ) : (
          <>
            <div
              className="date-time-picker-time-popover__section"
              onMouseDown={() => onFocusPhaseChange('start')}
            >
              <span className="date-time-picker-time-popover__section-label">시작 시간</span>
              {renderTimeRow('start', sHour, sMin, onSHourChange, onSMinChange)}
            </div>
            <div
              className="date-time-picker-time-popover__section"
              onMouseDown={() => onFocusPhaseChange('end')}
            >
              <span className="date-time-picker-time-popover__section-label">종료 시간</span>
              {renderTimeRow('end', eHour, eMin, onEHourChange, onEMinChange)}
            </div>
          </>
        )}

        <div className="date-time-picker-time-popover__footer">
          {showInteractiveEndTimeToggle ? (
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
            />
          ) : (
            <span />
          )}
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
