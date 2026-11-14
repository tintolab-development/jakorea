import { useCallback, useEffect, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'

/** 이 거리(px) 이상 끌면 드래그로 보고, 손을 뗄 때의 클릭(탭 선택)을 막는다 */
export const DRAG_SCROLL_CLICK_THRESHOLD_PX = 5

interface DragScrollState {
  pointerId: number
  startX: number
  startScrollLeft: number
  dragged: boolean
}

/**
 * 가로 스크롤 영역을 마우스로 누른 채 끌어 스크롤한다.
 * - 마우스 왼쪽 버튼만 처리한다(터치·펜은 브라우저 기본 스크롤).
 * - 임계 거리 이상 끌었으면 그 직후 발생하는 click을 캡처 단계에서 막는다.
 */
export function useDragScroll<T extends HTMLElement>() {
  const containerRef = useRef<T>(null)
  const dragRef = useRef<DragScrollState | null>(null)
  const suppressClickRef = useRef(false)
  const suppressResetTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (suppressResetTimerRef.current != null) {
        window.clearTimeout(suppressResetTimerRef.current)
      }
    }
  }, [])

  const onPointerDown = useCallback((event: ReactPointerEvent<T>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    const container = containerRef.current
    if (!container) return
    suppressClickRef.current = false
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: container.scrollLeft,
      dragged: false,
    }
  }, [])

  const onPointerMove = useCallback((event: ReactPointerEvent<T>) => {
    const drag = dragRef.current
    const container = containerRef.current
    if (!drag || !container || event.pointerId !== drag.pointerId) return
    const deltaX = event.clientX - drag.startX
    if (!drag.dragged) {
      if (Math.abs(deltaX) < DRAG_SCROLL_CLICK_THRESHOLD_PX) return
      drag.dragged = true
      container.setPointerCapture(event.pointerId)
    }
    container.scrollLeft = drag.startScrollLeft - deltaX
  }, [])

  const endDrag = useCallback((event: ReactPointerEvent<T>) => {
    const drag = dragRef.current
    if (!drag || event.pointerId !== drag.pointerId) return
    dragRef.current = null
    const container = containerRef.current
    if (container?.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId)
    }
    if (!drag.dragged) return
    suppressClickRef.current = true
    // pointerup 직후 click이 오지 않는 경우(포인터 캡처 등)에도 다음 클릭을 막지 않도록 해제
    if (suppressResetTimerRef.current != null) {
      window.clearTimeout(suppressResetTimerRef.current)
    }
    suppressResetTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = false
      suppressResetTimerRef.current = null
    }, 0)
  }, [])

  const onClickCapture = useCallback((event: ReactMouseEvent<T>) => {
    if (!suppressClickRef.current) return
    suppressClickRef.current = false
    event.preventDefault()
    event.stopPropagation()
  }, [])

  return {
    containerRef,
    dragScrollHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onClickCapture,
    },
  }
}
