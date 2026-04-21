import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

import './calendar-preview-tooltip.css'

const CURSOR_OFFSET_PX = 12
const OPEN_DELAY_MS = 150
const CLOSE_DELAY_MS = 80
const PANEL_ESTIMATE_W = 368
const PANEL_ESTIMATE_H = 300

export type CalendarPreviewTooltipProps = {
  children: ReactElement
  /** false 또는 `content`가 없으면 툴팁 없이 children만 렌더 */
  enabled?: boolean
  content: ReactNode
  tooltipOverlayClassName?: string
}

/**
 * 캘린더 셀(또는 셀 크기 트리거) 호버 시 `content`를 **커서 근처 fixed 포털**로 표시.
 * (Ant `Tooltip` 대체 — 전일정 목록 + 마우스 위치 기준)
 */
export function CalendarPreviewTooltip({
  children,
  enabled = true,
  content,
  tooltipOverlayClassName,
}: CalendarPreviewTooltipProps): ReactNode {
  if (!enabled || content == null) return children

  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearEnterTimer = useCallback(() => {
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current)
      enterTimerRef.current = null
    }
  }, [])

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
  }, [])

  const clampToViewport = useCallback((clientX: number, clientY: number) => {
    if (typeof window === 'undefined') return { x: clientX, y: clientY }
    const pad = 8
    let x = clientX + CURSOR_OFFSET_PX
    let y = clientY + CURSOR_OFFSET_PX
    x = Math.min(x, window.innerWidth - PANEL_ESTIMATE_W - pad)
    y = Math.min(y, window.innerHeight - PANEL_ESTIMATE_H - pad)
    x = Math.max(pad, x)
    y = Math.max(pad, y)
    return { x, y }
  }, [])

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      setPos(clampToViewport(clientX, clientY))
    },
    [clampToViewport]
  )

  const scheduleOpen = useCallback(() => {
    clearEnterTimer()
    enterTimerRef.current = setTimeout(() => setOpen(true), OPEN_DELAY_MS)
  }, [clearEnterTimer])

  const scheduleClose = useCallback(() => {
    clearLeaveTimer()
    leaveTimerRef.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }, [clearLeaveTimer])

  const handleTriggerMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    clearLeaveTimer()
    updatePosition(e.clientX, e.clientY)
    scheduleOpen()
  }

  const handleTriggerMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    updatePosition(e.clientX, e.clientY)
  }

  const handleTriggerMouseLeave = () => {
    clearEnterTimer()
    scheduleClose()
  }

  const handlePanelMouseEnter = () => {
    clearLeaveTimer()
    clearEnterTimer()
    setOpen(true)
  }

  const handlePanelMouseLeave = () => {
    scheduleClose()
  }

  useEffect(() => {
    return () => {
      clearEnterTimer()
      clearLeaveTimer()
    }
  }, [clearEnterTimer, clearLeaveTimer])

  const portal =
    open &&
    createPortal(
      <div
        className={['calendar-preview-tooltip', tooltipOverlayClassName].filter(Boolean).join(' ')}
        style={{ left: pos.x, top: pos.y }}
        onMouseEnter={handlePanelMouseEnter}
        onMouseLeave={handlePanelMouseLeave}
      >
        <div className="calendar-preview-tooltip__inner">{content}</div>
      </div>,
      document.body
    )

  return (
    <>
      <div
        className="calendar-preview-tooltip-trigger"
        onMouseEnter={handleTriggerMouseEnter}
        onMouseMove={handleTriggerMouseMove}
        onMouseLeave={handleTriggerMouseLeave}
      >
        {children}
      </div>
      {portal}
    </>
  )
}
