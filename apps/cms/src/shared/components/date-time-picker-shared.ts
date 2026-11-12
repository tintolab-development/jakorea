import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
export const DATE_TIME_PICKER_POPOVER_GAP = 6

/** 팝오버 시·분 draft state (0~23시, 0~59분) */
export function dayjsTimeParts(d: Dayjs): { h: string; m: string } {
  return { h: String(d.hour()), m: String(d.minute()) }
}

/** overlay JSON 왕복 등으로 Dayjs가 ISO string이 된 값을 복원한다. */
export function toValidDayjsOrNull(value: unknown): Dayjs | null {
  if (value == null || value === '') return null
  if (dayjs.isDayjs(value)) return value.isValid() ? value : null
  if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
    const parsed = dayjs(value)
    return parsed.isValid() ? parsed : null
  }
  return null
}

export function toValidDayjs(value: unknown, fallback: Dayjs = dayjs()): Dayjs {
  return toValidDayjsOrNull(value) ?? fallback
}

/** overlay 문자열·invalid dayjs가 들어와도 Dayjs를 반환한다. */
export function toPickerDayjs(value: unknown): Dayjs {
  return toValidDayjs(value)
}

export function findNextEnabledDate(date: Dayjs, disabledDate?: (date: Dayjs) => boolean): Dayjs {
  const start = toValidDayjs(date)
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

/** 분을 스텝에 맞춰 내림한다(스텝 없음·1분이면 그대로). 예: (45, 30) → 30 */
export function snapMinuteToStep(minute: number, minuteStep?: number): number {
  const step = minuteStep != null && minuteStep > 1 ? Math.floor(minuteStep) : 1
  if (step <= 1) return minute
  return Math.floor(minute / step) * step
}
