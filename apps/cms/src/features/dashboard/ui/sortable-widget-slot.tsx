/**
 * 대시보드 위젯 정렬 슬롯 (DnD 래퍼)
 * 위젯/상단블록을 바깥에서만 감싸고, 핸들에서만 드래그 가능. 기존 위젯 UI는 수정하지 않음.
 * Col을 Sortable 노드로 두어 그리드에서 위젯(셀) 단위로만 드래그되도록 함.
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
  /** true면 자식 내부 .widget-drag-handle 사용(알림/고객문의/일정/탭테이블 등); false면 상단에 핸들 띠 추가 */
  hasBuiltInHandle?: boolean
}

interface HandleRect {
  top: number
  left: number
  width: number
  height: number
}

export function SortableWidgetSlot({
  id,
  children,
  colSpan = 24,
  hasBuiltInHandle = false,
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

  // noScaleRectSortingStrategy에서 scaleX/scaleY=1로 고정되므로 그대로 사용
  const colStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  }

  return (
    <Col ref={setColRef} span={colSpan} style={colStyle}>
      <div ref={slotRef} className="dashboard-widget-slot">
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
        {children}
      </div>
    </Col>
  )
}
