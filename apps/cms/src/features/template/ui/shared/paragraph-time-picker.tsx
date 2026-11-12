import type { CSSProperties } from 'react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  ParagraphTimePickerPopover,
  buildTimeFrom24Hour,
  parseNum,
} from '@/shared/components/date-time-picker-modal'
import { snapMinuteToStep, toValidDayjsOrNull } from '@/shared/components/date-time-picker-shared'
import type { CmsControlSize } from '@/shared/ui/cms-control-size'
import { FieldClockIcon } from '@/shared/ui/icons'
import '@jakorea/admin-ui/date/styles'
import './paragraph-time-picker.css'

export {
  ParagraphTimeInlineSelects,
  buildTime,
  buildTimeFrom24Hour,
  from24h,
  parseNum,
} from '@/shared/components/date-time-picker-modal'

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export interface ParagraphTimePickerProps {
  value?: Dayjs | null
  onChange?: (next: Dayjs | null) => void
  onTimeRangeChange?: (range: [Dayjs, Dayjs]) => void
  placeholder?: string
  disabled?: boolean
  /** 입력 불가·열림 차단. disabled와 달리 회색 비활성 스킨을 쓰지 않는다. */
  readOnly?: boolean
  className?: string
  style?: CSSProperties
  width?: number | string
  /** large 44px / medium 40px / small 32px */
  inputSize?: CmsControlSize
  endTimeAlwaysOn?: boolean
  zIndex?: number
  showEndTimeToggle?: boolean
  /** 마운트 시 트리거에 표시할 시간 범위(프로그램 상세 수정 mock 시드 등) */
  initialTimeRange?: [Dayjs, Dayjs] | null
  /** opt-in: 값이 없을 때 팝업 시작 시각(기본은 현재 시각). 예: { hour: 9, minute: 0 } */
  defaultStartTime?: { hour: number; minute: number }
  /** opt-in: 분 선택 스텝(예: 30 → 00/30). 기존 값의 분은 스텝에 맞춰 내림한다 */
  minuteStep?: number
  /** opt-in: 활성 행의 분 셀렉트도 강조 */
  emphasizeActiveMinute?: boolean
}

type FocusPhase = 'single' | 'start' | 'end'

