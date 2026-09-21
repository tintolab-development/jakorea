import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { from24h } from '@/shared/components/date-time-picker-time-selects'

export const DATE_TIME_PICKER_POPOVER_GAP = 6

export function dayjsTimeParts(d: Dayjs): { h: string; m: string; mer: 'AM' | 'PM' } {
  const { h12, mer } = from24h(d.hour())
  return { h: String(h12), m: String(d.minute()), mer }
}

/** overlay 문자열·invalid dayjs가 들어와도 Dayjs를 반환한다. */
export function toPickerDayjs(value: unknown): Dayjs {
  if (dayjs.isDayjs(value) && value.isValid()) return value
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const parsed = dayjs(value)
    if (parsed.isValid()) return parsed
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = dayjs(value)
    if (parsed.isValid()) return parsed
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = dayjs(value)
    if (parsed.isValid()) return parsed
  }
  return dayjs()
}

export function findNextEnabledDate(date: Dayjs, disabledDate?: (date: Dayjs) => boolean): Dayjs {
  const start = toPickerDayjs(date)
  if (!disabledDate?.(start)) return start
  for (let offset = 1; offset <= 366; offset += 1) {
    const next = start.add(offset, 'day')
    if (!disabledDate(next)) return next
  }
  return start
}

export function useDateTimePickerPopoverLayer({
  open,
  onClose,
  anchorRef,
  dismissExcludeRef,
  repositionDeps = [],
}: {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  dismissExcludeRef?: RefObject<HTMLElement | null>
  repositionDeps?: unknown[]
}) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({ visibility: 'hidden' })

  const updatePopoverPosition = useCallback(() => {
    const anchor = anchorRef.current
    const pop = popoverRef.current
    if (!anchor || !pop) return

    const rect = anchor.getBoundingClientRect()
    const popH = pop.offsetHeight || 400
    const popW = pop.offsetWidth || 500
    const vw = window.innerWidth
    const vh = window.innerHeight
    const scrollX = window.scrollX
    const scrollY = window.scrollY

    let top = rect.bottom + DATE_TIME_PICKER_POPOVER_GAP + scrollY
    const spaceBelow = vh - rect.bottom - DATE_TIME_PICKER_POPOVER_GAP
    const spaceAbove = rect.top - DATE_TIME_PICKER_POPOVER_GAP
    if (spaceBelow < popH && spaceAbove > spaceBelow) {
      top = rect.top - popH - DATE_TIME_PICKER_POPOVER_GAP + scrollY
    }

    let left = rect.left + scrollX
    left = Math.min(left, scrollX + vw - popW - 12)
    left = Math.max(left, scrollX + 12)

    setPopoverStyle({ top, left, visibility: 'visible' })
  }, [anchorRef])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- repositionDeps
  }, [open, schedulePosition, ...repositionDeps])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Node
      if (anchorRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      if (dismissExcludeRef?.current?.contains(target)) return
      onClose()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open, onClose, anchorRef, dismissExcludeRef])

  return { popoverRef, popoverStyle }
}
