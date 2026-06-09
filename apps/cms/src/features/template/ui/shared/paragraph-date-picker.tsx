import type { CSSProperties, KeyboardEvent, ReactNode, RefObject } from 'react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
import { CalendarOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  ParagraphDatePickerPopover,
  buildTime,
  parseNum,
} from '@/shared/components/date-time-picker-modal'
import {
  dayjsTimeParts,
  findNextEnabledDate,
} from '@/shared/components/date-time-picker-shared'
import { formatAppDatepickerDisplay } from '@/shared/ui/cms-datepicker'
import type { CmsControlSize } from '@/shared/ui/cms-control-size'
import './paragraph-date-picker.css'

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

type ParagraphRangeValue = [Dayjs | null, Dayjs | null]

interface ParagraphDatePickerBaseProps {
  label?: ReactNode
  width?: number | string
  /** 트리거 인풋 크기. 기본값은 medium. */
  inputSize?: CmsControlSize
  className?: string
  style?: CSSProperties
  disabled?: boolean
  /** true를 반환하는 날짜는 캘린더에서 비활성화하고 선택을 막는다. */
  disabledDate?: (date: Dayjs) => boolean
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
  /**
   * true면 부모 `value`가 null일 때 오늘로 `onChange`를 호출하지 않음(빈 값 유지).
   * 기본 false — 기존 단일 날짜형은 null이면 오늘로 동기화.
   */
  suppressAutoTodayWhenEmpty?: boolean
  /** `presetMode: 'period'` — 제목형 작성 기간 듀얼 트리거(시작 ~ 종료) */
  dualPeriodTrigger?: boolean
  dualStartPlaceholder?: string
  dualEndPlaceholder?: string
  /** value·surface 비어 있을 때 트리거에 일반 텍스트로 표시(예: 상대 종료 규칙) */
  presetDisplayText?: string
  /** 모달(포털) 열림·닫힘 — 테이블 행 포커스 등 상위 동기화용 */
  onOpenChange?: (open: boolean) => void
}

export type ParagraphDatePickerProps =
  | ParagraphDatePickerRangeProps
  | ParagraphDatePickerSingleProps

function toWidthStyle(width: number | string | undefined): CSSProperties | undefined {
  if (width == null) return undefined
  return { width: typeof width === 'number' ? `${width}px` : width }
}

