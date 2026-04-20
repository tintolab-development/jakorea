/**
 * 캘린더 일정 미리보기: Ant Popover placement 대신 커서 근처에 fixed 포털로 표시
 * (program-calendar · program-schedule-widget 공통)
 */

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
import '@/shared/ui/overlay-popover.css'

const CURSOR_OVERLAY_OFFSET = 12
const POPOVER_ENTER_DELAY_MS = 120
/** 신청자 Tooltip 기존 Ant `mouseEnterDelay`와 동일 */
const TOOLTIP_ENTER_DELAY_MS = 150
const OVERLAY_LEAVE_DELAY_MS = 80

/** viewport 클램프 — program 미리보기(333px) */
const POPOVER_PANEL_ESTIMATE_W = 340
const POPOVER_PANEL_ESTIMATE_H = 280
/** 신청자 일정 패널(calendar-schedule-panel) 폭 상한에 맞춤 */
const TOOLTIP_PANEL_ESTIMATE_W = 368
const TOOLTIP_PANEL_ESTIMATE_H = 300

type CursorOverlayVariant = 'popover' | 'tooltip'

export interface CalendarCursorOverlayFollowCursorProps {
  variant: CursorOverlayVariant
  tooltipOverlayClassName?: string
  content: ReactNode
  children: ReactElement
}

/**
 * Popover / Tooltip 공통: 셀·트리거 기준 placement 대신 커서를 따라 `fixed` 포털로 표시
 * (패널 위 호버 시 이탈 타이머 취소 — 신청자·프로그램 미리보기 상호작용)
 */
export function CalendarCursorOverlayFollowCursor({
  variant,
  tooltipOverlayClassName,
  content,
  children,
}: CalendarCursorOverlayFollowCursorProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const panelW = variant === 'tooltip' ? TOOLTIP_PANEL_ESTIMATE_W : POPOVER_PANEL_ESTIMATE_W
  const panelH = variant === 'tooltip' ? TOOLTIP_PANEL_ESTIMATE_H : POPOVER_PANEL_ESTIMATE_H
  const enterDelayMs = variant === 'tooltip' ? TOOLTIP_ENTER_DELAY_MS : POPOVER_ENTER_DELAY_MS

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
    (clientX: number, clientY: number) => {
      if (typeof window === 'undefined') return
      const pad = 8
      let x = clientX + CURSOR_OVERLAY_OFFSET
      let y = clientY + CURSOR_OVERLAY_OFFSET
      x = Math.min(x, window.innerWidth - panelW - pad)
      y = Math.min(y, window.innerHeight - panelH - pad)
      x = Math.max(pad, x)
      y = Math.max(pad, y)
      setPos({ x, y })
    },
    [panelW, panelH]
  )

  useEffect(
    () => () => {
      clearEnterTimer()
      clearLeaveTimer()
    },
    [clearEnterTimer, clearLeaveTimer]
  )

  const scheduleOpen = useCallback(() => {
    clearEnterTimer()
    enterTimerRef.current = setTimeout(() => setOpen(true), enterDelayMs)
  }, [clearEnterTimer, enterDelayMs])

  const scheduleClose = useCallback(() => {
    clearLeaveTimer()
    leaveTimerRef.current = setTimeout(() => setOpen(false), OVERLAY_LEAVE_DELAY_MS)
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

  const portal =
    variant === 'popover' ? (
      <div
        className="ant-popover app-popover-panel calendar-cell-preview-popover calendar-cursor-popover"
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          zIndex: 1060,
          pointerEvents: 'auto',
        }}
        onMouseEnter={handlePanelMouseEnter}
        onMouseLeave={handlePanelMouseLeave}
      >
        <div className="ant-popover-content">
          <div className="ant-popover-inner">
            <div className="ant-popover-inner-content">{content}</div>
          </div>
        </div>
      </div>
    ) : (
      <div
        className={['calendar-tooltip-overlay', 'calendar-cursor-tooltip', tooltipOverlayClassName]
          .filter(Boolean)
          .join(' ')}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          zIndex: 1060,
          pointerEvents: 'auto',
        }}
        onMouseEnter={handlePanelMouseEnter}
        onMouseLeave={handlePanelMouseLeave}
      >
        <div className="ant-tooltip-inner">{content}</div>
      </div>
    )

  return (
    <>
      <div
        onMouseEnter={handleTriggerMouseEnter}
        onMouseMove={handleTriggerMouseMove}
        onMouseLeave={handleTriggerMouseLeave}
      >
        {children}
      </div>
      {open && createPortal(portal, document.body)}
    </>
  )
}
