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
import {
  addMonths,
  formatYearMonth,
  getMonthGridDays,
  isSameDay,
  startOfDay,
  type CalendarDay,
} from '../pf-calendar/calendar-month'
import { PFPageButton } from '../pf-page-button'
import { PFText } from '../pf-text'
import cancelIconUrl from '../pf-text-input/icons/cancel.svg'
import styles from './pf-date-input.module.css'

export type PFDateInputSize = 'medium' | 'large' | 'xlarge'
export type PFDateInputVariant = 'default' | 'formPage'
export type PFDateInputMessageStatus = 'neutral' | 'success' | 'error'

export type PFDateInputProps = {
  size?: PFDateInputSize
  /** Platform 양식 페이지(PFFormPage) 내부 전용 스타일 */
  variant?: PFDateInputVariant
  /** 지정 시 루트 width (숫자는 px) */
  width?: number | string
  label?: string
  placeholder?: string
  /** `YYYY-MM-DD` */
  value?: string
  /** `YYYY-MM-DD` */
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

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const
const POPOVER_GAP_PX = 8

const sizeTypographyClassMap: Record<PFDateInputSize, string> = {
  medium: 'typo-bd-sm-md',
  large: 'typo-bd-md-md',
  xlarge: 'typo-bd-md-md',
}

function toWidthStyle(width: number | string | undefined): CSSProperties | undefined {
  if (width == null) return undefined
  return { width: typeof width === 'number' ? `${width}px` : width }
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return startOfDay(date)
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplayDate(value: string): string {
  const date = parseIsoDate(value)
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}. ${month}. ${day}`
}

function chunkWeeks(days: CalendarDay[]): CalendarDay[][] {
  const weeks: CalendarDay[][] = []
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7))
  }
  return weeks
}

export function PFDateInput({
  size = 'medium',
  variant = 'default',
  width,
  label,
  placeholder = '날짜를 선택해 주세요',
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
  const [viewMonth, setViewMonth] = useState(() => {
    const initial = parseIsoDate(value ?? defaultValue)
    return initial ? new Date(initial.getFullYear(), initial.getMonth(), 1) : new Date()
  })

  const currentValue = isControlled ? value : internalValue
  const selectedDate = currentValue ? parseIsoDate(currentValue) : null
  const hasValue = selectedDate != null
  const displayValue = hasValue ? formatDisplayDate(currentValue) : ''
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

  const weeks = chunkWeeks(getMonthGridDays(viewMonth))

  const setValue = (next: string) => {
    if (!isControlled) {
      setInternalValue(next)
    }
    onValueChange?.(next)
  }

  const openPopover = () => {
    if (disabled) return
    const nextView = selectedDate
      ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    setViewMonth(nextView)
    setIsOpen(true)
  }

  const closePopover = () => {
    setIsOpen(false)
  }

  useLayoutEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      const field = fieldRef.current
      const popover = popoverRef.current
      if (!field) return

      const rect = field.getBoundingClientRect()
      const popoverHeight = popover?.offsetHeight ?? 320
      const popoverWidth = popover?.offsetWidth ?? 384
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      const spaceBelow = viewportHeight - rect.bottom - POPOVER_GAP_PX
      const spaceAbove = rect.top - POPOVER_GAP_PX
      const openUpward = spaceBelow < popoverHeight && spaceAbove > spaceBelow

      let left = rect.left
      if (left + popoverWidth > viewportWidth - 8) {
        left = Math.max(8, viewportWidth - popoverWidth - 8)
      }

      setPopoverStyle({
        position: 'fixed',
        top: openUpward ? undefined : rect.bottom + POPOVER_GAP_PX,
        bottom: openUpward ? viewportHeight - rect.top + POPOVER_GAP_PX : undefined,
        left,
        zIndex: 1100,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, viewMonth])

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

  const handleSelectDay = (day: CalendarDay) => {
    setValue(toIsoDate(day.date))
    setViewMonth(new Date(day.date.getFullYear(), day.date.getMonth(), 1))
    closePopover()
    triggerRef.current?.focus()
  }

  const handleClear = () => {
    setValue('')
    closePopover()
  }

  const popover =
    isOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={popoverRef}
            id={popoverId}
            className={styles.popover}
            style={popoverStyle}
            role="dialog"
            aria-label="날짜 선택"
          >
            <div className={styles.header}>
              <PFPageButton
                size="large"
                direction="left"
                aria-label="이전 달"
                onClick={() => setViewMonth(prev => addMonths(prev, -1))}
              />
              <p className={styles.yearMonth}>{formatYearMonth(viewMonth)}</p>
              <PFPageButton
                size="large"
                direction="right"
                aria-label="다음 달"
                onClick={() => setViewMonth(prev => addMonths(prev, 1))}
              />
            </div>

            <div className={styles.body}>
              <div className={styles.weekdayRow} aria-hidden="true">
                {WEEKDAYS.map(weekday => (
                  <span key={weekday} className={styles.weekday}>
                    {weekday}
                  </span>
                ))}
              </div>

              <div className={styles.weeks}>
                {weeks.map(week => {
                  const weekKey = toIsoDate(week[0].date)
                  return (
                    <div className={styles.week} key={weekKey}>
                      {week.map(day => {
                        const selected = selectedDate != null && isSameDay(day.date, selectedDate)
                        const isSunday = day.weekday === 0
                        const isSaturday = day.weekday === 6
                        const dayClassName = [
                          styles.day,
                          !day.isCurrentMonth ? styles.dayOutside : undefined,
                          day.isCurrentMonth && isSunday ? styles.daySunday : undefined,
                          day.isCurrentMonth && isSaturday ? styles.daySaturday : undefined,
                          selected ? styles.daySelected : undefined,
                        ]
                          .filter(Boolean)
                          .join(' ')

                        return (
                          <button
                            key={toIsoDate(day.date)}
                            type="button"
                            className={dayClassName}
                            aria-label={`${day.date.getFullYear()}년 ${day.date.getMonth() + 1}월 ${day.day}일`}
                            aria-pressed={selected}
                            onClick={() => handleSelectDay(day)}
                          >
                            {day.day}
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

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
          aria-label={ariaLabel ?? label ?? '날짜'}
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
          {hasValue ? displayValue : placeholder}
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
