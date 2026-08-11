import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import calendarBlackUrl from '@/shared/assets/icons/calendar-black.svg'
import calendarGrayUrl from '@/shared/assets/icons/calendar-gray.svg'
import { PFText } from '../pf-text'
import cancelIconUrl from '../pf-text-input/icons/cancel.svg'
import {
  formatDisplayDate,
  formatDisplayYear,
  formatDisplayYearMonth,
  isIsoDateWithinInputBounds,
  isYearMonthWithinInputBounds,
  isYearWithinInputBounds,
  parseIsoDate,
  parseYear,
  parseYearMonth,
} from './date-utils'
import { PFDatePickerCalendar } from './pf-date-picker-calendar'
import { PFDatePickerMonthPanel } from './pf-date-picker-month-panel'
import { PFDatePickerYearPanel } from './pf-date-picker-year-panel'
import styles from './pf-date-input.module.css'

export type PFDateInputSize = 'medium' | 'large' | 'xlarge'
export type PFDateInputVariant = 'default' | 'formPage'
export type PFDateInputMessageStatus = 'neutral' | 'success' | 'error'
/** date=`YYYY-MM-DD` · month=`YYYY-MM` · year=`YYYY` */
export type PFDateInputPicker = 'date' | 'month' | 'year'

export type PFDateInputProps = {
  size?: PFDateInputSize
  /** Platform 양식 페이지(PFFormPage) 내부 전용 스타일 */
  variant?: PFDateInputVariant
  /** 지정 시 루트 width (숫자는 px) */
  width?: number | string
  /**
   * 선택 단위.
   * - `date`: `YYYY-MM-DD`
   * - `month`: `YYYY-MM`
   * - `year`: `YYYY`
   */
  picker?: PFDateInputPicker
  label?: string
  placeholder?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  required?: boolean
  disabled?: boolean
  error?: boolean
  message?: string
  messageStatus?: PFDateInputMessageStatus
  className?: string
  style?: CSSProperties
  id?: string
  'aria-label'?: string
}

const POPOVER_GAP_PX = 8
const POPOVER_FALLBACK_SIZE: Record<
  PFDateInputPicker,
  { width: number; height: number }
> = {
  date: { width: 384, height: 320 },
  month: { width: 280, height: 280 },
  year: { width: 280, height: 280 },
}

const sizeTypographyClassMap: Record<PFDateInputSize, string> = {
  medium: 'typo-bd-sm-md',
  large: 'typo-bd-md-md',
  xlarge: 'typo-bd-md-md',
}

const DEFAULT_PLACEHOLDER: Record<PFDateInputPicker, string> = {
  date: '날짜를 선택해 주세요',
  month: '연월을 선택해 주세요',
  year: '연도를 선택해 주세요',
}

function getPopoverPositionStyle(
  trigger: DOMRect,
  popoverWidth: number,
  popoverHeight: number
): CSSProperties {
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth
  const spaceBelow = viewportHeight - trigger.bottom - POPOVER_GAP_PX
  const spaceAbove = trigger.top - POPOVER_GAP_PX
  const openUpward = spaceBelow < popoverHeight && spaceAbove > spaceBelow

  let left = trigger.left
  if (left + popoverWidth > viewportWidth - 8) {
    // 트리거 오른쪽 정렬을 우선 — 뷰포트 왼쪽으로 점프하지 않음
    left = Math.max(8, trigger.right - popoverWidth)
  }
  if (left + popoverWidth > viewportWidth - 8) {
    left = Math.max(8, viewportWidth - popoverWidth - 8)
  }

  return {
    position: 'fixed',
    top: openUpward ? undefined : trigger.bottom + POPOVER_GAP_PX,
    bottom: openUpward ? viewportHeight - trigger.top + POPOVER_GAP_PX : undefined,
    left,
    width: 'max-content',
    zIndex: 1100,
  }
}

