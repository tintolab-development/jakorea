import type { CSSProperties } from 'react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ClockCircleOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  ParagraphTimePickerPopover,
  buildTime,
  from24h,
  parseNum,
} from '@/shared/components/date-time-picker-modal'
import '@/shared/ui/cms-datepicker.css'
import './paragraph-time-picker.css'

export {
  ParagraphTimeInlineSelects,
  buildTime,
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
  className?: string
  style?: CSSProperties
  width?: number | string
  endTimeAlwaysOn?: boolean
  zIndex?: number
  showEndTimeToggle?: boolean
}

type FocusPhase = 'single' | 'start' | 'end'

export function ParagraphTimePicker({
  value = null,
  onChange,
  onTimeRangeChange,
  placeholder = '시간 선택',
  disabled,
  className,
  style,
  width,
  endTimeAlwaysOn = false,
  zIndex,
  showEndTimeToggle = true,
}: ParagraphTimePickerProps) {
  const rootRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const [open, setOpen] = useState(false)
  const [endTimeOn, setEndTimeOn] = useState(endTimeAlwaysOn)
  const [focusPhase, setFocusPhase] = useState<FocusPhase>('single')

  const [sHour, setSHour] = useState('12')
  const [sMin, setSMin] = useState('0')
  const [sMer, setSMer] = useState<'AM' | 'PM'>('AM')

  const [eHour, setEHour] = useState('1')
  const [eMin, setEMin] = useState('0')
  const [eMer, setEMer] = useState<'AM' | 'PM'>('PM')

  const [surfaceTimeRange, setSurfaceTimeRange] = useState<[Dayjs, Dayjs] | null>(null)
  const isEndTimeOn = endTimeAlwaysOn || endTimeOn

  const hasExplicitWidth = width != null
  const widthStyle: CSSProperties | undefined =
    width != null ? { width: typeof width === 'number' ? `${width}px` : width } : undefined

  const triggerDisplay =
    surfaceTimeRange != null
      ? `${surfaceTimeRange[0].format('HH:mm')} ~ ${surfaceTimeRange[1].format('HH:mm')}`
      : value != null
        ? value.format('HH:mm')
        : null
  const triggerIsPlaceholder = triggerDisplay == null

  useEffect(() => {
    if (endTimeAlwaysOn) setEndTimeOn(true)
  }, [endTimeAlwaysOn])

  useEffect(() => {
    if (value == null) {
      setSurfaceTimeRange(null)
      return
    }
    setSurfaceTimeRange(prev => {
      if (prev == null) return prev
      return value.isSame(prev[0], 'minute') ? prev : null
    })
  }, [value])

  const populateDraftFromInstant = useCallback((d: Dayjs) => {
    const { h12, mer } = from24h(d.hour())
    setSHour(String(h12))
    setSMin(String(d.minute()))
    setSMer(mer)
    const dEnd = d.add(1, 'hour')
    const endParts = from24h(dEnd.hour())
    setEHour(String(endParts.h12))
    setEMin(String(dEnd.minute()))
    setEMer(endParts.mer)
  }, [])

  const populateDraftFromRange = useCallback((start: Dayjs, end: Dayjs) => {
    const sh = from24h(start.hour())
    setSHour(String(sh.h12))
    setSMin(String(start.minute()))
    setSMer(sh.mer)
    const eh = from24h(end.hour())
    setEHour(String(eh.h12))
    setEMin(String(end.minute()))
    setEMer(eh.mer)
  }, [])

  const handleOpen = () => {
    if (disabled) return
    if (surfaceTimeRange) {
      populateDraftFromRange(surfaceTimeRange[0], surfaceTimeRange[1])
      setEndTimeOn(true)
      setFocusPhase('start')
    } else {
      populateDraftFromInstant(value ?? dayjs())
      setEndTimeOn(endTimeAlwaysOn)
      setFocusPhase(endTimeAlwaysOn ? 'start' : 'single')
    }
    setOpen(true)
  }

  const handleApply = () => {
    const base = value ?? dayjs()
    const sh = parseNum(sHour, 12)
    const sm = parseNum(sMin, 0)
    const start = buildTime(base, sh, sm, sMer)

    if (!isEndTimeOn) {
      setSurfaceTimeRange(null)
      onChange?.(start)
      setOpen(false)
      return
    }

    const eh = parseNum(eHour, 12)
    const em = parseNum(eMin, 0)
    let end = buildTime(base, eh, em, eMer)
    if (!end.isAfter(start)) {
      end = start.add(1, 'hour')
    }
    setSurfaceTimeRange([start, end])
    onTimeRangeChange?.([start, end])
    onChange?.(start)
    setOpen(false)
  }

  const handleEndTimeToggleOn = () => {
    const base = value ?? dayjs()
    const { h12, mer } = from24h(base.hour())
    setSHour(String(h12))
    setSMin(String(base.minute()))
    setSMer(mer)
    const dEnd = base.add(1, 'hour')
    const ep = from24h(dEnd.hour())
    setEHour(String(ep.h12))
    setEMin(String(dEnd.minute()))
    setEMer(ep.mer)
  }

  return (
    <>
      <span
        ref={rootRef}
        className={cn(
          'cms-datepicker',
          'cms-datepicker--medium',
          hasExplicitWidth && 'cms-datepicker--explicit-width',
          disabled && 'cms-datepicker--disabled',
          className
        )}
        style={{ ...widthStyle, ...style }}
      >
        <button
          ref={triggerRef}
          type="button"
          className="paragraph-time-picker__trigger"
          disabled={disabled}
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
          <ClockCircleOutlined
            className="paragraph-time-picker__trigger-icon cms-datepicker__calendar-icon"
            aria-hidden
          />
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
        sMer={sMer}
        onSHourChange={setSHour}
        onSMinChange={setSMin}
        onSMerChange={setSMer}
        eHour={eHour}
        eMin={eMin}
        eMer={eMer}
        onEHourChange={setEHour}
        onEMinChange={setEMin}
        onEMerChange={setEMer}
        onEndTimeOnChange={setEndTimeOn}
        onEndTimeToggleOn={handleEndTimeToggleOn}
        onApply={handleApply}
      />
    </>
  )
}
