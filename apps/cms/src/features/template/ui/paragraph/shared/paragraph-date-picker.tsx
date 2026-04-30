import type { CSSProperties, ReactNode, RefObject } from 'react'
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
import { createPortal } from 'react-dom'
import { CalendarOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { CalendarMini } from '@/shared/components/calendar'
import { CmsDateRangePicker, formatAppDatepickerDisplay } from '@/shared/ui/cms-datepicker'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsToggle } from '@/shared/ui/cms-toggle'
import {
  ParagraphTimeInlineSelects,
  buildTime,
  from24h,
  parseNum,
} from '@/features/template/ui/paragraph/shared/paragraph-time-picker'
import './paragraph-date-picker.css'
import './paragraph-time-picker.css'

function dayjsTimeParts(d: Dayjs): { h: string; m: string; mer: 'AM' | 'PM' } {
  const { h12, mer } = from24h(d.hour())
  return { h: String(h12), m: String(d.minute()), mer }
}

function formatTriggerClock(d: Dayjs): string {
  return d.format('HH:mm')
}

/** 트리거 한 줄 표시 (이미지 시안: 동일일 일정은 날짜 한 번 + `시작 ~ 종료시`) */
function formatParagraphDatePickerTriggerDisplay(
  value: Dayjs | null,
  surfaceRange: [Dayjs, Dayjs] | null,
  surfaceAppliedWithTime: boolean
): string | null {
  const empty = value == null && surfaceRange == null && !surfaceAppliedWithTime
  if (empty) return null

  const eff = value ?? dayjs()

  if (surfaceRange != null && surfaceAppliedWithTime) {
    const [a, b] = surfaceRange
    const da = formatAppDatepickerDisplay(a)
    const db = formatAppDatepickerDisplay(b)
    const ta = formatTriggerClock(a)
    const tb = formatTriggerClock(b)
    if (a.isSame(b, 'day')) {
      return `${da} ${ta} ~ ${tb}`
    }
    return `${da} ${ta} ~ ${db} ${tb}`
  }
  if (surfaceRange != null) {
    return `${formatAppDatepickerDisplay(surfaceRange[0])} ~ ${formatAppDatepickerDisplay(surfaceRange[1])}`
  }
  if (surfaceAppliedWithTime) {
    return `${formatAppDatepickerDisplay(eff)} ${formatTriggerClock(eff)}`
  }
  return formatAppDatepickerDisplay(eff)
}

export type ParagraphDatePresetMode = 'date' | 'period' | 'schedule'

const PARAGRAPH_DATE_PRESET_PLACEHOLDERS: Record<ParagraphDatePresetMode, string> = {
  date: '날짜를 선택하세요',
  period: '기간을 선택하세요',
  schedule: '일정을 선택하세요',
}

export function resolveParagraphDatePresetMode(props: {
  presetMode?: ParagraphDatePresetMode
  showPopoverPeriodToggle?: boolean
  preferPeriodModeInPopover?: boolean
}): ParagraphDatePresetMode {
  if (props.presetMode != null) return props.presetMode
  if (props.showPopoverPeriodToggle === false) return 'date'
  if (props.preferPeriodModeInPopover) return 'period'
  return 'schedule'
}

/** `CalendarMini` 일정 점 표시 없음 — 빈 Set 재사용 */
const PARAGRAPH_DATE_PICKER_EMPTY_SCHEDULES = new Set<string>()

type ParagraphRangeValue = [Dayjs | null, Dayjs | null]

interface ParagraphDatePickerBaseProps {
  label?: ReactNode
  width?: number | string
  className?: string
  style?: CSSProperties
  disabled?: boolean
}

interface ParagraphDatePickerRangeProps extends ParagraphDatePickerBaseProps {
  mode: 'range'
  value: ParagraphRangeValue
  onChange: (next: ParagraphRangeValue) => void
  placeholder?: [string, string]
}

