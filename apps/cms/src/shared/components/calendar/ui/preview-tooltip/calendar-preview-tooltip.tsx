import {
  useCallback,
  useEffect,
  useLayoutEffect,
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
const VIEWPORT_PAD = 8

function computeTooltipPosition(
  clientX: number,
  clientY: number,
  panelW: number,
  panelH: number
): { x: number; y: number } {
  if (typeof window === 'undefined') {
    return { x: clientX + CURSOR_OFFSET_PX, y: clientY + CURSOR_OFFSET_PX }
  }

  const pad = VIEWPORT_PAD
  const offset = CURSOR_OFFSET_PX
  const vw = window.innerWidth
  const vh = window.innerHeight

  let x = clientX + offset
  let y = clientY + offset

  /* 하단 넘침 시 커서 위로 뒤집기 — top을 viewport-max로 끌어올리지 않음 */
  if (y + panelH > vh - pad) {
    const aboveY = clientY - panelH - offset
    y = aboveY >= pad ? aboveY : Math.max(pad, vh - panelH - pad)
  }

  if (x + panelW > vw - pad) {
    const leftX = clientX - panelW - offset
    x = leftX >= pad ? leftX : Math.max(pad, vw - panelW - pad)
  }

  x = Math.max(pad, Math.min(x, vw - panelW - pad))
  y = Math.max(pad, Math.min(y, vh - panelH - pad))

  return { x, y }
}

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
  const panelRef = useRef<HTMLDivElement>(null)
  const lastPointerRef = useRef({ x: 0, y: 0 })

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

  const updatePosition = useCallback(
    (clientX: number, clientY: number, panelW = PANEL_ESTIMATE_W, panelH = PANEL_ESTIMATE_H) => {
      lastPointerRef.current = { x: clientX, y: clientY }
      setPos(computeTooltipPosition(clientX, clientY, panelW, panelH))
    },
    []
  )

  const remeasureFromPanel = useCallback(() => {
    const panel = panelRef.current
    if (panel == null) return
    const rect = panel.getBoundingClientRect()
    const { x, y } = lastPointerRef.current
    updatePosition(x, y, rect.width, rect.height)
  }, [updatePosition])

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
    if (open && panelRef.current != null) {
      const rect = panelRef.current.getBoundingClientRect()
      updatePosition(e.clientX, e.clientY, rect.width, rect.height)
      return
    }
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

  useLayoutEffect(() => {
    if (!open) return
    remeasureFromPanel()
  }, [open, content, remeasureFromPanel])

  useEffect(() => {
    if (!open) return

    const onScroll = () => scheduleClose()
    const onResize = () => remeasureFromPanel()

    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, scheduleClose, remeasureFromPanel])

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
        ref={panelRef}
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