function measurePopoverSize(
  popover: HTMLElement | null,
  picker: PFDateInputPicker
): { width: number; height: number } {
  const fallback = POPOVER_FALLBACK_SIZE[picker]
  if (!popover) return fallback

  // wrapper가 position 적용 전 block으로 펼쳐지면 offsetWidth가 뷰포트만큼 커짐 → 콘텐츠 기준 측정
  const content = popover.firstElementChild as HTMLElement | null
  const width = content?.offsetWidth || popover.offsetWidth
  const height = content?.offsetHeight || popover.offsetHeight
  if (!width || width >= window.innerWidth - 16) {
    return { width: fallback.width, height: height || fallback.height }
  }
  return {
    width,
    height: height || fallback.height,
  }
}

function toWidthStyle(width: number | string | undefined): CSSProperties | undefined {
  if (width == null) return undefined
  return { width: typeof width === 'number' ? `${width}px` : width }
}

function hasValidValue(value: string, picker: PFDateInputPicker): boolean {
  if (!value) return false
  if (picker === 'year') {
    const year = parseYear(value)
    return year != null && isYearWithinInputBounds(year)
  }
  if (picker === 'month') {
    const parsed = parseYearMonth(value)
    return parsed != null && isYearMonthWithinInputBounds(parsed.year, parsed.month)
  }
  return parseIsoDate(value) != null && isIsoDateWithinInputBounds(value)
}

function formatTriggerDisplay(value: string, picker: PFDateInputPicker): string {
  if (picker === 'year') return formatDisplayYear(value)
  if (picker === 'month') return formatDisplayYearMonth(value)
  return formatDisplayDate(value)
}

