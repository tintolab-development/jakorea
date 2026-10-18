import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import clockGrayUrl from '@/shared/assets/icons/clock-gray.svg'
import chevronDownBlackUrl from '@/shared/assets/icons/chevron-down-black.svg'
import chevronDownGrayUrl from '@/shared/assets/icons/chevron-down-gray.svg'
import type { PFSelectSize, PFSelectVariant } from '../pf-select/pf-select'
import selectStyles from '../pf-select/pf-select.module.css'
import styles from './pf-time-input.module.css'

const POPOVER_GAP_PX = 8
const POPOVER_Z_INDEX = 1100

function toWidthStyle(width: number | string | undefined): CSSProperties | undefined {
  if (width == null) return undefined
  return { width: typeof width === 'number' ? `${width}px` : width }
}

const sizeTypographyClassMap: Record<PFSelectSize, string> = {
  medium: 'typo-bd-sm-md',
  large: 'typo-bd-md-md',
  xlarge: 'typo-bd-md-md',
  mobile: 'typo-bd-md-md',
}

export type PFTimeInputProps = {
  size?: PFSelectSize
  variant?: PFSelectVariant
  width?: number | string
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  error?: boolean
  className?: string
  style?: CSSProperties
  id?: string
  'aria-label'?: string
  hourMin?: number
  hourMax?: number
  minuteStep?: number
}

type TimePartOption = { value: string; label: string }

function buildHourOptions(hourMin: number, hourMax: number): TimePartOption[] {
  const min = Math.min(hourMin, hourMax)
  const max = Math.max(hourMin, hourMax)
  const options: TimePartOption[] = []
  for (let hour = min; hour <= max; hour += 1) {
    options.push({
      value: String(hour),
      label: String(hour).padStart(2, '0'),
    })
  }
  return options
}

function buildMinuteOptions(minuteStep: number): TimePartOption[] {
  const step = Math.max(1, Math.floor(minuteStep))
  const options: TimePartOption[] = []
  for (let minute = 0; minute < 60; minute += step) {
    options.push({
      value: String(minute),
      label: String(minute).padStart(2, '0'),
    })
  }
  return options
}

