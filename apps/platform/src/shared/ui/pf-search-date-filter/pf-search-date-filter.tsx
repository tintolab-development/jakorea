import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import chevronDownPrimaryUrl from '@/shared/assets/icons/chevron-down-primary.svg'
import {
  encodeDateRange,
  formatKoreanDateRange,
  parseDateRange,
  parseIsoDate,
} from '../pf-date-input/date-utils'
import { PFDatePickerCalendar } from '../pf-date-input/pf-date-picker-calendar'
import filterStyles from '../pf-search-filter/pf-search-filter.module.css'
import styles from './pf-search-date-filter.module.css'

export type PFSearchDateFilterProps = {
  label: string
  /** `all` | `YYYY-MM-DD~YYYY-MM-DD` (단일일은 `YYYY-MM-DD`도 허용) */
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  ariaLabel?: string
  emptyLabel?: string
}

const POPOVER_GAP_PX = 8
const POPOVER_FALLBACK_WIDTH_PX = 384
const POPOVER_FALLBACK_HEIGHT_PX = 320

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
    zIndex: 1100,
  }
}

export function PFSearchDateFilter({
  label,
  value,
  onChange,
  disabled = false,
  className,
  ariaLabel,
  emptyLabel = '전체',
}: PFSearchDateFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const popoverId = useId()

  const parsedRange = parseDateRange(value)
  const hasValue = parsedRange?.start != null && parsedRange.end != null
  const selectedLabel = hasValue
    ? formatKoreanDateRange(parsedRange.start!, parsedRange.end!)
    : emptyLabel

  const rootClassName = [filterStyles.root, className].filter(Boolean).join(' ')

  const closePopover = () => {
    setIsOpen(false)
    setPopoverStyle(undefined)
  }

  const updatePosition = () => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const popover = popoverRef.current
    const popoverWidth = popover?.offsetWidth || POPOVER_FALLBACK_WIDTH_PX
    const popoverHeight = popover?.offsetHeight || POPOVER_FALLBACK_HEIGHT_PX
    setPopoverStyle(getPopoverPositionStyle(rect, popoverWidth, popoverHeight))
  }

  const openPopover = () => {
    const trigger = triggerRef.current
    if (trigger) {
      // 첫 paint부터 트리거 아래에 붙임 (미측정 시 left 클램프 오차 방지)
      setPopoverStyle(
        getPopoverPositionStyle(
          trigger.getBoundingClientRect(),
          POPOVER_FALLBACK_WIDTH_PX,
          POPOVER_FALLBACK_HEIGHT_PX
        )
      )
    }
    setIsOpen(true)
  }

  useLayoutEffect(() => {
    if (!isOpen) return

    updatePosition()

    const popover = popoverRef.current
    const resizeObserver =
      popover && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => updatePosition())
        : null
    if (popover && resizeObserver) {
      resizeObserver.observe(popover)
    }

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

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

  const handleToggle = () => {
    if (disabled) return
    if (isOpen) {
      closePopover()
    } else {
      openPopover()
    }
  }

  const initialViewMonth = (() => {
    if (!parsedRange?.start) return undefined
    const start = parseIsoDate(parsedRange.start)
    return start ? new Date(start.getFullYear(), start.getMonth(), 1) : undefined
  })()

  const popover =
    isOpen && typeof document !== 'undefined'
      ? createPortal(
          <div ref={popoverRef} style={popoverStyle}>
            <PFDatePickerCalendar
              key={`${parsedRange?.start ?? ''}-${parsedRange?.end ?? ''}-${isOpen}`}
              id={popoverId}
              selectionMode="range"
              range={
                parsedRange
                  ? { start: parsedRange.start, end: parsedRange.end }
                  : { start: null, end: null }
              }
              initialViewMonth={initialViewMonth}
              aria-label={`${label} 날짜 선택`}
              onSelectRange={({ start, end }) => {
                onChange(encodeDateRange(start, end))
                closePopover()
                triggerRef.current?.focus()
              }}
            />
          </div>,
          document.body,
        )
      : null

  return (
    <div className={rootClassName} ref={rootRef}>
      <div className={filterStyles.widthSizer} aria-hidden="true">
        <div className={filterStyles.widthSizerTrigger}>
          <span className={filterStyles.label}>{label}</span>
          <span className={filterStyles.trailing}>
            <span className={filterStyles.value}>{selectedLabel}</span>
            <img className={filterStyles.chevron} src={chevronDownPrimaryUrl} alt="" />
          </span>
        </div>
      </div>

      <button
        ref={triggerRef}
        type="button"
        className={filterStyles.trigger}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        aria-label={ariaLabel ?? `${label} 필터`}
        onClick={handleToggle}
      >
        <span className={filterStyles.label}>{label}</span>
        <span className={filterStyles.trailing}>
          <span className={filterStyles.value}>{selectedLabel}</span>
          <img
            className={[filterStyles.chevron, isOpen ? styles.chevronOpen : undefined]
              .filter(Boolean)
              .join(' ')}
            src={chevronDownPrimaryUrl}
            alt=""
            aria-hidden="true"
          />
        </span>
      </button>
      {popover}
    </div>
  )
}