export function ParagraphTimePicker({
  value = null,
  onChange,
  onTimeRangeChange,
  placeholder = '시간 선택',
  disabled,
  readOnly,
  className,
  style,
  width,
  inputSize = 'medium',
  endTimeAlwaysOn = false,
  zIndex,
  showEndTimeToggle = true,
  initialTimeRange = null,
  defaultStartTime,
  minuteStep,
  emphasizeActiveMinute = false,
}: ParagraphTimePickerProps) {
  const rootRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const resolvedValue = toValidDayjsOrNull(value)

  const [open, setOpen] = useState(false)
  const [endTimeOn, setEndTimeOn] = useState(endTimeAlwaysOn)
  const [focusPhase, setFocusPhase] = useState<FocusPhase>('single')

  const [sHour, setSHour] = useState('9')
  const [sMin, setSMin] = useState('0')

  const [eHour, setEHour] = useState('10')
  const [eMin, setEMin] = useState('0')

  const [surfaceTimeRange, setSurfaceTimeRange] = useState<[Dayjs, Dayjs] | null>(null)
  const isEndTimeOn = endTimeAlwaysOn || endTimeOn

  const hasExplicitWidth = width != null
  const widthStyle: CSSProperties | undefined =
    width != null ? { width: typeof width === 'number' ? `${width}px` : width } : undefined

  const triggerDisplay =
    surfaceTimeRange != null
      ? `${surfaceTimeRange[0].format('HH:mm')} ~ ${surfaceTimeRange[1].format('HH:mm')}`
      : resolvedValue != null
        ? resolvedValue.format('HH:mm')
        : null
  const triggerIsPlaceholder = triggerDisplay == null

  const initialStartMs = initialTimeRange?.[0]?.valueOf()
  const initialEndMs = initialTimeRange?.[1]?.valueOf()
  const valueMs = resolvedValue?.valueOf()
  const initialTimeRangeRef = useRef(initialTimeRange)
  const valueRef = useRef(resolvedValue)
  initialTimeRangeRef.current = initialTimeRange
  valueRef.current = resolvedValue

  useEffect(() => {
    if (endTimeAlwaysOn) {
      setEndTimeOn(prev => (prev ? prev : true))
    }
  }, [endTimeAlwaysOn])

  useEffect(() => {
    const range = initialTimeRangeRef.current
    if (range != null && initialStartMs != null && initialEndMs != null) {
      setSurfaceTimeRange(prev => {
        if (prev != null && prev[0].valueOf() === initialStartMs && prev[1].valueOf() === initialEndMs) {
          return prev
        }
        return range
      })
      return
    }

    const current = valueRef.current
    if (current == null) {
      setSurfaceTimeRange(prev => (prev == null ? prev : null))
      return
    }

    setSurfaceTimeRange(prev => {
      if (prev == null) return prev
      return current.isSame(prev[0], 'minute') ? prev : null
    })
  }, [initialEndMs, initialStartMs, valueMs])

  const minuteForStep = useCallback(
    (minute: number) => snapMinuteToStep(minute, minuteStep),
    [minuteStep]
  )

  const populateDraftFromInstant = useCallback(
    (d: Dayjs) => {
      setSHour(String(d.hour()))
      setSMin(String(minuteForStep(d.minute())))
      const dEnd = d.add(1, 'hour')
      setEHour(String(dEnd.hour()))
      setEMin(String(minuteForStep(dEnd.minute())))
    },
    [minuteForStep]
  )

  const populateDraftFromRange = useCallback(
    (start: Dayjs, end: Dayjs) => {
      setSHour(String(start.hour()))
      setSMin(String(minuteForStep(start.minute())))
      setEHour(String(end.hour()))
      setEMin(String(minuteForStep(end.minute())))
    },
    [minuteForStep]
  )

  /** 값이 없을 때 팝업 기준 시각 — opt-in 기본 시각, 없으면 현재 시각(기존 동작) */
  const resolveEmptyBase = (): Dayjs =>
    defaultStartTime != null
      ? dayjs().hour(defaultStartTime.hour).minute(defaultStartTime.minute).second(0).millisecond(0)
      : dayjs()

  const locked = Boolean(disabled || readOnly)

  const handleOpen = () => {
    if (locked) return
    if (surfaceTimeRange) {
      populateDraftFromRange(surfaceTimeRange[0], surfaceTimeRange[1])
      setEndTimeOn(true)
      setFocusPhase('start')
    } else {
      populateDraftFromInstant(resolvedValue ?? resolveEmptyBase())
      setEndTimeOn(endTimeAlwaysOn)
      setFocusPhase(endTimeAlwaysOn ? 'start' : 'single')
    }
    setOpen(true)
  }

  const handleApply = () => {
    const base = resolvedValue ?? dayjs()
    const sh = parseNum(sHour, 0)
    const sm = parseNum(sMin, 0)
    const start = buildTimeFrom24Hour(base, sh, sm)

    if (!isEndTimeOn) {
      setSurfaceTimeRange(null)
      onChange?.(start)
      setOpen(false)
      return
    }

    const eh = parseNum(eHour, 0)
    const em = parseNum(eMin, 0)
    let end = buildTimeFrom24Hour(base, eh, em)
    if (!end.isAfter(start)) {
      end = start.add(1, 'hour')
    }
    setSurfaceTimeRange([start, end])
    onTimeRangeChange?.([start, end])
    onChange?.(start)
    setOpen(false)
  }

  const handleEndTimeToggleOn = () => {
    populateDraftFromInstant(resolvedValue ?? resolveEmptyBase())
  }

  return (
    <>
      <span
        ref={rootRef}
        className={cn(
          'cms-datepicker',
          `cms-datepicker--${inputSize}`,
          `cms-control--${inputSize}`,
          'cms-field__box',
          hasExplicitWidth && 'cms-datepicker--explicit-width',
          disabled && 'cms-datepicker--disabled',
          disabled && 'cms-field__box--disabled',
          readOnly && !disabled && 'cms-datepicker--readonly',
          className
        )}
        style={{ ...widthStyle, ...style }}
      >
        <button
          ref={triggerRef}
          type="button"
          className={cn(
            'paragraph-time-picker__trigger',
            readOnly && !disabled && 'paragraph-time-picker__trigger--readonly'
          )}
          disabled={disabled}
          aria-disabled={locked}
          aria-readonly={readOnly && !disabled ? true : undefined}
          tabIndex={locked ? -1 : 0}
          onClick={handleOpen}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={
            surfaceTimeRange
              ? `${surfaceTimeRange[0].format('HH:mm')}부터 ${surfaceTimeRange[1].format('HH:mm')}까지`
              : undefined
          }
        >
          <FieldClockIcon className="paragraph-time-picker__trigger-icon cms-datepicker__calendar-icon" />
          <span
            className={cn(
              'paragraph-time-picker__trigger-text',
              triggerIsPlaceholder && 'paragraph-time-picker__trigger-text--placeholder'
            )}
          >
            {triggerIsPlaceholder ? placeholder : triggerDisplay}
          </span>
        </button>
      </span>
      <ParagraphTimePickerPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        dismissExcludeRef={rootRef}
        panelId={panelId}
        zIndex={zIndex}
        showEndTimeToggle={showEndTimeToggle}
        disabled={disabled}
        isEndTimeOn={isEndTimeOn}
        endTimeAlwaysOn={endTimeAlwaysOn}
        focusPhase={focusPhase}
        onFocusPhaseChange={setFocusPhase}
        sHour={sHour}
        sMin={sMin}
        onSHourChange={setSHour}
        onSMinChange={setSMin}
        eHour={eHour}
        eMin={eMin}
        onEHourChange={setEHour}
        onEMinChange={setEMin}
        onEndTimeOnChange={setEndTimeOn}
        onEndTimeToggleOn={handleEndTimeToggleOn}
        onApply={handleApply}
        inputSize={inputSize}
        minuteStep={minuteStep}
        emphasizeActiveMinute={emphasizeActiveMinute}
      />
    </>
  )
}