function parseHHmm(raw: string): { hour: number; minute: number } | null {
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

function formatHHmm(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function snapMinuteToStep(minute: number, step: number): number {
  const snapped = Math.round(minute / step) * step
  return Math.min(59, Math.max(0, snapped))
}

function computePopoverStyle(field: HTMLElement): CSSProperties {
  const rect = field.getBoundingClientRect()
  return {
    position: 'fixed',
    top: rect.bottom + POPOVER_GAP_PX,
    left: rect.left,
    minWidth: Math.max(rect.width, 168),
    zIndex: POPOVER_Z_INDEX,
  }
}

type TimeScrollColumnProps = {
  ariaLabel: string
  options: TimePartOption[]
  /** 폼에 반영된 값 — 스크롤만 할 때는 바뀌지 않음 */
  selectedValue: string
  onCommit: (next: string) => void
  disabled?: boolean
}

const COLUMN_ITEM_HEIGHT_PX = 40
const COLUMN_EDGE_PAD_PX = 60

function maxScrollTop(list: HTMLDivElement): number {
  return Math.max(0, list.scrollHeight - list.clientHeight)
}

function scrollTopForIndex(index: number): number {
  return index * COLUMN_ITEM_HEIGHT_PX
}

function indexFromList(list: HTMLDivElement, optionCount: number): number {
  const clampedTop = Math.min(maxScrollTop(list), Math.max(0, list.scrollTop))
  const centerY = clampedTop + list.clientHeight / 2
  const rawIndex = Math.round(
    (centerY - COLUMN_EDGE_PAD_PX - COLUMN_ITEM_HEIGHT_PX / 2) / COLUMN_ITEM_HEIGHT_PX
  )
  return Math.min(optionCount - 1, Math.max(0, rawIndex))
}

function TimeScrollColumn({
  ariaLabel,
  options,
  selectedValue,
  onCommit,
  disabled,
}: TimeScrollColumnProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollRafRef = useRef<number | null>(null)
  const isScrollingRef = useRef(false)
  const suppressScrollSyncRef = useRef(false)
  const visualValueRef = useRef(selectedValue)
  const syncedSelectedRef = useRef<string | null>(null)

  const scrollToIndex = (index: number, behavior: ScrollBehavior = 'auto') => {
    const list = listRef.current
    if (!list) return
    const top = scrollTopForIndex(index)
    list.scrollTo({ top: Math.min(maxScrollTop(list), top), behavior })
  }

  const scrollToValue = (nextValue: string, behavior: ScrollBehavior = 'auto') => {
    const index = options.findIndex(option => option.value === nextValue)
    if (index < 0) return
    scrollToIndex(index, behavior)
  }

  const applyActiveVisual = (activeValue: string) => {
    if (visualValueRef.current === activeValue) return
    visualValueRef.current = activeValue
    options.forEach((option, index) => {
      const el = itemRefs.current[index]
      if (!el) return
      const isActive = option.value === activeValue
      el.classList.toggle(styles.columnItemActive, isActive)
      el.classList.toggle(styles.columnItem, !isActive)
      el.setAttribute('aria-selected', isActive ? 'true' : 'false')
    })
  }

  const readCenteredValue = (): string | null => {
    const list = listRef.current
    if (!list || options.length === 0) return null
    const index = indexFromList(list, options.length)
    return options[index]?.value ?? null
  }

  const syncScrollToSelected = useCallback(
    (nextValue: string) => {
      visualValueRef.current = nextValue
      suppressScrollSyncRef.current = true
      scrollToValue(nextValue, 'auto')
      suppressScrollSyncRef.current = false
      options.forEach((option, index) => {
        const el = itemRefs.current[index]
        if (!el) return
        const isActive = option.value === nextValue
        el.classList.toggle(styles.columnItemActive, isActive)
        el.classList.toggle(styles.columnItem, !isActive)
        el.setAttribute('aria-selected', isActive ? 'true' : 'false')
      })
    },
    [options]
  )

  const selectOption = useCallback(
    (nextValue: string) => {
      if (disabled) return
      isScrollingRef.current = false
      syncedSelectedRef.current = nextValue
      syncScrollToSelected(nextValue)
      if (nextValue !== selectedValue) {
        onCommit(nextValue)
      }
    },
    [disabled, onCommit, selectedValue, syncScrollToSelected]
  )

  useLayoutEffect(() => {
    if (isScrollingRef.current) return
    if (syncedSelectedRef.current === selectedValue) return
    syncedSelectedRef.current = selectedValue
    syncScrollToSelected(selectedValue)
  }, [selectedValue, syncScrollToSelected])

  const handleScroll = () => {
    if (suppressScrollSyncRef.current) return
    isScrollingRef.current = true

    if (scrollRafRef.current != null) {
      cancelAnimationFrame(scrollRafRef.current)
    }
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null
      const next = readCenteredValue()
      if (next != null) applyActiveVisual(next)
    })
  }

  const handleScrollEnd = () => {
    isScrollingRef.current = false
  }

  useEffect(
    () => () => {
      if (scrollRafRef.current != null) cancelAnimationFrame(scrollRafRef.current)
    },
    []
  )

  return (
    <div className={styles.column}>
      <div className={styles.columnViewport}>
        <div
          ref={listRef}
          className={styles.columnList}
          role="listbox"
          aria-label={ariaLabel}
          tabIndex={disabled ? -1 : 0}
          onScroll={handleScroll}
          onScrollEnd={handleScrollEnd}
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              ref={el => {
                itemRefs.current[index] = el
              }}
              role="option"
              aria-selected={option.value === selectedValue}
              className={
                option.value === selectedValue ? styles.columnItemActive : styles.columnItem
              }
              onPointerDown={event => {
                event.stopPropagation()
              }}
              onPointerUp={event => {
                event.stopPropagation()
                if (event.pointerType === 'mouse' && event.button !== 0) return
                selectOption(option.value)
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
        <div className={styles.columnFadeTop} aria-hidden />
        <div className={styles.columnFadeBottom} aria-hidden />
      </div>
    </div>
  )
}

/** CMS `ParagraphTimePicker` 대응 — 팝오버에서 시·분 각각 스크롤(드래그) 선택 */
export function PFTimeInput({
  size = 'large',
  variant = 'formPage',
  width = 140,
  placeholder = '시간 선택',
  value = '',
  onValueChange,
  disabled = false,
  error = false,
  className,
  style,
  id,
  'aria-label': ariaLabel,
  hourMin = 0,
  hourMax = 23,
  minuteStep = 1,
}: PFTimeInputProps) {
  const generatedId = useId()
  const popoverId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const suppressOutsideCloseRef = useRef(false)
  const draftRef = useRef({ hour: String(hourMin), minute: '0' })
  const inputId = id ?? generatedId

  const hourOptions = useMemo(
    () => buildHourOptions(hourMin, hourMax),
    [hourMin, hourMax]
  )

  const parsed = parseHHmm(value)
  const hasValue = parsed != null
  const displayValue = hasValue ? formatHHmm(parsed.hour, parsed.minute) : ''

  const [isOpen, setIsOpen] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties | null>(null)
  const [draftHour, setDraftHour] = useState(String(hourMin))
  const [draftMinute, setDraftMinute] = useState('0')

  draftRef.current = { hour: draftHour, minute: draftMinute }

  const minuteOptions = useMemo(() => buildMinuteOptions(minuteStep), [minuteStep])

  const isFormPage = variant === 'formPage'
  const rootStyle = { ...toWidthStyle(width), ...style }
  const rootClassName = ['pf-time-input', styles.root, className].filter(Boolean).join(' ')

  const fieldClassName = [
    'pf-time-input__field',
    selectStyles.field,
    selectStyles[size],
    isFormPage ? selectStyles.formPage : undefined,
    error ? selectStyles.error : undefined,
    disabled ? selectStyles.disabled : undefined,
    isOpen ? selectStyles.open : undefined,
    hasValue ? selectStyles.completed : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  const valueClassName = [
    'pf-time-input__value',
    selectStyles.value,
    isFormPage ? selectStyles.formPageValue : sizeTypographyClassMap[size],
    isFormPage
      ? disabled
        ? selectStyles.formPageValueDisabled
        : hasValue
          ? selectStyles.formPageValueFilled
          : selectStyles.formPageValuePlaceholder
      : hasValue
        ? selectStyles.valueFilled
        : selectStyles.valuePlaceholder,
  ].join(' ')

  const commitDraft = useCallback(
    (hour: string, minute: string) => {
      const h = Number(hour)
      const m = Number(minute)
      if (!Number.isFinite(h) || !Number.isFinite(m)) return
      onValueChange?.(formatHHmm(h, m))
    },
    [onValueChange]
  )

  const openPopover = () => {
    if (disabled) return
    const parsedOpen = parseHHmm(value)
    const hour = parsedOpen?.hour ?? hourMin
    const clampedHour = Math.min(hourMax, Math.max(hourMin, hour))
    const minute = parsedOpen != null ? snapMinuteToStep(parsedOpen.minute, minuteStep) : 0
    const hourStr = String(clampedHour)
    const minuteStr = String(minute)
    setDraftHour(hourStr)
    setDraftMinute(minuteStr)
    draftRef.current = { hour: hourStr, minute: minuteStr }
    const field = fieldRef.current
    if (field) {
      setPopoverStyle(computePopoverStyle(field))
    }
    setIsOpen(true)
  }

  const closePopover = useCallback(() => {
    setIsOpen(false)
    setPopoverStyle(null)
  }, [])

  useLayoutEffect(() => {
    if (!isOpen) return
    const field = fieldRef.current
    if (!field) return
    setPopoverStyle(computePopoverStyle(field))
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleResize = () => {
      const field = fieldRef.current
      if (!field) return
      setPopoverStyle(computePopoverStyle(field))
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (suppressOutsideCloseRef.current) return
      const target = event.target as Node | null
      if (!target) return
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      closePopover()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePopover()
        triggerRef.current?.focus()
      }
    }

    window.addEventListener('resize', handleResize)
    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, closePopover])

  const handleHourCommit = useCallback(
    (next: string) => {
      setDraftHour(next)
      const minute = draftRef.current.minute
      draftRef.current = { hour: next, minute }
      commitDraft(next, minute)
    },
    [commitDraft]
  )

  const handleMinuteCommit = useCallback(
    (next: string) => {
      setDraftMinute(next)
      draftRef.current = { ...draftRef.current, minute: next }
      commitDraft(draftRef.current.hour, next)
    },
    [commitDraft]
  )

  const handleTriggerPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (event.button !== 0) return
    event.preventDefault()
    suppressOutsideCloseRef.current = true
    if (isOpen) closePopover()
    else openPopover()
    window.requestAnimationFrame(() => {
      suppressOutsideCloseRef.current = false
    })
  }

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault()
      if (isOpen) closePopover()
      else openPopover()
    }
  }

  const popover =
    isOpen && popoverStyle
      ? createPortal(
          <div
            ref={popoverRef}
            id={popoverId}
            className={styles.popover}
            style={popoverStyle}
            role="dialog"
            aria-label={ariaLabel ?? placeholder}
          >
            <TimeScrollColumn
              ariaLabel="시"
              options={hourOptions}
              selectedValue={draftHour}
              disabled={disabled}
              onCommit={handleHourCommit}
            />
            <TimeScrollColumn
              ariaLabel="분"
              options={minuteOptions}
              selectedValue={draftMinute}
              disabled={disabled}
              onCommit={handleMinuteCommit}
            />
          </div>,
          document.body
        )
      : null

  return (
    <div className={rootClassName} ref={rootRef} style={rootStyle}>
      <img className={styles.leadingIcon} src={clockGrayUrl} alt="" aria-hidden="true" />
      <div className={selectStyles.control}>
        <div className={fieldClassName} ref={fieldRef}>
          <button
            ref={triggerRef}
            id={inputId}
            type="button"
            className={['pf-time-input__trigger', styles.trigger].join(' ')}
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-controls={isOpen ? popoverId : undefined}
            aria-label={ariaLabel ?? placeholder}
            onPointerDown={handleTriggerPointerDown}
            onKeyDown={handleTriggerKeyDown}
          >
            <span className={valueClassName}>{hasValue ? displayValue : placeholder}</span>
          </button>
          <span className={selectStyles.trailing}>
            <span className={selectStyles.chevronButton} aria-hidden="true">
              <img
                className={selectStyles.chevron}
                src={hasValue ? chevronDownBlackUrl : chevronDownGrayUrl}
                alt=""
              />
            </span>
          </span>
        </div>
      </div>
      {popover}
    </div>
  )
}
