import type { CSSProperties } from 'react'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ClockCircleOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsToggle } from '@/shared/ui/cms-toggle'
import '@/shared/ui/cms-datepicker.css'
import './paragraph-time-picker.css'

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const POPOVER_GAP = 6

/** 모달 내 시·분·AM/PM 셀렉트 — 트리거와 옵션 목록 동일 너비(정렬) */
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

function from24h(h24: number): { h12: number; mer: 'AM' | 'PM' } {
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

export { from24h }

export interface ParagraphTimeInlineSelectsProps {
  hour: string
  minute: string
  meridiem: 'AM' | 'PM'
  onHourChange: (v: string) => void
  onMinuteChange: (v: string) => void
  onMeridiemChange: (v: 'AM' | 'PM') => void
  getPopupContainer: () => HTMLElement
  disabled?: boolean
  /** 시(12h) 셀 — 민트 강조 */
  hourActive: boolean
  /** 시·분·AM/PM 전부 오류 스타일(범위 검증 실패 등) */
  invalid?: boolean
  rowPhase?: 'single' | 'start' | 'end'
}

/** 날짜 팝오버 등에 삽입 — `ParagraphTimePicker` 모달과 동일 셀렉트 행 */
export function ParagraphTimeInlineSelects({
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
}: ParagraphTimeInlineSelectsProps) {
  const selectCommon = {
    inputSize: 'large' as const,
    withAllOption: false,
    getPopupContainer,
    popupMatchSelectWidth: true,
    placement: 'bottomLeft' as const,
    popupClassName: 'paragraph-time-picker__select-dropdown',
  }

  const wrapHour = cn(
    'paragraph-time-picker__select-wrap',
    invalid && 'paragraph-time-picker__select-wrap--invalid',
    !invalid && hourActive && 'paragraph-time-picker__select-wrap--hour-active',
    !invalid && !hourActive && 'paragraph-time-picker__select-wrap--muted'
  )

  const wrapMuted = cn(
    'paragraph-time-picker__select-wrap',
    invalid && 'paragraph-time-picker__select-wrap--invalid',
    !invalid && 'paragraph-time-picker__select-wrap--muted'
  )

  const endMer = rowPhase === 'end'

  return (
    <div className="paragraph-time-picker__row">
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
      <span className="paragraph-time-picker__colon" aria-hidden>
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

export interface ParagraphTimePickerProps {
  value?: Dayjs | null
  onChange?: (next: Dayjs | null) => void
  /** 종료 시간 ON으로 [설정] 시 `[시작, 종료]`(같은 날짜 기준) — 선택 */
  onTimeRangeChange?: (range: [Dayjs, Dayjs]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  style?: CSSProperties
  width?: number | string
}

type FocusPhase = 'single' | 'start' | 'end'

/** 단락·폼 에디터 공용 시간 선택 — 인풋은 `cms-datepicker`와 동일, 클릭 시 설정 모달 */
export function ParagraphTimePicker({
  value = null,
  onChange,
  onTimeRangeChange,
  placeholder = '시간 선택',
  disabled,
  className,
  style,
  width,
}: ParagraphTimePickerProps) {
  const rootRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  const [open, setOpen] = useState(false)
  const [endTimeOn, setEndTimeOn] = useState(false)
  const [focusPhase, setFocusPhase] = useState<FocusPhase>('single')

  const [sHour, setSHour] = useState('12')
  const [sMin, setSMin] = useState('0')
  const [sMer, setSMer] = useState<'AM' | 'PM'>('AM')

  const [eHour, setEHour] = useState('1')
  const [eMin, setEMin] = useState('0')
  const [eMer, setEMer] = useState<'AM' | 'PM'>('PM')

  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({ visibility: 'hidden' })
  /** 종료 시간 ON 후 [설정] 확정 — 트리거에 시작~종료 표시 (`paragraph-date-picker` surfaceRange 와 동일 역할) */
  const [surfaceTimeRange, setSurfaceTimeRange] = useState<[Dayjs, Dayjs] | null>(null)

  const hasExplicitWidth = width != null
  const widthStyle: CSSProperties | undefined =
    width != null
      ? { width: typeof width === 'number' ? `${width}px` : width }
      : undefined

  /** 트리거 표시: 미입력 → placeholder / 시작만 → HH:mm / 범위 확정 → `HH:mm ~ HH:mm` */
  const triggerDisplay =
    surfaceTimeRange != null
      ? `${surfaceTimeRange[0].format('HH:mm')} ~ ${surfaceTimeRange[1].format('HH:mm')}`
      : value != null
        ? value.format('HH:mm')
        : null
  const triggerIsPlaceholder = triggerDisplay == null

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

  const updatePopoverPosition = useCallback(() => {
    const trigger = triggerRef.current
    const pop = popoverRef.current
    if (!trigger || !pop) return

    const rect = trigger.getBoundingClientRect()
    const popH = pop.offsetHeight || 280
    const popW = pop.offsetWidth || 360
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
  }, [open, endTimeOn, schedulePosition])

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
  }, [open])

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
      setEndTimeOn(false)
      setFocusPhase('single')
    }
    setOpen(true)
  }

  const handleApply = () => {
    const base = value ?? dayjs()
    const sh = parseNum(sHour, 12)
    const sm = parseNum(sMin, 0)
    const start = buildTime(base, sh, sm, sMer)

    if (!endTimeOn) {
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

  const renderTimeRow = (
    phase: 'single' | 'start' | 'end',
    h: string,
    m: string,
    mer: 'AM' | 'PM',
    setH: (v: string) => void,
    setM: (v: string) => void,
    setMe: (v: 'AM' | 'PM') => void
  ) => (
    <ParagraphTimeInlineSelects
      hour={h}
      minute={m}
      meridiem={mer}
      onHourChange={setH}
      onMinuteChange={setM}
      onMeridiemChange={setMe}
      getPopupContainer={() => popoverRef.current ?? document.body}
      disabled={disabled}
      hourActive={
        (!endTimeOn && phase === 'single') ||
        (endTimeOn && focusPhase === 'start' && phase === 'start') ||
        (endTimeOn && focusPhase === 'end' && phase === 'end')
      }
      rowPhase={phase}
    />
  )

  const popover = open
    ? createPortal(
        <>
          <div className="paragraph-time-picker__backdrop" aria-hidden />
          <div
            ref={popoverRef}
            id={panelId}
            className="paragraph-time-picker__popover"
            style={popoverStyle}
            role="dialog"
            aria-modal="true"
            aria-label="시간 설정"
          >
            {!endTimeOn ? (
              <div className="paragraph-time-picker__section">
                {renderTimeRow('single', sHour, sMin, sMer, setSHour, setSMin, setSMer)}
              </div>
            ) : (
              <>
                <div
                  className="paragraph-time-picker__section"
                  onMouseDown={() => setFocusPhase('start')}
                >
                  <span className="paragraph-time-picker__section-label">시작 시간</span>
                  {renderTimeRow('start', sHour, sMin, sMer, setSHour, setSMin, setSMer)}
                </div>
                <div
                  className="paragraph-time-picker__section"
                  onMouseDown={() => setFocusPhase('end')}
                >
                  <span className="paragraph-time-picker__section-label">종료 시간</span>
                  {renderTimeRow('end', eHour, eMin, eMer, setEHour, setEMin, setEMer)}
                </div>
              </>
            )}

            <div className="paragraph-time-picker__footer">
              <CmsToggle
                label="종료 시간"
                checked={endTimeOn}
                onChange={next => {
                  setEndTimeOn(next)
                  if (next) {
                    setFocusPhase('start')
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
                  } else {
                    setFocusPhase('single')
                  }
                }}
                disabled={disabled}
              />
              <CmsButton
                type="button"
                variant="primary"
                size="medium"
                width="80px"
                onClick={handleApply}
                disabled={disabled}
              >
                설정
              </CmsButton>
            </div>
          </div>
        </>,
        document.body
      )
    : null

  return (
    <>
      <span
        ref={rootRef}
        className={cn(
          'cms-datepicker',
          'cms-datepicker--large',
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
          <ClockCircleOutlined className="paragraph-time-picker__trigger-icon cms-datepicker__calendar-icon" aria-hidden />
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
      {popover}
    </>
  )
}