interface ParagraphDatePickerSingleProps extends ParagraphDatePickerBaseProps {
  mode?: 'single'
  value: Dayjs | null
  onChange: (next: Dayjs | null) => void
  placeholder?: string
  /** 기간 ON 후 [설정] 시 `[시작, 종료]`(정렬됨) — 선택 */
  onRangeChange?: (range: [Dayjs, Dayjs]) => void
  /**
   * 날짜 / 기간 / 일정 — `customizable`이 false일 때 기간 UI 고정·placeholder 기본값에 사용.
   * 미지정 시 `showPopoverPeriodToggle`·`preferPeriodModeInPopover`로 추론.
   */
  presetMode?: ParagraphDatePresetMode
  /**
   * true: 기간·시간 토글 모두 표시, 모달 열 때 둘 다 off에서 시작(저장된 surface 복원 시 제외).
   * false: `presetMode`에 따라 기간 토글 노출 여부가 달라짐(날짜·기간: 시간 토글만 / 일정: 둘 다).
   */
  customizable?: boolean
  /**
   * @deprecated `presetMode`로 대체 권장. false면 `presetMode: 'date'`와 동일한 토글·캘린더 동작.
   */
  showPopoverPeriodToggle?: boolean
  /**
   * 부모에 저장된 기간 — 트리거 표면·모달 재오픈 시 반영(설문 제목형 `startAt`/`endAt` 등).
   * `ParagraphDatePickerSingleInner` 내부 `surfaceRange`와 동기화된다.
   */
  appliedSurfaceRange?: [Dayjs, Dayjs] | null
  /** `appliedSurfaceRange`가 시간 포함으로 확정된 경우 */
  appliedSurfaceWithTime?: boolean
  /**
   * `presetMode: 'schedule'`이고 `customizable`이 false일 때, 모달을 열 때 기간 선택 UI를 기본 ON으로 할지.
   * `presetMode: 'period'`일 때는 항상 기간 ON.
   */
  preferPeriodModeInPopover?: boolean
}

export type ParagraphDatePickerProps =
  | ParagraphDatePickerRangeProps
  | ParagraphDatePickerSingleProps

const POPOVER_GAP = 6

function toWidthStyle(width: number | string | undefined): CSSProperties | undefined {
  if (width == null) return undefined
  return { width: typeof width === 'number' ? `${width}px` : width }
}

interface ParagraphDatePickerSingleInnerProps {
  rootRef: RefObject<HTMLDivElement | null>
  value: Dayjs | null
  onChange: (next: Dayjs | null) => void
  onRangeChange?: (range: [Dayjs, Dayjs]) => void
  presetMode: ParagraphDatePresetMode
  customizable: boolean
  placeholder?: string
  width?: number | string
  disabled?: boolean
  appliedSurfaceRange?: [Dayjs, Dayjs] | null
  appliedSurfaceWithTime?: boolean
  preferPeriodModeInPopover?: boolean
}