function formatDualPeriodCellText(d: Dayjs, withTime: boolean): string {
  const date = formatAppDatepickerDisplay(d)
  if (withTime) return `${date} (${formatTriggerClock(d)})`
  return date
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
  inputSize?: CmsControlSize
  disabled?: boolean
  disabledDate?: (date: Dayjs) => boolean
  appliedSurfaceRange?: [Dayjs, Dayjs] | null
  appliedSurfaceWithTime?: boolean
  preferPeriodModeInPopover?: boolean
  suppressAutoTodayWhenEmpty?: boolean
  dualPeriodTrigger?: boolean
  dualStartPlaceholder?: string
  dualEndPlaceholder?: string
  presetDisplayText?: string
  onOpenChange?: (open: boolean) => void
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
  inputSize = 'medium',
  disabled,
  disabledDate,
  appliedSurfaceRange,
  appliedSurfaceWithTime = false,
  preferPeriodModeInPopover = false,
  suppressAutoTodayWhenEmpty = false,
  dualPeriodTrigger = false,
  dualStartPlaceholder = '바로 시작',
  dualEndPlaceholder = '마감 없음',
  presetDisplayText,
  onOpenChange,
}: ParagraphDatePickerSingleInnerProps) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  const [open, setOpen] = useState(false)
  const onOpenChangeRef = useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange

  useEffect(() => {
    onOpenChangeRef.current?.(open)
  }, [open])
  const [draft, setDraft] = useState<Dayjs>(() => findNextEnabledDate(value ?? dayjs(), disabledDate))
  const [calendarMonth, setCalendarMonth] = useState<Dayjs>(() =>
    findNextEnabledDate(value ?? dayjs(), disabledDate).startOf('month')
  )
  const [periodOn, setPeriodOn] = useState(false)
  const [rangeStart, setRangeStart] = useState<Dayjs>(() =>
    findNextEnabledDate(value ?? dayjs(), disabledDate)
  )
  const [rangeEnd, setRangeEnd] = useState<Dayjs>(() =>
    findNextEnabledDate(findNextEnabledDate(value ?? dayjs(), disabledDate).add(1, 'day'), disabledDate)
  )
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

  /**
   * 기본값: 오늘 — 단일 날짜 모드에서만 부모 `value`가 null이면 동기화.
   * `presetMode: 'period'` + `customizable: false`(기간 고정)는 부모가 튜플로만 들고 가므로 여기서 오늘로 채우지 않음.
   * `suppressAutoTodayWhenEmpty`면 null 유지.
   */
  useEffect(() => {
    if (value != null) return
    if (presetMode === 'period' && !customizable) return
    if (suppressAutoTodayWhenEmpty) return
    onChange(dayjs())
  }, [value, onChange, presetMode, customizable, suppressAutoTodayWhenEmpty])

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
  const presetDisplay = presetDisplayText?.trim()
  const showPresetAsFilled = triggerIsEmpty && Boolean(presetDisplay)
  const triggerAriaLabel = showPresetAsFilled
    ? presetDisplay!
    : triggerIsEmpty
      ? effectivePlaceholder
      : triggerDisplayText

  const handleOpen = () => {
    if (disabled) return

    const allowSurfaceRestore = presetMode === 'period' || presetMode === 'schedule' || customizable
    const surfaceHasDisabledDate =
      surfaceRange != null &&
      disabledDate != null &&
      (disabledDate(surfaceRange[0]) || disabledDate(surfaceRange[1]))
    const useSurface = !!(surfaceRange && allowSurfaceRestore && !surfaceHasDisabledDate)

    if (presetMode === 'date' && !customizable) {
      setPeriodOn(false)
      setSurfaceRange(null)
    }

    if (customizable && !useSurface) {
      setPeriodOn(false)
      setTimeOn(false)
    }

    const d = findNextEnabledDate(value ?? dayjs(), disabledDate)
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
      const nextEnd = findNextEnabledDate(d.add(1, 'day'), disabledDate)
      setRangeEnd(nextEnd)
      setRangeFocus('start')
      const ta = dayjsTimeParts(d)
      const tb = dayjsTimeParts(nextEnd)
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
    if (disabledDate?.(next)) return

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

  const useDualPeriodTrigger = dualPeriodTrigger && presetMode === 'period'
  const dualStartText =
    surfaceRange != null
      ? formatDualPeriodCellText(surfaceRange[0], surfaceAppliedWithTime)
      : dualStartPlaceholder
  const dualEndText =
    surfaceRange != null
      ? formatDualPeriodCellText(surfaceRange[1], surfaceAppliedWithTime)
      : dualEndPlaceholder
  const dualTriggerAriaLabel = `${dualStartText} ~ ${dualEndText}`

  const triggerShellProps = {
    ref: triggerRef,
    role: 'button' as const,
    tabIndex: disabled ? -1 : 0,
    'aria-disabled': disabled,
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': open,
    'aria-controls': open ? panelId : undefined,
    onClick: () => {
      if (disabled) return
      handleOpen()
    },
    onKeyDown: (event: KeyboardEvent) => {
      if (disabled) return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleOpen()
      }
    },
  }

  return (
    <>
      {useDualPeriodTrigger ? (
        <div
          {...triggerShellProps}
          className={cn(
            'paragraph-date-picker__trigger',
            'paragraph-date-picker__trigger--dual-shell',
            disabled && 'paragraph-date-picker__trigger--disabled'
          )}
          aria-label={dualTriggerAriaLabel}
        >
          <div className="paragraph-date-picker__trigger-dual-row">
            <div className="paragraph-date-picker__trigger-dual-cell">
              <CalendarOutlined className="paragraph-date-picker__trigger-icon" aria-hidden />
              <span className="paragraph-date-picker__trigger-dual-text">{dualStartText}</span>
            </div>
            <span className="paragraph-date-picker__trigger-dual-wave" aria-hidden>
              ~
            </span>
            <div className="paragraph-date-picker__trigger-dual-cell">
              <CalendarOutlined className="paragraph-date-picker__trigger-icon" aria-hidden />
              <span className="paragraph-date-picker__trigger-dual-text">{dualEndText}</span>
            </div>
          </div>
        </div>
      ) : (
        <div
          {...triggerShellProps}
          className={cn(
            'paragraph-date-picker__trigger',
            `paragraph-date-picker__trigger--${inputSize}`,
            disabled && 'paragraph-date-picker__trigger--disabled'
          )}
          style={{ ...triggerWidthStyle }}
          aria-label={triggerAriaLabel}
        >
          <CalendarOutlined className="paragraph-date-picker__trigger-icon" aria-hidden />
          <span
            className={cn(
              'paragraph-date-picker__trigger-text',
              triggerIsEmpty && !showPresetAsFilled && 'paragraph-date-picker__trigger-text--placeholder'
            )}
          >
            {showPresetAsFilled
              ? presetDisplay
              : triggerIsEmpty
                ? effectivePlaceholder
                : triggerDisplayText}
          </span>
        </div>
      )}
      <ParagraphDatePickerPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        dismissExcludeRef={rootRef}
        panelId={panelId}
        disabled={disabled}
        disabledDate={disabledDate}
        isRangeCalendarMode={isRangeCalendarMode}
        timeOn={timeOn}
        calendarMonth={calendarMonth}
        onCalendarMonthChange={setCalendarMonth}
        draft={draft}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        rangeFocus={rangeFocus}
        onRangeFocusChange={setRangeFocus}
        onCalendarSelect={handleCalendarSelect}
        singleHour={singleHour}
        singleMinute={singleMinute}
        singleMer={singleMer}
        onSingleHourChange={v => {
          setSingleHour(v)
          setInvalidTimeRange(false)
        }}
        onSingleMinuteChange={v => {
          setSingleMinute(v)
          setInvalidTimeRange(false)
        }}
        onSingleMerChange={v => {
          setSingleMer(v)
          setInvalidTimeRange(false)
        }}
        startHour={startHour}
        startMinute={startMinute}
        startMer={startMer}
        onStartHourChange={v => {
          setStartHour(v)
          setInvalidTimeRange(false)
        }}
        onStartMinuteChange={v => {
          setStartMinute(v)
          setInvalidTimeRange(false)
        }}
        onStartMerChange={v => {
          setStartMer(v)
          setInvalidTimeRange(false)
        }}
        endHour={endHour}
        endMinute={endMinute}
        endMer={endMer}
        onEndHourChange={v => {
          setEndHour(v)
          setInvalidTimeRange(false)
        }}
        onEndMinuteChange={v => {
          setEndMinute(v)
          setInvalidTimeRange(false)
        }}
        onEndMerChange={v => {
          setEndMer(v)
          setInvalidTimeRange(false)
        }}
        invalidTimeRange={invalidTimeRange}
        showPeriodToggle={showPeriodToggleInFooter}
        periodOn={periodOn}
        onPeriodOnChange={next => {
          setPeriodOn(next)
          setInvalidTimeRange(false)
        }}
        onTimeOnChange={next => {
          setTimeOn(next)
          setInvalidTimeRange(false)
        }}
        onApply={handleApply}
        onPeriodToggleOn={(d, nextEnd) => {
          setRangeStart(d)
          setRangeEnd(nextEnd)
          setRangeFocus('start')
          if (timeOn) {
            const t1 = dayjsTimeParts(d)
            const t2 = dayjsTimeParts(nextEnd)
            setStartHour(t1.h)
            setStartMinute(t1.m)
            setStartMer(t1.mer)
            setEndHour(t2.h)
            setEndMinute(t2.m)
            setEndMer(t2.mer)
          }
        }}
        onTimeToggleOn={({ isRange, rangeStart: rs, draft: d }) => {
          if (isRange) {
            const t1 = dayjsTimeParts(rs)
            setStartHour(t1.h)
            setStartMinute(t1.m)
            setStartMer(t1.mer)
            const plus = buildTime(rs, parseNum(t1.h, 12), parseNum(t1.m, 0), t1.mer).add(1, 'hour')
            const t2 = dayjsTimeParts(plus)
            setEndHour(t2.h)
            setEndMinute(t2.m)
            setEndMer(t2.mer)
          } else {
            const t = dayjsTimeParts(d)
            setSingleHour(t.h)
            setSingleMinute(t.m)
            setSingleMer(t.mer)
          }
        }}
      />
    </>
  )
}

