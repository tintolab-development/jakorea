import type { CSSProperties, KeyboardEvent, ReactNode, RefObject } from 'react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
import { CalendarOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  ParagraphDatePickerPopover,
  buildTimeFrom24Hour,
  parseNum,
} from '@/shared/components/date-time-picker-modal'
import {
  dayjsTimeParts,
  findNextEnabledDate,
  toValidDayjsOrNull,
} from '@/shared/components/date-time-picker-shared'
import { formatAppDatepickerDisplay } from '@/shared/ui/cms-datepicker'
import type { CmsControlSize } from '@/shared/ui/cms-control-size'
import './paragraph-date-picker.css'

function formatTriggerClock(d: Dayjs): string {
  return d.format('HH:mm')
}

/** 캘린더 1·2번 클릭(필드 포커스 없음) — 날짜 순으로 시작·종료 시각 부여 */
function chronologicalRangeFromTwoPicks(
  firstPick: Dayjs,
  secondPick: Dayjs,
  startHour: string,
  startMinute: string,
  endHour: string,
  endMinute: string
): [Dayjs, Dayjs] {
  const a = firstPick.startOf('day')
  const b = secondPick.startOf('day')
  const earlier = a.isAfter(b, 'day') ? secondPick : firstPick
  const later = a.isAfter(b, 'day') ? firstPick : secondPick
  return [
    buildTimeFrom24Hour(earlier, parseNum(startHour, 0), parseNum(startMinute, 0)),
    buildTimeFrom24Hour(later, parseNum(endHour, 0), parseNum(endMinute, 0)),
  ]
}

/**
 * 종료일 날짜가 시작일에 고정된 같은 날 일정 — 종료 시각이 시작 이전이면 종료를 뒤로 맞춘다.
 */
function alignLockedSameDayEndTime(
  day: Dayjs,
  startHour: string,
  startMinute: string,
  endHour: string,
  endMinute: string
): { endHour: string; endMinute: string; rangeEnd: Dayjs } {
  const start = buildTimeFrom24Hour(day, parseNum(startHour, 0), parseNum(startMinute, 0))
  let end = buildTimeFrom24Hour(day, parseNum(endHour, 0), parseNum(endMinute, 0))
  if (end.isAfter(start)) {
    const tb = dayjsTimeParts(end)
    return { endHour: tb.h, endMinute: tb.m, rangeEnd: end }
  }

  const byHour = start.add(1, 'hour')
  if (byHour.isSame(start, 'day') && byHour.isAfter(start)) {
    end = byHour
  } else {
    const byMinute = start.add(1, 'minute')
    end =
      byMinute.isSame(start, 'day') && byMinute.isAfter(start)
        ? byMinute
        : start.endOf('day').set('second', 0).set('millisecond', 0)
  }

  const tb = dayjsTimeParts(end)
  return { endHour: tb.h, endMinute: tb.m, rangeEnd: end }
}