function ParagraphDatePickerSingleInner({
  rootRef,
  value,
  onChange,
  onRangeChange,
  presetMode,
  customizable,
  placeholder,
  width,
  disabled,
  appliedSurfaceRange,
  appliedSurfaceWithTime = false,
  preferPeriodModeInPopover = false,
}: ParagraphDatePickerSingleInnerProps) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Dayjs>(() => value ?? dayjs())
  const [calendarMonth, setCalendarMonth] = useState<Dayjs>(() =>
    (value ?? dayjs()).startOf('month')
  )
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({ visibility: 'hidden' })
  const [periodOn, setPeriodOn] = useState(false)
  const [rangeStart, setRangeStart] = useState<Dayjs>(() => value ?? dayjs())
  const [rangeEnd, setRangeEnd] = useState<Dayjs>(() => (value ?? dayjs()).add(1, 'day'))
  const [rangeFocus, setRangeFocus] = useState<'start' | 'end'>('start')
  /** [설정]으로 확정된 기간 — 트리거에 시작/종료 UI 표시 */
  const [surfaceRange, setSurfaceRange] = useState<[Dayjs, Dayjs] | null>(null)
  /** 마지막 [설정] 시 시간 토글이 켜져 있었는지 — 트리거에 날짜+시간 인풋 표시 */
  const [surfaceAppliedWithTime, setSurfaceAppliedWithTime] = useState(false)
  const [timeOn, setTimeOn] = useState(false)
  const [invalidTimeRange, setInvalidTimeRange] = useState(false)
  const [singleHour, setSingleHour] = useState('12')
  const [singleMinute, setSingleMinute] = useState('0')
  const [singleMer, setSingleMer] = useState<'AM' | 'PM'>('AM')
  const [startHour, setStartHour] = useState('9')
  const [startMinute, setStartMinute] = useState('0')
  const [startMer, setStartMer] = useState<'AM' | 'PM'>('AM')
  const [endHour, setEndHour] = useState('10')
  const [endMinute, setEndMinute] = useState('0')
  const [endMer, setEndMer] = useState<'AM' | 'PM'>('AM')

  const showPeriodToggleInFooter = customizable || presetMode === 'schedule'

  const isRangeCalendarMode = useMemo(() => {
    if (customizable) return periodOn
    if (presetMode === 'date') return false
    if (presetMode === 'period') return true
    return periodOn
  }, [customizable, presetMode, periodOn])

  /** 기본값: 오늘 — 부모 값이 null이면 동기화 */
  useEffect(() => {
    if (value == null) {
      onChange(dayjs())
    }
  }, [value, onChange])

  const hasExternalSurfaceControl = appliedSurfaceRange !== undefined

  const appliedSurfaceSyncKey = useMemo(() => {
    if (!hasExternalSurfaceControl) return 'uncontrolled'
    if (appliedSurfaceRange == null) return 'none'
    const [a, b] = appliedSurfaceRange
    if (!a?.isValid() || !b?.isValid()) return 'none'
    return `${a.valueOf()}_${b.valueOf()}_${appliedSurfaceWithTime ? 't' : ''}`
  }, [hasExternalSurfaceControl, appliedSurfaceRange, appliedSurfaceWithTime])

  useEffect(() => {
    if (open) return
    if (!hasExternalSurfaceControl) return
    if (
      appliedSurfaceRange != null &&
      appliedSurfaceRange[0]?.isValid() &&
      appliedSurfaceRange[1]?.isValid()
    ) {
      setSurfaceRange([appliedSurfaceRange[0], appliedSurfaceRange[1]])
      const withTime = Boolean(appliedSurfaceWithTime)
      setSurfaceAppliedWithTime(withTime)
      if (withTime) {
        setTimeOn(true)
        const ta = dayjsTimeParts(appliedSurfaceRange[0])
        const tb = dayjsTimeParts(appliedSurfaceRange[1])
        setStartHour(ta.h)
        setStartMinute(ta.m)
        setStartMer(ta.mer)
        setEndHour(tb.h)
        setEndMinute(tb.m)
        setEndMer(tb.mer)
      } else {
        setTimeOn(false)
      }
    } else {
      setSurfaceRange(null)
      setSurfaceAppliedWithTime(false)
      setTimeOn(false)
    }
  }, [
    open,
    hasExternalSurfaceControl,
    appliedSurfaceSyncKey,
    appliedSurfaceRange,
    appliedSurfaceWithTime,
  ])

  const effectivePlaceholder = placeholder ?? PARAGRAPH_DATE_PRESET_PLACEHOLDERS[presetMode]

  const triggerDisplayText = formatParagraphDatePickerTriggerDisplay(
    value,
    surfaceRange,
    surfaceAppliedWithTime
  )
  const triggerIsEmpty = triggerDisplayText == null

  const updatePopoverPosition = useCallback(() => {
    const trigger = triggerRef.current
    const pop = popoverRef.current
    if (!trigger || !pop) return

    const rect = trigger.getBoundingClientRect()
    const popH = pop.offsetHeight || 400
    const popW = pop.offsetWidth || 500
    const vw = window.innerWidth
    const vh = window.innerHeight
    const scrollX = window.scrollX
    const scrollY = window.scrollY

    let top = rect.bottom + POPOVER_GAP + scrollY
    const spaceBelow = vh - rect.bottom - POPOVER_GAP
    const spaceAbove = rect.top - POPOVER_GAP
    if (spaceBelow < popH && spaceAbove > spaceBelow) {
      top = rect.top - popH - POPOVER_GAP + scrollY
    }

    let left = rect.left + scrollX
    left = Math.min(left, scrollX + vw - popW - 12)
    left = Math.max(left, scrollX + 12)

    setPopoverStyle({
      top,
      left,
      visibility: 'visible',
    })
  }, [])

  const schedulePosition = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => updatePopoverPosition())
    })
  }, [updatePopoverPosition])

  useLayoutEffect(() => {
    if (!open) return
    schedulePosition()
    const onWin = () => schedulePosition()
    window.addEventListener('resize', onWin)
    window.addEventListener('scroll', onWin, true)
    return () => {
      window.removeEventListener('resize', onWin)
      window.removeEventListener('scroll', onWin, true)
    }
  }, [open, isRangeCalendarMode, timeOn, schedulePosition])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t)) return
      if (popoverRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open, rootRef])

  const handleOpen = () => {
    if (disabled) return

    const allowSurfaceRestore = presetMode === 'period' || presetMode === 'schedule' || customizable
    const useSurface = !!(surfaceRange && allowSurfaceRestore)

    if (presetMode === 'date' && !customizable) {
      setPeriodOn(false)
      setSurfaceRange(null)
    }

    if (customizable && !useSurface) {
      setPeriodOn(false)
      setTimeOn(false)
    }

    const d = value ?? dayjs()
    setDraft(d)
    setCalendarMonth(d.startOf('month'))

    if (useSurface) {
      setPeriodOn(true)
      setRangeStart(surfaceRange![0])
      setRangeEnd(surfaceRange![1])
      setRangeFocus('start')
      const ta = dayjsTimeParts(surfaceRange![0])
      const tb = dayjsTimeParts(surfaceRange![1])
      setStartHour(ta.h)
      setStartMinute(ta.m)
      setStartMer(ta.mer)
      setEndHour(tb.h)
      setEndMinute(tb.m)
      setEndMer(tb.mer)
      setTimeOn(surfaceAppliedWithTime)
    } else {
      setRangeStart(d)
      setRangeEnd(d.add(1, 'day'))
      setRangeFocus('start')
      const ta = dayjsTimeParts(d)
      const tb = dayjsTimeParts(d.add(1, 'day'))
      setStartHour(ta.h)
      setStartMinute(ta.m)
      setStartMer(ta.mer)
      setEndHour(tb.h)
      setEndMinute(tb.m)
      setEndMer(tb.mer)

      if (customizable) {
        /* period/time already false above */
      } else if (presetMode === 'period') {
        setPeriodOn(true)
        setTimeOn(false)
      } else {
        setPeriodOn(presetMode === 'schedule' && preferPeriodModeInPopover)
        setTimeOn(false)
      }
    }

    const tSingle = dayjsTimeParts(d)
    setSingleHour(tSingle.h)
    setSingleMinute(tSingle.m)
    setSingleMer(tSingle.mer)

    setInvalidTimeRange(false)
    setOpen(true)
  }

  const handleApply = () => {
    if (isRangeCalendarMode) {
      const sDay = rangeStart.isBefore(rangeEnd, 'day') ? rangeStart : rangeEnd
      const eDay = rangeStart.isBefore(rangeEnd, 'day') ? rangeEnd : rangeStart

      if (timeOn) {
        const start = buildTime(sDay, parseNum(startHour, 12), parseNum(startMinute, 0), startMer)
        const end = buildTime(eDay, parseNum(endHour, 12), parseNum(endMinute, 0), endMer)
        if (!end.isAfter(start)) {
          setInvalidTimeRange(true)
          return
        }
        setInvalidTimeRange(false)
        onRangeChange?.([start, end])
        onChange(start)
        setSurfaceRange([start, end])
        setSurfaceAppliedWithTime(true)
      } else {
        const s = sDay.startOf('day')
        const e = eDay.startOf('day')
        onRangeChange?.([s, e])
        onChange(s)
        setSurfaceRange([s, e])
        setSurfaceAppliedWithTime(false)
      }
    } else if (timeOn) {
      onChange(buildTime(draft, parseNum(singleHour, 12), parseNum(singleMinute, 0), singleMer))
      setSurfaceRange(null)
      setSurfaceAppliedWithTime(true)
    } else {
      onChange(draft)
      setSurfaceRange(null)
      setSurfaceAppliedWithTime(false)
    }
    setOpen(false)
  }

  const handleCalendarSelect = (next: Dayjs) => {
    setInvalidTimeRange(false)
    if (isRangeCalendarMode) {
      if (rangeFocus === 'start') {
        setRangeStart(next)
        if (rangeEnd.isBefore(next, 'day')) setRangeEnd(next)
      } else {
        setRangeEnd(next)
        if (rangeStart.isAfter(next, 'day')) setRangeStart(next)
      }
      setCalendarMonth(next.startOf('month'))
    } else {
      setDraft(next)
      setCalendarMonth(next.startOf('month'))
    }
  }

  const widthStyle = toWidthStyle(width)
  const triggerWidthStyle = customizable && surfaceRange != null ? { width: '500px' } : widthStyle

  const popover = open
    ? createPortal(
        <>
          <div className="paragraph-date-picker__backdrop" aria-hidden />
          <div
            ref={popoverRef}
            id={panelId}
            className={[
              'paragraph-date-picker__popover',
              timeOn ? 'paragraph-date-picker__popover--with-time' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={popoverStyle}
            role="dialog"
            aria-modal="true"
            aria-label="날짜 선택"
          >
            <div className="paragraph-date-picker__popover-body">
              <div className="paragraph-date-picker__popover-calendar">
                <div className="calendar-mini paragraph-date-picker__popover-calendar-mini">
                  <CalendarMini
                    currentMonth={calendarMonth}
                    selectedDate={
                      isRangeCalendarMode ? (rangeFocus === 'start' ? rangeStart : rangeEnd) : draft
                    }
                    onMonthChange={setCalendarMonth}
                    onSelectDate={handleCalendarSelect}
                    programDates={PARAGRAPH_DATE_PICKER_EMPTY_SCHEDULES}
                    rangeSelection={
                      isRangeCalendarMode ? { start: rangeStart, end: rangeEnd } : null
                    }
                  />
                </div>
              </div>
              <div className="paragraph-date-picker__popover-side">
                {isRangeCalendarMode ? (
                  <div className="paragraph-date-picker__popover-fields">
                    <div
                      className="paragraph-date-picker__popover-field"
                      onClick={() => setRangeFocus('start')}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setRangeFocus('start')
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="paragraph-date-picker__popover-field-label">시작일</span>
                      <div className="paragraph-date-picker__popover-datetime-row">
                        <CmsInput
                          className={[
                            'paragraph-date-picker__popover-input',
                            rangeFocus === 'start'
                              ? 'paragraph-date-picker__popover-input--active'
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          width="100%"
                          inputSize="large"
                          readOnly
                          tabIndex={-1}
                          value={formatAppDatepickerDisplay(rangeStart)}
                          aria-label="시작일"
                        />
                        {timeOn ? (
                          <>
                            <span
                              className="paragraph-date-picker__popover-date-time-sep"
                              aria-hidden
                            >
                              |
                            </span>
                            <ParagraphTimeInlineSelects
                              hour={startHour}
                              minute={startMinute}
                              meridiem={startMer}
                              onHourChange={v => {
                                setStartHour(v)
                                setInvalidTimeRange(false)
                              }}
                              onMinuteChange={v => {
                                setStartMinute(v)
                                setInvalidTimeRange(false)
                              }}
                              onMeridiemChange={v => {
                                setStartMer(v)
                                setInvalidTimeRange(false)
                              }}
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
                      className="paragraph-date-picker__popover-field"
                      onClick={() => setRangeFocus('end')}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setRangeFocus('end')
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="paragraph-date-picker__popover-field-label">종료일</span>
                      <div className="paragraph-date-picker__popover-datetime-row">
                        <CmsInput
                          className={[
                            'paragraph-date-picker__popover-input',
                            rangeFocus === 'end'
                              ? 'paragraph-date-picker__popover-input--active'
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          width="100%"
                          inputSize="large"
                          readOnly
                          tabIndex={-1}
                          value={formatAppDatepickerDisplay(rangeEnd)}
                          aria-label="종료일"
                        />
                        {timeOn ? (
                          <>
                            <span
                              className="paragraph-date-picker__popover-date-time-sep"
                              aria-hidden
                            >
                              |
                            </span>
                            <ParagraphTimeInlineSelects
                              hour={endHour}
                              minute={endMinute}
                              meridiem={endMer}
                              onHourChange={v => {
                                setEndHour(v)
                                setInvalidTimeRange(false)
                              }}
                              onMinuteChange={v => {
                                setEndMinute(v)
                                setInvalidTimeRange(false)
                              }}
                              onMeridiemChange={v => {
                                setEndMer(v)
                                setInvalidTimeRange(false)
                              }}
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
                  <div className="paragraph-date-picker__popover-datetime-row paragraph-date-picker__popover-datetime-row--single">
                    <CmsInput
                      className="paragraph-date-picker__popover-input paragraph-date-picker__popover-input--active"
                      width="100%"
                      inputSize="large"
                      readOnly
                      tabIndex={-1}
                      value={formatAppDatepickerDisplay(draft)}
                      aria-label="선택한 날짜"
                    />
                    {timeOn ? (
                      <>
                        <span className="paragraph-date-picker__popover-date-time-sep" aria-hidden>
                          |
                        </span>
                        <ParagraphTimeInlineSelects
                          hour={singleHour}
                          minute={singleMinute}
                          meridiem={singleMer}
                          onHourChange={v => {
                            setSingleHour(v)
                            setInvalidTimeRange(false)
                          }}
                          onMinuteChange={v => {
                            setSingleMinute(v)
                            setInvalidTimeRange(false)
                          }}
                          onMeridiemChange={v => {
                            setSingleMer(v)
                            setInvalidTimeRange(false)
                          }}
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
                  <div className="paragraph-date-picker__popover-time-error" role="alert">
                    종료 일시는 시작 일시보다 이후여야 합니다.
                  </div>
                ) : null}
                <div className="paragraph-date-picker__popover-footer">
                  <div className="paragraph-date-picker__popover-toggles">
                    {showPeriodToggleInFooter ? (
                      <CmsToggle
                        label="기간"
                        checked={periodOn}
                        onChange={next => {
                          setPeriodOn(next)
                          setInvalidTimeRange(false)
                          if (next) {
                            setRangeStart(draft)
                            setRangeEnd(draft.add(1, 'day'))
                            setRangeFocus('start')
                            if (timeOn) {
                              const t1 = dayjsTimeParts(draft)
                              const t2 = dayjsTimeParts(draft.add(1, 'day'))
                              setStartHour(t1.h)
                              setStartMinute(t1.m)
                              setStartMer(t1.mer)
                              setEndHour(t2.h)
                              setEndMinute(t2.m)
                              setEndMer(t2.mer)
                            }
                          }
                        }}
                        disabled={disabled}
                      />
                    ) : null}
                    <CmsToggle
                      label="시간"
                      checked={timeOn}
                      onChange={next => {
                        setTimeOn(next)
                        setInvalidTimeRange(false)
                        if (next && isRangeCalendarMode) {
                          const t1 = dayjsTimeParts(rangeStart)
                          setStartHour(t1.h)
                          setStartMinute(t1.m)
                          setStartMer(t1.mer)
                          const plus = buildTime(
                            rangeStart,
                            parseNum(t1.h, 12),
                            parseNum(t1.m, 0),
                            t1.mer
                          ).add(1, 'hour')
                          const t2 = dayjsTimeParts(plus)
                          setEndHour(t2.h)
                          setEndMinute(t2.m)
                          setEndMer(t2.mer)
                        } else if (next) {
                          const t = dayjsTimeParts(draft)
                          setSingleHour(t.h)
                          setSingleMinute(t.m)
                          setSingleMer(t.mer)
                        }
                      }}
                      disabled={disabled}
                    />
                  </div>
                  <div className="paragraph-date-picker__popover-actions">
                    <CmsButton
                      type="button"
                      variant="primary"
                      size="medium"
                      width="80px"
                      onClick={handleApply}
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
    : null

  const triggerAriaLabel = triggerDisplayText ?? effectivePlaceholder

  return (
    <>
      <div
        ref={triggerRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        className={cn(
          'paragraph-date-picker__trigger',
          disabled && 'paragraph-date-picker__trigger--disabled'
        )}
        style={{ ...triggerWidthStyle }}
        aria-disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={triggerAriaLabel}
        onClick={() => {
          if (disabled) return
          handleOpen()
        }}
        onKeyDown={event => {
          if (disabled) return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleOpen()
          }
        }}
      >
        <CalendarOutlined className="paragraph-date-picker__trigger-icon" aria-hidden />
        <span
          className={cn(
            'paragraph-date-picker__trigger-text',
            triggerIsEmpty && 'paragraph-date-picker__trigger-text--placeholder'
          )}
        >
          {triggerIsEmpty ? effectivePlaceholder : triggerDisplayText}
        </span>
      </div>
      {popover}
    </>
  )
}

export function ParagraphDatePicker(props: ParagraphDatePickerProps) {
  const { label, className, style, disabled } = props
  const rootRef = useRef<HTMLDivElement>(null)

  const singlePresetMode =
    props.mode === 'single'
      ? resolveParagraphDatePresetMode({
          presetMode: props.presetMode,
          showPopoverPeriodToggle: props.showPopoverPeriodToggle,
          preferPeriodModeInPopover: props.preferPeriodModeInPopover,
        })
      : 'date'
  const singleCustomizable = props.mode === 'single' ? Boolean(props.customizable) : false
  const resolvedWidth = props.width ?? '500px'

  return (
    <div
      ref={rootRef}
      className={['paragraph-date-picker', className].filter(Boolean).join(' ')}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', ...style }}
    >
      {label != null ? <span className="fs-16 nowrap">{label}</span> : null}
      {props.mode === 'range' ? (
        <CmsDateRangePicker
          width={resolvedWidth}
          value={props.value}
          placeholder={props.placeholder}
          disabled={disabled}
          onChange={dates => props.onChange([dates?.[0] ?? null, dates?.[1] ?? null])}
        />
      ) : (
        <ParagraphDatePickerSingleInner
          rootRef={rootRef}
          value={props.value}
          onChange={props.onChange}
          onRangeChange={props.onRangeChange}
          presetMode={singlePresetMode}
          customizable={singleCustomizable}
          placeholder={props.placeholder}
          width={resolvedWidth}
          disabled={disabled}
          appliedSurfaceRange={props.appliedSurfaceRange}
          appliedSurfaceWithTime={props.appliedSurfaceWithTime}
          preferPeriodModeInPopover={props.preferPeriodModeInPopover ?? false}
        />
      )}
    </div>
  )
}
