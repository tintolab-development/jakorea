/**
 * 대시보드 위젯 정렬 슬롯 (DnD 래퍼)
 * 위젯/상단블록을 바깥에서만 감싸고, 핸들에서만 드래그 가능. 기존 위젯 UI는 수정하지 않음.
 * Col을 Sortable 노드로 두어 그리드에서 위젯(셀) 단위로만 드래그되도록 함.
 *
 * 너비 리사이즈: 우측 엣지 드래그 핸들 → 20px 이상 드래그 시 50%(12) ↔ 100%(24) 스냅
 */

import React, { useRef, useLayoutEffect, useCallback, useState } from 'react'
import { Col } from 'antd'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface SortableWidgetSlotProps {
  id: string
  children: React.ReactNode
  /** Ant Design Col span (24, 12, 6 등) */
  colSpan?: number
  /** true(기본)면 자식 내부 .widget-drag-handle 사용; false면 상단에 핸들 띠 추가 */
  hasBuiltInHandle?: boolean
  /** 위젯 고정 높이(px). 미지정 시 338px */
  height?: number
  /** 너비 변경 콜백 (12=50%, 24=100%). 미지정 시 리사이즈 핸들 미노출 */
  onResizeWidth?: (newColSpan: 12 | 24) => void
}

interface HandleRect {
  top: number
  left: number
  width: number
  height: number
}

/** 스냅 트리거 최소 드래그 거리 (px) */
const RESIZE_THRESHOLD = 20

export function SortableWidgetSlot({
  id,
  children,
  colSpan = 24,
  hasBuiltInHandle = true,
  height,
  onResizeWidth,
}: SortableWidgetSlotProps) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    listeners,
    attributes,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    // 부드러운 switching 전환 애니메이션
    transition: {
      duration: 300,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
    },
  })

  const colRef = useRef<HTMLDivElement | null>(null)
  const slotRef = useRef<HTMLDivElement | null>(null)
  const [handleRect, setHandleRect] = useState<HandleRect | null>(null)

  // --- 너비 리사이즈 드래그 상태 (ref: stale closure 방지) ---
  const colSpanRef = useRef(colSpan)
  colSpanRef.current = colSpan
  const isResizingRef = useRef(false)
  const resizeStartXRef = useRef(0)
  const [isResizing, setIsResizing] = useState(false)

  const setColRef = useCallback(
    (el: HTMLDivElement | null) => {
      ;(colRef as React.MutableRefObject<HTMLDivElement | null>).current = el
      setNodeRef(el)
    },
    [setNodeRef]
  )

  // 자식 내부 .widget-drag-handle 위치 측정(슬롯 div 기준) → 그 위에 투명 오버레이
  const measureHandle = useCallback(() => {
    if (!hasBuiltInHandle || !slotRef.current) return
    const slot = slotRef.current
    const handle = slot.querySelector('.widget-drag-handle') as HTMLElement | null
    if (!handle) {
      setHandleRect(null)
      return
    }
    const sr = slot.getBoundingClientRect()
    const hr = handle.getBoundingClientRect()
    setHandleRect({
      top: hr.top - sr.top,
      left: hr.left - sr.left,
      width: hr.width,
      height: hr.height,
    })
  }, [hasBuiltInHandle])

  useLayoutEffect(() => {
    measureHandle()
    const t = setTimeout(measureHandle, 100)
    return () => clearTimeout(t)
  }, [measureHandle, children])

  // --- 리사이즈 핸들 포인터 이벤트 ---
  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!onResizeWidth) return
      e.stopPropagation()
      e.preventDefault()
      isResizingRef.current = true
      resizeStartXRef.current = e.clientX
      setIsResizing(true)
      e.currentTarget.setPointerCapture(e.pointerId)
      document.body.style.cursor = 'col-resize'
    },
    [onResizeWidth]
  )

  const handleResizePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isResizingRef.current || !onResizeWidth) return
      const delta = e.clientX - resizeStartXRef.current
      if (delta > RESIZE_THRESHOLD && colSpanRef.current !== 24) {
        // 오른쪽으로 충분히 드래그 → 100%로 확장
        onResizeWidth(24)
        resizeStartXRef.current = e.clientX
      } else if (delta < -RESIZE_THRESHOLD && colSpanRef.current !== 12) {
        // 왼쪽으로 충분히 드래그 → 50%로 축소
        onResizeWidth(12)
        resizeStartXRef.current = e.clientX
      }
    },
    [onResizeWidth]
  )

  const handleResizeEnd = useCallback(() => {
    isResizingRef.current = false
    setIsResizing(false)
    document.body.style.cursor = ''
  }, [])

  // noScaleRectSortingStrategy에서 scaleX/scaleY=1로 고정되므로 그대로 사용
  // flex-basis/max-width transition: span 변경(너비 리사이즈) 시 부드러운 애니메이션
  const resizeTransition = onResizeWidth
    ? 'flex-basis 0.35s cubic-bezier(0.2, 0, 0, 1), max-width 0.35s cubic-bezier(0.2, 0, 0, 1)'
    : null

  const colStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: [transition, resizeTransition].filter(Boolean).join(', ') || undefined,
    opacity: isDragging ? 0 : 1,
  }

  const slotHeight = height !== undefined ? height : 'auto'
  const slotStyle: React.CSSProperties = { height: slotHeight }

  return (
    <Col
      ref={setColRef}
      span={colSpan}
      style={colStyle}
      data-dashboard-slot-id={id}
    >
      <div ref={slotRef} className="dashboard-widget-slot" style={slotStyle} data-col-span={colSpan}>
        {!hasBuiltInHandle && (
          <div
            ref={setActivatorNodeRef}
            className="widget-drag-handle dashboard-widget-slot__handle"
            aria-hidden
            {...listeners}
            {...attributes}
          >
            <span className="widget-drag-handle-bar" />
            <span className="widget-drag-handle-bar" />
          </div>
        )}
        {hasBuiltInHandle && handleRect && (
          <div
            ref={setActivatorNodeRef}
            className="dashboard-widget-slot__handle-overlay"
            aria-hidden
            style={{
              position: 'absolute',
              top: handleRect.top,
              left: handleRect.left,
              width: handleRect.width,
              height: handleRect.height,
              cursor: 'grab',
              zIndex: 1,
            }}
            {...listeners}
            {...attributes}
          />
        )}
        {/* 너비 리사이즈 드래그 핸들 (우측 엣지) */}
        {onResizeWidth && (
          <div
            className={`dashboard-widget-resize-handle${isResizing ? ' dashboard-widget-resize-handle--active' : ''}`}
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizeEnd}
            onPointerCancel={handleResizeEnd}
            onLostPointerCapture={handleResizeEnd}
            role="separator"
            aria-label="너비 조절 (드래그)"
          >
            <div className="dashboard-widget-resize-handle__bar" />
          </div>
        )}
        {children}
      </div>
    </Col>
  )
}