/** 트리거 한 줄 표시 (이미지 시안: 동일일 일정은 날짜 한 번 + `시작 ~ 종료시`) */
function formatParagraphDatePickerTriggerDisplay(
  value: Dayjs | null,
  surfaceRange: [Dayjs, Dayjs] | null,
  surfaceAppliedWithTime: boolean
): string | null {
  const resolvedValue = toValidDayjsOrNull(value)
  const empty = resolvedValue == null && surfaceRange == null && !surfaceAppliedWithTime
  if (empty) return null

  const eff = resolvedValue ?? dayjs()

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

/** 저장된 구간·시각으로 팝오버 「기간」토글 ON 여부 복원 (잠금 해제·일정형만) */
function resolveSchedulePeriodOnFromStoredRange(
  range: [Dayjs, Dayjs],
  withTime: boolean,
  opts: {
    presetMode: ParagraphDatePresetMode
    lockPeriodToggleOn: boolean
    lockTimeToggleOn: boolean
  }
): boolean {
  if (opts.presetMode === 'period' || opts.lockPeriodToggleOn) return true
  if (!range[0].isSame(range[1], 'day')) return true
  if (opts.presetMode === 'schedule' && opts.lockTimeToggleOn && withTime) return false
  return false
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
  /** 입력 불가·열림 차단. disabled와 달리 회색 비활성 스킨을 쓰지 않는다(템플릿 편집 비선택 단락). */
  readOnly?: boolean
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
  /**
   * false면 푸터 「시간」 토글 숨김 (`timeOn` 고정 false, `lockTimeToggleOn` 없을 때).
   * 기본 true — 다른 피커 동작 유지.
   */
  showTimeToggle?: boolean
  /**
   * false면 푸터 「기간」 토글 숨김.
   * `presetMode: 'period'`이면 토글만 숨기고 **기간(range) 모드는 ON 고정**.
   * 그 외 preset에서는 기간 모드 OFF.
   * `presetMode: 'schedule'`이어도 기간 선택 UI를 숨길 때 사용.
   * 기본 true.
   */
  showPeriodToggle?: boolean
  /**
   * true면 시간 입력 항상 ON. 푸터 「시간」 토글은 숨김(`showTimeToggle`과 무관).
   * 기본 false — 다른 피커는 기존처럼 토글을 조작할 수 있음.
   */
  lockTimeToggleOn?: boolean
  /**
   * true면 「기간」을 ON으로 고정하고 푸터 토글은 비활성(ON)으로 표시.
   * `showPeriodToggle`이 false여도 `presetMode: 'period'`이면 기간 모드는 유지.
   * 기본 false.
   */
  lockPeriodToggleOn?: boolean
  /**
   * true면 시간 입력 UI는 노출하되 비활성(기관 일정형 단일 기간 등). 적용 시 시각은 제거한다.
   */
  disableTimeInputs?: boolean
  /**
   * 트리거 값은 비운 채, 모달을 열 때만 캘린더·시간 초안으로 쓴다.
   * `value` / `appliedSurfaceRange`에는 영향을 주지 않는다.
   */
  initialPopoverRange?: [Dayjs, Dayjs] | null
}

export type ParagraphDatePickerProps =
  | ParagraphDatePickerRangeProps
  | ParagraphDatePickerSingleProps

function toWidthStyle(width: number | string | undefined): CSSProperties | undefined {
  if (width == null) return undefined
  return { width: typeof width === 'number' ? `${width}px` : width }
}

function isFullWidthPicker(width: number | string | undefined): boolean {
  return width === '100%' || width === '100vw'
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
  readOnly?: boolean
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
  showTimeToggle?: boolean
  showPeriodToggle?: boolean
  lockTimeToggleOn?: boolean
  lockPeriodToggleOn?: boolean
  disableTimeInputs?: boolean
  initialPopoverRange?: [Dayjs, Dayjs] | null
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
  readOnly,
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
  showTimeToggle = true,
  showPeriodToggle = true,
  lockTimeToggleOn = false,
  lockPeriodToggleOn = false,
  disableTimeInputs = false,
  initialPopoverRange = null,
}: ParagraphDatePickerSingleInnerProps) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const resolvedValue = toValidDayjsOrNull(value)

  const [open, setOpen] = useState(false)
  const onOpenChangeRef = useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange

  useEffect(() => {
    onOpenChangeRef.current?.(open)
  }, [open])
  const [draft, setDraft] = useState<Dayjs>(() =>
    findNextEnabledDate(resolvedValue ?? dayjs(), disabledDate)
  )
  const [calendarMonth, setCalendarMonth] = useState<Dayjs>(() =>
    findNextEnabledDate(resolvedValue ?? dayjs(), disabledDate).startOf('month')
  )
  const [periodOn, setPeriodOn] = useState(
    presetMode === 'period' || lockPeriodToggleOn
  )

  useEffect(() => {
    if (presetMode === 'period' || lockPeriodToggleOn) {
      setPeriodOn(true)
      return
    }
    if (showPeriodToggle) return
    setPeriodOn(false)
  }, [
    customizable,
    lockPeriodToggleOn,
    lockTimeToggleOn,
    presetMode,
    showPeriodToggle,
  ])
  const [rangeStart, setRangeStart] = useState<Dayjs>(() =>
    findNextEnabledDate(resolvedValue ?? dayjs(), disabledDate)
  )
  const [rangeEnd, setRangeEnd] = useState<Dayjs>(() =>
    findNextEnabledDate(
      findNextEnabledDate(resolvedValue ?? dayjs(), disabledDate).add(1, 'day'),
      disabledDate
    )
  )
  const [rangeFocus, setRangeFocus] = useState<'start' | 'end'>('start')
  /** 시작일/종료일 필드를 직접 눌렀을 때만 — 캘린더는 해당 필드만 수정 */
  const [explicitRangeFieldFocus, setExplicitRangeFieldFocus] = useState<'start' | 'end' | null>(
    null
  )
  /** 필드 포커스 없이 캘린더 2번 클릭으로 기간 잡는 중 */
  const [awaitingSecondRangePick, setAwaitingSecondRangePick] = useState(false)
  /** [설정]으로 확정된 기간 — 트리거에 시작/종료 UI 표시 */
  const [surfaceRange, setSurfaceRange] = useState<[Dayjs, Dayjs] | null>(null)
  /** 마지막 [설정] 시 시간 토글이 켜져 있었는지 — 트리거에 날짜+시간 인풋 표시 */
  const [surfaceAppliedWithTime, setSurfaceAppliedWithTime] = useState(false)
  /** 마지막 [설정] 시 기간 토글 ON — 잠금 해제 시 팝오버 복원용 */
  const [surfacePeriodOn, setSurfacePeriodOn] = useState<boolean | null>(null)
  const [timeOn, setTimeOn] = useState(() => lockTimeToggleOn)
  const timeToggleLocked = lockTimeToggleOn
  const periodToggleLocked = presetMode === 'period' || lockPeriodToggleOn
  const effectiveTimeOn =
    disableTimeInputs || lockTimeToggleOn || (showTimeToggle && timeOn)
  const showTimeToggleInFooter = showTimeToggle && !lockTimeToggleOn
  const [invalidTimeRange, setInvalidTimeRange] = useState(false)
  const [singleHour, setSingleHour] = useState('9')
  const [singleMinute, setSingleMinute] = useState('0')
  const [startHour, setStartHour] = useState('9')
  const [startMinute, setStartMinute] = useState('0')
  const [endHour, setEndHour] = useState('10')
  const [endMinute, setEndMinute] = useState('0')

  /** 조작 불가(잠금)일 때는 푸터에 기간 토글 미노출 */
  const showPeriodToggleInFooter =
    !periodToggleLocked &&
    showPeriodToggle &&
    (customizable || presetMode === 'schedule')

  useEffect(() => {
    if (!lockTimeToggleOn) return
    setTimeOn(true)
  }, [lockTimeToggleOn])

  useEffect(() => {
    if (!periodToggleLocked) return
    setPeriodOn(true)
  }, [periodToggleLocked])

  /** 진행 일정 — 기간 토글 ON 고정 시 같은 날만, 종료일 날짜는 비활성 노출 */
  const lockRangeEndDate = lockPeriodToggleOn && presetMode === 'schedule'
  /** 일정 + 기간 토글 조작 가능 — OFF일 때도 종료일 인풋은 노출하고 날짜만 비활성 */
  const periodToggleManipulable = presetMode === 'schedule' && showPeriodToggleInFooter
  const lockEndDateToStartDay =
    lockRangeEndDate || (periodToggleManipulable && !periodOn)

  useEffect(() => {
    if (!open || !lockEndDateToStartDay) return
    setRangeFocus('start')
    setRangeEnd(
      buildTimeFrom24Hour(rangeStart, parseNum(endHour, 0), parseNum(endMinute, 0))
    )
  }, [open, lockEndDateToStartDay, rangeStart, endHour, endMinute])

  /** `presetMode: 'period'` — 토글 숨김이어도 기간(range) 캘린더 고정 */
  const isRangeCalendarMode = useMemo(() => {
    if (presetMode === 'period') return true
    if (lockPeriodToggleOn) return true
    if (!showPeriodToggle) return false
    if (customizable) return periodOn
    if (presetMode === 'date') return false
    return periodOn
  }, [
    customizable,
    lockPeriodToggleOn,
    lockTimeToggleOn,
    presetMode,
    periodOn,
    showPeriodToggle,
  ])
  /** 일정 + 시간 — ParagraphTimePicker(종료 시간 고정)와 같이 같은 날 시작·종료 */
  const sameDayTimeRange = presetMode === 'schedule' && effectiveTimeOn && !isRangeCalendarMode

  /**
   * 기본값: 오늘 — 단일 날짜 모드에서만 부모 `value`가 null이면 동기화.
   * `presetMode: 'period'` + `customizable: false`(기간 고정)는 부모가 튜플로만 들고 가므로 여기서 오늘로 채우지 않음.
   * `suppressAutoTodayWhenEmpty`면 null 유지.
   */
  useEffect(() => {
    if (resolvedValue != null) return
    if (presetMode === 'period' && !customizable) return
    if (suppressAutoTodayWhenEmpty) return
    onChange(dayjs())
  }, [resolvedValue, onChange, presetMode, customizable, suppressAutoTodayWhenEmpty])

  const hasExternalSurfaceControl = appliedSurfaceRange !== undefined

  /** 교육 진행 일정 등 — 추가 후 부모가 value를 null로 비우면 트리거 표면도 초기화 */
  useEffect(() => {
    if (resolvedValue != null) return
    if (!suppressAutoTodayWhenEmpty) return
    if (hasExternalSurfaceControl) return
    setSurfaceRange(null)
    setSurfaceAppliedWithTime(false)
    setSurfacePeriodOn(null)
  }, [resolvedValue, suppressAutoTodayWhenEmpty, hasExternalSurfaceControl])

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
      setSurfacePeriodOn(
        resolveSchedulePeriodOnFromStoredRange(
          [appliedSurfaceRange[0], appliedSurfaceRange[1]],
          withTime,
          { presetMode, lockPeriodToggleOn, lockTimeToggleOn }
        )
      )
      if (withTime) {
        setTimeOn(true)
        const ta = dayjsTimeParts(appliedSurfaceRange[0])
        const tb = dayjsTimeParts(appliedSurfaceRange[1])
        setStartHour(ta.h)
        setStartMinute(ta.m)
        setEndHour(tb.h)
        setEndMinute(tb.m)
      } else {
        setTimeOn(false)
      }
    } else {
      setSurfaceRange(null)
      setSurfaceAppliedWithTime(false)
      setSurfacePeriodOn(null)
      setTimeOn(false)
    }
  }, [
    open,
    hasExternalSurfaceControl,
    appliedSurfaceSyncKey,
    appliedSurfaceRange,
    appliedSurfaceWithTime,
    lockPeriodToggleOn,
    lockTimeToggleOn,
    presetMode,
  ])

  const effectivePlaceholder = placeholder ?? PARAGRAPH_DATE_PRESET_PLACEHOLDERS[presetMode]

  /** 목록(교육 진행 예정일 등)에만 노출하고 트리거는 placeholder 유지 */
  const omitTriggerSurfaceDisplay =
    suppressAutoTodayWhenEmpty && resolvedValue == null && !hasExternalSurfaceControl

  const triggerDisplayText = omitTriggerSurfaceDisplay
    ? null
    : formatParagraphDatePickerTriggerDisplay(
        resolvedValue,
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

  const locked = Boolean(disabled || readOnly)

  const handleOpen = () => {
    if (locked) return

    const allowSurfaceRestore = presetMode === 'period' || presetMode === 'schedule' || customizable
    const surfaceHasDisabledDate =
      surfaceRange != null &&
      disabledDate != null &&
      (disabledDate(surfaceRange[0]) || disabledDate(surfaceRange[1]))
    const useSurface = !!(
      surfaceRange &&
      allowSurfaceRestore &&
      !surfaceHasDisabledDate &&
      (showPeriodToggle || presetMode === 'period' || lockPeriodToggleOn)
    )

    if (presetMode === 'date' && !customizable) {
      setPeriodOn(false)
      setSurfaceRange(null)
    }

    if (customizable && !useSurface) {
      setPeriodOn(false)
      setTimeOn(false)
    }

    const initialRange =
      initialPopoverRange != null &&
      initialPopoverRange[0]?.isValid() &&
      initialPopoverRange[1]?.isValid()
        ? initialPopoverRange
        : null
    const d = initialRange
      ? initialRange[0]
      : findNextEnabledDate(resolvedValue ?? dayjs(), disabledDate)
    setDraft(d)
    setCalendarMonth(d.startOf('month'))

    if (useSurface) {
      const restoredPeriodOn =
        surfacePeriodOn ??
        resolveSchedulePeriodOnFromStoredRange(
          surfaceRange!,
          surfaceAppliedWithTime,
          { presetMode, lockPeriodToggleOn, lockTimeToggleOn }
        )
      setPeriodOn(restoredPeriodOn)
      setRangeStart(surfaceRange![0])
      setRangeEnd(surfaceRange![1])
      setRangeFocus('start')
      const ta = dayjsTimeParts(surfaceRange![0])
      const tb = dayjsTimeParts(surfaceRange![1])
      setStartHour(ta.h)
      setStartMinute(ta.m)
      setEndHour(tb.h)
      setEndMinute(tb.m)
      setTimeOn(surfaceAppliedWithTime)
    } else if (initialRange) {
      setRangeStart(initialRange[0])
      setRangeEnd(initialRange[1])
      setRangeFocus('start')
      const ta = dayjsTimeParts(initialRange[0])
      const tb = dayjsTimeParts(initialRange[1])
      setStartHour(ta.h)
      setStartMinute(ta.m)
      setEndHour(tb.h)
      setEndMinute(tb.m)
      setTimeOn(
        initialRange[0].hour() !== 0 ||
          initialRange[0].minute() !== 0 ||
          initialRange[1].hour() !== 0 ||
          initialRange[1].minute() !== 0
      )

      if (customizable) {
        /* period/time already false above */
      } else if (presetMode === 'period') {
        setPeriodOn(true)
        if (!lockTimeToggleOn) setTimeOn(false)
      } else if (!lockPeriodToggleOn) {
        setPeriodOn(showPeriodToggle && presetMode === 'schedule' && preferPeriodModeInPopover)
      }
    } else {
      setRangeStart(d)
      const nextEnd =
        presetMode === 'period' && !customizable
          ? d
          : findNextEnabledDate(d.add(1, 'day'), disabledDate)
      setRangeEnd(nextEnd)
      setRangeFocus('start')
      const ta = dayjsTimeParts(d)
      const tb = dayjsTimeParts(nextEnd)
      setStartHour(ta.h)
      setStartMinute(ta.m)
      setEndHour(tb.h)
      setEndMinute(tb.m)

      if (customizable) {
        /* period/time already false above */
      } else if (presetMode === 'period') {
        setPeriodOn(true)
        if (!lockTimeToggleOn) setTimeOn(false)
      } else if (!lockPeriodToggleOn) {
        setPeriodOn(showPeriodToggle && presetMode === 'schedule' && preferPeriodModeInPopover)
        if (!lockTimeToggleOn) setTimeOn(false)
      }
    }

    const tSingle = dayjsTimeParts(initialRange?.[0] ?? d)
    setSingleHour(tSingle.h)
    setSingleMinute(tSingle.m)
    if (
      presetMode === 'schedule' &&
      !useSurface &&
      !(initialRange != null && initialRange[0].isSame(initialRange[1], 'day'))
    ) {
      const tEnd = dayjsTimeParts((initialRange?.[0] ?? d).add(1, 'hour'))
      setStartHour(tSingle.h)
      setStartMinute(tSingle.m)
      setEndHour(tEnd.h)
      setEndMinute(tEnd.m)
    }

    setInvalidTimeRange(false)
    if (lockTimeToggleOn) setTimeOn(true)
    if (periodToggleLocked || lockPeriodToggleOn) setPeriodOn(true)
    setExplicitRangeFieldFocus(null)
    setAwaitingSecondRangePick(false)
    setOpen(true)
  }

  const handleRangeFocusChange = useCallback((focus: 'start' | 'end') => {
    setRangeFocus(focus)
    setExplicitRangeFieldFocus(focus)
    setAwaitingSecondRangePick(false)
  }, [])

  const handleApply = () => {
    if (isRangeCalendarMode) {
      const sDay = rangeStart.isBefore(rangeEnd, 'day') ? rangeStart : rangeEnd
      const eDay = rangeStart.isBefore(rangeEnd, 'day') ? rangeEnd : rangeStart

      if (disableTimeInputs) {
        const s = sDay.startOf('day')
        const e = eDay.startOf('day')
        onRangeChange?.([s, e])
        if (onRangeChange == null) onChange(s)
        setSurfaceRange([s, e])
        setSurfaceAppliedWithTime(false)
        setSurfacePeriodOn(true)
      } else if (effectiveTimeOn) {
        const start = buildTimeFrom24Hour(sDay, parseNum(startHour, 0), parseNum(startMinute, 0))
        let end = buildTimeFrom24Hour(eDay, parseNum(endHour, 0), parseNum(endMinute, 0))
        if (lockEndDateToStartDay && sDay.isSame(eDay, 'day') && !end.isAfter(start)) {
          const aligned = alignLockedSameDayEndTime(
            sDay,
            startHour,
            startMinute,
            endHour,
            endMinute
          )
          end = aligned.rangeEnd
          setEndHour(aligned.endHour)
          setEndMinute(aligned.endMinute)
          setRangeEnd(aligned.rangeEnd)
        }
        if (!end.isAfter(start)) {
          setInvalidTimeRange(true)
          return
        }
        setInvalidTimeRange(false)
        onRangeChange?.([start, end])
        // 기간 확정 시 onChange(시작일)까지 호출하면 onRangeChange 직후 부모가 [d,d]로 덮어쓰는 패턴이 깨진다.
        if (onRangeChange == null) onChange(start)
        setSurfaceRange([start, end])
        setSurfaceAppliedWithTime(true)
        setSurfacePeriodOn(true)
      } else {
        const s = sDay.startOf('day')
        const e = eDay.endOf('day')
        onRangeChange?.([s, e])
        if (onRangeChange == null) onChange(s)
        setSurfaceRange([s, e])
        setSurfaceAppliedWithTime(false)
        setSurfacePeriodOn(true)
      }
    } else if (effectiveTimeOn && sameDayTimeRange) {
      const start = buildTimeFrom24Hour(draft, parseNum(startHour, 0), parseNum(startMinute, 0))
      const end = buildTimeFrom24Hour(draft, parseNum(endHour, 0), parseNum(endMinute, 0))
      if (!end.isAfter(start)) {
        setInvalidTimeRange(true)
        return
      }
      setInvalidTimeRange(false)
      onRangeChange?.([start, end])
      onChange(start)
      setSurfaceRange(null)
      setSurfaceAppliedWithTime(true)
      setSurfacePeriodOn(false)
    } else if (effectiveTimeOn) {
      const applied = buildTimeFrom24Hour(
        draft,
        parseNum(singleHour, 0),
        parseNum(singleMinute, 0)
      )
      onChange(applied)
      if (presetMode === 'schedule' && onRangeChange) {
        onRangeChange([applied, applied.add(1, 'hour')])
      }
      setSurfaceRange(null)
      setSurfaceAppliedWithTime(true)
      setSurfacePeriodOn(false)
    } else {
      onChange(draft)
      if (presetMode === 'schedule' && onRangeChange) {
        const day = draft.startOf('day')
        onRangeChange([day, day])
      }
      setSurfaceRange(null)
      setSurfaceAppliedWithTime(false)
      setSurfacePeriodOn(false)
    }
    setOpen(false)
  }

  const handleCalendarSelect = (next: Dayjs) => {
    if (disabledDate?.(next)) return

    setInvalidTimeRange(false)
    if (isRangeCalendarMode) {
      if (lockEndDateToStartDay) {
        setRangeStart(next)
        setRangeEnd(
          buildTimeFrom24Hour(next, parseNum(endHour, 0), parseNum(endMinute, 0))
        )
        setExplicitRangeFieldFocus(null)
        setAwaitingSecondRangePick(false)
        setRangeFocus('start')
      } else if (explicitRangeFieldFocus === 'start') {
        const newStart = buildTimeFrom24Hour(
          next,
          parseNum(startHour, 0),
          parseNum(startMinute, 0)
        )
        setRangeStart(newStart)
        if (newStart.isAfter(rangeEnd, 'day')) {
          setRangeEnd(
            buildTimeFrom24Hour(next, parseNum(endHour, 0), parseNum(endMinute, 0))
          )
        }
        // 시작일을 직접 지정한 뒤에는 다음 캘린더 선택을 종료일로 처리한다.
        setExplicitRangeFieldFocus(null)
        setAwaitingSecondRangePick(true)
        setRangeFocus('end')
      } else if (explicitRangeFieldFocus === 'end') {
        const newEnd = buildTimeFrom24Hour(next, parseNum(endHour, 0), parseNum(endMinute, 0))
        setRangeEnd(newEnd)
        if (rangeStart.isAfter(next, 'day')) {
          setRangeStart(
            buildTimeFrom24Hour(next, parseNum(startHour, 0), parseNum(startMinute, 0))
          )
        }
        // 종료일을 직접 지정한 뒤에는 기간 선택을 완료하고 다음 선택을 새 시작일로 연다.
        setExplicitRangeFieldFocus(null)
        setAwaitingSecondRangePick(false)
        setRangeFocus('end')
      } else if (!awaitingSecondRangePick) {
        setRangeStart(
          buildTimeFrom24Hour(next, parseNum(startHour, 0), parseNum(startMinute, 0))
        )
        setRangeEnd(
          buildTimeFrom24Hour(next, parseNum(endHour, 0), parseNum(endMinute, 0))
        )
        setAwaitingSecondRangePick(true)
        setRangeFocus('end')
      } else {
        const [sortedStart, sortedEnd] = chronologicalRangeFromTwoPicks(
          rangeStart,
          next,
          startHour,
          startMinute,
          endHour,
          endMinute
        )
        setRangeStart(sortedStart)
        setRangeEnd(sortedEnd)
        setAwaitingSecondRangePick(false)
        setRangeFocus('end')
      }
      setDraft(next)
      setCalendarMonth(next.startOf('month'))
    } else if (lockEndDateToStartDay) {
      setRangeStart(next)
      setRangeEnd(
        buildTimeFrom24Hour(next, parseNum(endHour, 0), parseNum(endMinute, 0))
      )
      setDraft(next)
      setCalendarMonth(next.startOf('month'))
    } else {
      setDraft(next)
      setCalendarMonth(next.startOf('month'))
    }
  }

  const widthStyle = toWidthStyle(width)
  const triggerWidthStyle = customizable && surfaceRange != null ? { width: '500px' } : widthStyle

  const useDualPeriodTrigger = dualPeriodTrigger && presetMode === 'period'
  const useDualFluidLayout = useDualPeriodTrigger && isFullWidthPicker(width)
  const dualShellWidthStyle = useDualFluidLayout ? toWidthStyle('100%') : undefined
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
    tabIndex: locked ? -1 : 0,
    'aria-disabled': locked,
    'aria-readonly': readOnly && !disabled ? true : undefined,
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': open,
    'aria-controls': open ? panelId : undefined,
    onClick: () => {
      if (locked) return
      handleOpen()
    },
    onKeyDown: (event: KeyboardEvent) => {
      if (locked) return
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
            useDualFluidLayout && 'paragraph-date-picker__trigger--dual-fluid',
            disabled && 'paragraph-date-picker__trigger--disabled',
            readOnly && !disabled && 'paragraph-date-picker__trigger--readonly'
          )}
          style={dualShellWidthStyle}
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
            disabled && 'paragraph-date-picker__trigger--disabled',
            readOnly && !disabled && 'paragraph-date-picker__trigger--readonly'
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
        isRangeCalendarMode={isRangeCalendarMode || lockPeriodToggleOn}
        sameDayTimeRange={sameDayTimeRange}
        timeOn={effectiveTimeOn}
        timeInputsDisabled={disableTimeInputs}
        inputSize={inputSize}
        calendarMonth={calendarMonth}
        onCalendarMonthChange={setCalendarMonth}
        draft={draft}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        rangeFocus={rangeFocus}
        onRangeFocusChange={handleRangeFocusChange}
        onCalendarSelect={handleCalendarSelect}
        singleHour={singleHour}
        singleMinute={singleMinute}
        onSingleHourChange={v => {
          setSingleHour(v)
          setInvalidTimeRange(false)
        }}
        onSingleMinuteChange={v => {
          setSingleMinute(v)
          setInvalidTimeRange(false)
        }}
        startHour={startHour}
        startMinute={startMinute}
        onStartHourChange={v => {
          setStartHour(v)
          setInvalidTimeRange(false)
          if (lockEndDateToStartDay) {
            const newStart = buildTimeFrom24Hour(rangeStart, parseNum(v, 0), parseNum(startMinute, 0))
            setRangeStart(newStart)
            const aligned = alignLockedSameDayEndTime(
              newStart,
              v,
              startMinute,
              endHour,
              endMinute
            )
            if (aligned.endHour !== endHour) setEndHour(aligned.endHour)
            if (aligned.endMinute !== endMinute) setEndMinute(aligned.endMinute)
            setRangeEnd(aligned.rangeEnd)
          }
        }}
        onStartMinuteChange={v => {
          setStartMinute(v)
          setInvalidTimeRange(false)
          if (lockEndDateToStartDay) {
            const newStart = buildTimeFrom24Hour(rangeStart, parseNum(startHour, 0), parseNum(v, 0))
            setRangeStart(newStart)
            const aligned = alignLockedSameDayEndTime(
              newStart,
              startHour,
              v,
              endHour,
              endMinute
            )
            if (aligned.endHour !== endHour) setEndHour(aligned.endHour)
            if (aligned.endMinute !== endMinute) setEndMinute(aligned.endMinute)
            setRangeEnd(aligned.rangeEnd)
          }
        }}
        endHour={endHour}
        endMinute={endMinute}
        onEndHourChange={v => {
          setEndHour(v)
          setInvalidTimeRange(false)
          if (lockEndDateToStartDay) {
            setRangeEnd(
              buildTimeFrom24Hour(rangeStart, parseNum(v, 0), parseNum(endMinute, 0))
            )
          }
        }}
        onEndMinuteChange={v => {
          setEndMinute(v)
          setInvalidTimeRange(false)
          if (lockEndDateToStartDay) {
            setRangeEnd(
              buildTimeFrom24Hour(rangeStart, parseNum(endHour, 0), parseNum(v, 0))
            )
          }
        }}
        rangeEndDateDisabled={lockEndDateToStartDay}
        invalidTimeRange={invalidTimeRange}
        showPeriodToggle={showPeriodToggleInFooter}
        showTimeToggle={showTimeToggleInFooter}
        periodToggleDisabled={periodToggleLocked}
        timeToggleDisabled={timeToggleLocked && showTimeToggleInFooter}
        periodOn={periodOn}
        onPeriodOnChange={next => {
          if (periodToggleLocked) return
          setPeriodOn(next)
          setInvalidTimeRange(false)
          if (!next && periodToggleManipulable) {
            const day = rangeStart.startOf('day')
            setDraft(day)
            setRangeEnd(
              buildTimeFrom24Hour(rangeStart, parseNum(endHour, 0), parseNum(endMinute, 0))
            )
            setRangeFocus('start')
            setCalendarMonth(day.startOf('month'))
          } else if (
            !next &&
            presetMode === 'schedule' &&
            lockTimeToggleOn &&
            !lockPeriodToggleOn
          ) {
            const day = rangeStart.startOf('day')
            setDraft(day)
            setCalendarMonth(day.startOf('month'))
          }
        }}
        onTimeOnChange={next => {
          if (timeToggleLocked) return
          setTimeOn(next)
          setInvalidTimeRange(false)
        }}
        onApply={handleApply}
        onPeriodToggleOn={(d, nextEnd) => {
          setRangeStart(d)
          setRangeEnd(nextEnd)
          setRangeFocus('start')
          if (effectiveTimeOn) {
            const t1 = dayjsTimeParts(d)
            const t2 = dayjsTimeParts(nextEnd)
            setStartHour(t1.h)
            setStartMinute(t1.m)
            setEndHour(t2.h)
            setEndMinute(t2.m)
          }
        }}
        onTimeToggleOn={({ isRange, rangeStart: rs, draft: d }) => {
          if (isRange) {
            const t1 = dayjsTimeParts(rs)
            setStartHour(t1.h)
            setStartMinute(t1.m)
            const plus = buildTimeFrom24Hour(rs, parseNum(t1.h, 0), parseNum(t1.m, 0)).add(
              1,
              'hour'
            )
            const t2 = dayjsTimeParts(plus)
            setEndHour(t2.h)
            setEndMinute(t2.m)
          } else {
            const t = dayjsTimeParts(d)
            setSingleHour(t.h)
            setSingleMinute(t.m)
            setStartHour(t.h)
            setStartMinute(t.m)
            const plus = d.add(1, 'hour')
            const t2 = dayjsTimeParts(plus)
            setEndHour(t2.h)
            setEndMinute(t2.m)
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
  readOnly,
  disabledDate,
}: {
  rootRef: RefObject<HTMLDivElement | null>
  value: ParagraphRangeValue
  onChange: (next: ParagraphRangeValue) => void
  placeholder?: [string, string]
  width?: number | string
  inputSize?: CmsControlSize
  disabled?: boolean
  readOnly?: boolean
  disabledDate?: (date: Dayjs) => boolean
}) {
  const valueRef = useRef(value)
  valueRef.current = value

  const start = toValidDayjsOrNull(value[0])
  const end = toValidDayjsOrNull(value[1])
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
      readOnly={readOnly}
      disabledDate={disabledDate}
      appliedSurfaceRange={appliedSurfaceRange}
      appliedSurfaceWithTime={false}
      preferPeriodModeInPopover={false}
      suppressAutoTodayWhenEmpty={false}
    />
  )
}

export function ParagraphDatePicker(props: ParagraphDatePickerProps) {
  const { label, className, style, disabled, readOnly } = props
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
  const dualFluidRoot =
    props.mode !== 'range' &&
    Boolean(props.dualPeriodTrigger) &&
    isFullWidthPicker(props.width)

  return (
    <div
      ref={rootRef}
      className={[
        'paragraph-date-picker',
        dualFluidRoot && 'paragraph-date-picker--dual-fluid',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
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
          readOnly={readOnly}
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
          readOnly={readOnly}
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
          showTimeToggle={props.mode === 'single' ? (props.showTimeToggle ?? true) : true}
          showPeriodToggle={props.mode === 'single' ? (props.showPeriodToggle ?? true) : true}
          lockTimeToggleOn={props.mode === 'single' ? Boolean(props.lockTimeToggleOn) : false}
          lockPeriodToggleOn={props.mode === 'single' ? Boolean(props.lockPeriodToggleOn) : false}
          disableTimeInputs={props.mode === 'single' ? Boolean(props.disableTimeInputs) : false}
          initialPopoverRange={props.mode === 'single' ? props.initialPopoverRange : null}
        />
      )}
    </div>
  )
}