/** `mode: 'range'` — Ant 분할 RangePicker 대신 기간 프리셋 단일 피커(동일 포털 모달)로 노출·레이어 충돌 방지 */
function ParagraphDatePickerRangeBridge({
  rootRef,
  value,
  onChange,
  placeholder,
  width,
  inputSize,
  disabled,
  disabledDate,
}: {
  rootRef: RefObject<HTMLDivElement | null>
  value: ParagraphRangeValue
  onChange: (next: ParagraphRangeValue) => void
  placeholder?: [string, string]
  width?: number | string
  inputSize?: CmsControlSize
  disabled?: boolean
  disabledDate?: (date: Dayjs) => boolean
}) {
  const valueRef = useRef(value)
  valueRef.current = value

  const [start, end] = value
  const anchor = start ?? end ?? null
  const appliedSurfaceRange =
    start != null && end != null && start.isValid() && end.isValid()
      ? ([start, end] as [Dayjs, Dayjs])
      : null

  const mergedPlaceholder =
    placeholder != null && placeholder.length >= 2
      ? placeholder[0] === placeholder[1]
        ? placeholder[0]
        : `${placeholder[0]} ~ ${placeholder[1]}`
      : undefined

  return (
    <ParagraphDatePickerSingleInner
      rootRef={rootRef}
      value={anchor}
      onChange={next => {
        const [, e] = valueRef.current
        onChange([next, e])
      }}
      onRangeChange={range => {
        valueRef.current = [range[0], range[1]]
        onChange([range[0], range[1]])
      }}
      presetMode="period"
      customizable={false}
      placeholder={mergedPlaceholder}
      width={width}
      inputSize={inputSize}
      disabled={disabled}
      disabledDate={disabledDate}
      appliedSurfaceRange={appliedSurfaceRange}
      appliedSurfaceWithTime={false}
      preferPeriodModeInPopover={false}
      suppressAutoTodayWhenEmpty={false}
    />
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
      style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, ...style }}
    >
      {label != null ? <span className="fs-16 nowrap">{label}</span> : null}
      {props.mode === 'range' ? (
        <ParagraphDatePickerRangeBridge
          rootRef={rootRef}
          value={props.value}
          onChange={props.onChange}
          placeholder={props.placeholder}
          width={resolvedWidth}
          inputSize={props.inputSize}
          disabled={disabled}
          disabledDate={props.disabledDate}
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
          inputSize={props.inputSize}
          disabled={disabled}
          disabledDate={props.disabledDate}
          appliedSurfaceRange={props.appliedSurfaceRange}
          appliedSurfaceWithTime={props.appliedSurfaceWithTime}
          preferPeriodModeInPopover={props.preferPeriodModeInPopover ?? false}
          suppressAutoTodayWhenEmpty={Boolean(props.suppressAutoTodayWhenEmpty)}
          dualPeriodTrigger={props.dualPeriodTrigger}
          dualStartPlaceholder={props.dualStartPlaceholder}
          dualEndPlaceholder={props.dualEndPlaceholder}
          presetDisplayText={props.presetDisplayText}
          onOpenChange={props.mode === 'single' ? props.onOpenChange : undefined}
        />
      )}
    </div>
  )
}