export function PFDateInput({
  size = 'medium',
  variant = 'default',
  width,
  picker = 'date',
  label,
  placeholder,
  value,
  defaultValue = '',
  onValueChange,
  required = false,
  disabled = false,
  error = false,
  message,
  messageStatus = 'neutral',
  className,
  style,
  id,
  'aria-label': ariaLabel,
}: PFDateInputProps) {
  const generatedId = useId()
  const popoverId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const inputId = id ?? generatedId

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [isOpen, setIsOpen] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>()

  const currentValue = isControlled ? value : internalValue
  const hasValue = hasValidValue(currentValue, picker)
  const displayValue = hasValue ? formatTriggerDisplay(currentValue, picker) : ''
  const resolvedPlaceholder = placeholder ?? DEFAULT_PLACEHOLDER[picker]
  const isFormPage = variant === 'formPage'
  const rootStyle = { ...toWidthStyle(width), ...style }
  const shouldShowClearButton = !disabled && (hasValue || error)
  const calendarIconUrl = hasValue ? calendarBlackUrl : calendarGrayUrl

  const fieldClassName = [
    styles.field,
    styles[size],
    isFormPage ? styles.formPage : undefined,
    error ? styles.error : undefined,
    disabled ? styles.disabled : undefined,
    isOpen ? styles.open : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  const valueClassName = [
    styles.value,
    isFormPage ? styles.formPageValue : sizeTypographyClassMap[size],
    isFormPage
      ? disabled
        ? styles.formPageValueDisabled
        : hasValue
          ? styles.formPageValueFilled
          : styles.formPageValuePlaceholder
      : hasValue
        ? styles.valueFilled
        : styles.valuePlaceholder,
  ].join(' ')

  const messageStatusClassMap = {
    neutral: styles.messageNeutral,
    success: styles.messageSuccess,
    error: styles.messageError,
  } as const
  const messageClassName = [styles.message, messageStatusClassMap[messageStatus]].join(' ')

  const setValue = (next: string) => {
    if (!isControlled) {
      setInternalValue(next)
    }
    onValueChange?.(next)
  }

  const updatePopoverPosition = () => {
    const field = fieldRef.current
    if (!field) return
    const rect = field.getBoundingClientRect()
    const { width, height } = measurePopoverSize(popoverRef.current, picker)
    setPopoverStyle(getPopoverPositionStyle(rect, width, height))
  }

  const openPopover = () => {
    if (disabled) return
    const field = fieldRef.current
    if (field) {
      const fallback = POPOVER_FALLBACK_SIZE[picker]
      // 첫 paint부터 트리거 아래에 붙임 (미측정 시 left 클램프 오차 방지)
      setPopoverStyle(
        getPopoverPositionStyle(field.getBoundingClientRect(), fallback.width, fallback.height)
      )
    }
    setIsOpen(true)
  }

  const closePopover = () => {
    setIsOpen(false)
    setPopoverStyle(undefined)
  }

  useLayoutEffect(() => {
    if (!isOpen) return

    updatePopoverPosition()

    const popover = popoverRef.current
    const resizeObserver =
      popover && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => updatePopoverPosition())
        : null
    if (popover && resizeObserver) {
      resizeObserver.observe(popover)
    }

    window.addEventListener('resize', updatePopoverPosition)
    window.addEventListener('scroll', updatePopoverPosition, true)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updatePopoverPosition)
      window.removeEventListener('scroll', updatePopoverPosition, true)
    }
  }, [isOpen, picker])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return
      }
      closePopover()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePopover()
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
      event.preventDefault()
      if (isOpen) {
        closePopover()
      } else {
        openPopover()
      }
    }
  }

  const handleClear = () => {
    setValue('')
    closePopover()
  }

  const handleSelectValue = (next: string) => {
    setValue(next)
    closePopover()
    triggerRef.current?.focus()
  }

  const selectedDate = picker === 'date' && hasValue ? parseIsoDate(currentValue) : null
  const selectedYearMonth = picker === 'month' && hasValue ? parseYearMonth(currentValue) : null
  const selectedYear = picker === 'year' && hasValue ? parseYear(currentValue) : null

  const popoverContent =
    picker === 'year' ? (
      <PFDatePickerYearPanel
        id={popoverId}
        selectedYear={hasValue ? currentValue : null}
        initialViewYear={selectedYear ?? undefined}
        onSelectYear={handleSelectValue}
      />
    ) : picker === 'month' ? (
      <PFDatePickerMonthPanel
        id={popoverId}
        selectedMonth={hasValue ? currentValue : null}
        initialViewYear={selectedYearMonth?.year}
        onSelectMonth={handleSelectValue}
      />
    ) : (
      <PFDatePickerCalendar
        id={popoverId}
        selectionMode="single"
        selectedDate={hasValue ? currentValue : null}
        initialViewMonth={
          selectedDate
            ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
            : undefined
        }
        onSelectDate={handleSelectValue}
      />
    )

  const popover =
    isOpen && typeof document !== 'undefined'
      ? createPortal(
          <div ref={popoverRef} style={popoverStyle}>
            {popoverContent}
          </div>,
          document.body
        )
      : null

  const triggerAriaLabel =
    ariaLabel ??
    label ??
    (picker === 'year' ? '연도' : picker === 'month' ? '연월' : '날짜')

  return (
    <div
      ref={rootRef}
      className={[styles.root, className].filter(Boolean).join(' ')}
      style={rootStyle}
    >
      {label ? (
        <label className={styles.label} htmlFor={inputId}>
          <PFText as="span" typo="label-md" color="inherit" className={styles.labelText}>
            {label}
          </PFText>
          {required ? (
            <span className={styles.requiredMark} aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      <div className={fieldClassName} ref={fieldRef}>
        <img className={styles.icon} src={calendarIconUrl} alt="" aria-hidden="true" />
        <button
          ref={triggerRef}
          id={inputId}
          type="button"
          className={valueClassName}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={isOpen ? popoverId : undefined}
          aria-label={triggerAriaLabel}
          aria-required={required || undefined}
          onClick={() => {
            if (isOpen) {
              closePopover()
            } else {
              openPopover()
            }
          }}
          onKeyDown={handleTriggerKeyDown}
        >
          {hasValue ? displayValue : resolvedPlaceholder}
        </button>
        {shouldShowClearButton ? (
          <button
            className={styles.clearButton}
            type="button"
            aria-label="날짜 지우기"
            onClick={handleClear}
          >
            <img className={styles.clearIcon} src={cancelIconUrl} alt="" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {message ? <p className={messageClassName}>{message}</p> : null}
      {popover}
    </div>
  )
}
