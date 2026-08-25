/**
 * 대시보드 위젯 정렬 슬롯 (DnD 래퍼)
 * 위젯/상단블록을 바깥에서만 감싸고, 핸들에서만 드래그 가능. 기존 위젯 UI는 수정하지 않음.
 * Col을 Sortable 노드로 두어 그리드에서 위젯(셀) 단위로만 드래그되도록 함.
 *
 * 너비 리사이즈: 우측 엣지 드래그 → pointerup에서 50%(12) ↔ 100%(24) 1회 스냅
 */

import React, {
  memo,
  useRef,
  useLayoutEffect,
  useCallback,
  useState,
  useEffect,
  useId,
} from 'react'
import { DASHBOARD_SLOT_HEIGHT_HALF_PX } from '@/shared/config/dashboard-config'
import { Col } from 'antd'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { resolveResizeSnap } from '@/features/dashboard/lib/resize-snap'

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
  onResizeWidth?: (widgetId: string, newColSpan: 12 | 24) => void
}

interface HandleRect {
  top: number
  left: number
  width: number
  height: number
}

function DashboardWidgetResizeWidthIcon({ maskId }: { maskId: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="dashboard-widget-resize-handle__svg"
    >
      <mask
        id={maskId}
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="20"
        height="20"
      >
        <rect
          opacity="0.6"
          x="20"
          y="8.74228e-07"
          width="20"
          height="20"
          transform="rotate(90 20 8.74228e-07)"
          fill="#D9D9D9"
        />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path
          d="M4.04167 10.0002L7.27083 13.2293C7.4375 13.396 7.52083 13.5905 7.52083 13.8127C7.52083 14.0349 7.4375 14.2293 7.27083 14.396C7.10417 14.5627 6.90625 14.646 6.67708 14.646C6.44792 14.646 6.25 14.5627 6.08333 14.396L2.85417 11.1877C2.53472 10.8682 2.375 10.4724 2.375 10.0002C2.375 9.52795 2.53472 9.13212 2.85417 8.81267L6.08333 5.58351C6.25 5.41684 6.44792 5.33698 6.67708 5.34392C6.90625 5.35087 7.10417 5.43767 7.27083 5.60434C7.4375 5.77101 7.52083 5.96892 7.52083 6.19809C7.52083 6.42726 7.4375 6.62517 7.27083 6.79184L4.04167 10.0002ZM15.9583 10.0002L12.75 6.79184C12.5833 6.62517 12.5035 6.43073 12.5104 6.20851C12.5174 5.98628 12.5972 5.79184 12.75 5.62517C12.9167 5.45851 13.1146 5.3717 13.3438 5.36476C13.5729 5.35781 13.7708 5.43767 13.9375 5.60434L17.1458 8.81267C17.4653 9.13212 17.625 9.52795 17.625 10.0002C17.625 10.4724 17.4653 10.8682 17.1458 11.1877L13.9375 14.396C13.7708 14.5627 13.5729 14.6425 13.3438 14.6356C13.1146 14.6286 12.9167 14.5418 12.75 14.3752C12.5972 14.2085 12.5174 14.0141 12.5104 13.7918C12.5035 13.5696 12.5833 13.3752 12.75 13.2085L15.9583 10.0002Z"
          fill="#3D3D3D"
        />
      </g>
    </svg>
  )
}

function SortableWidgetSlotInner({
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
    transition: {
      duration: 180,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
    },
  })

  const colRef = useRef<HTMLDivElement | null>(null)
  const slotRef = useRef<HTMLDivElement | null>(null)
  const [handleRect, setHandleRect] = useState<HandleRect | null>(null)
  const handleRectSnapshotRef = useRef<HandleRect | null>(null)

  const colSpanRef = useRef(colSpan)
  const isResizingRef = useRef(false)
  const resizeStartXRef = useRef(0)
  const resizeLastXRef = useRef(0)
  const [isResizing, setIsResizing] = useState(false)
  const [previewColSpan, setPreviewColSpan] = useState<12 | 24 | null>(null)
  const resizeIconMaskId = useId().replace(/:/g, '')

  useLayoutEffect(() => {
    colSpanRef.current = colSpan
  }, [colSpan])

  const setColRef = useCallback(
    (el: HTMLDivElement | null) => {
      ;(colRef as React.MutableRefObject<HTMLDivElement | null>).current = el
      setNodeRef(el)
    },
    [setNodeRef]
  )

  const measureHandle = useCallback(() => {
    if (!hasBuiltInHandle || !slotRef.current) return
    const slot = slotRef.current
    const handle = slot.querySelector('.widget-drag-handle') as HTMLElement | null
    if (!handle) {
      if (handleRectSnapshotRef.current !== null) {
        handleRectSnapshotRef.current = null
        setHandleRect(null)
      }
      return
    }
    const sr = slot.getBoundingClientRect()
    const hr = handle.getBoundingClientRect()
    const next: HandleRect = {
      top: hr.top - sr.top,
      left: hr.left - sr.left,
      width: hr.width,
      height: hr.height,
    }
    const prev = handleRectSnapshotRef.current
    if (
      prev &&
      prev.top === next.top &&
      prev.left === next.left &&
      prev.width === next.width &&
      prev.height === next.height
    ) {
      return
    }
    handleRectSnapshotRef.current = next
    setHandleRect(next)
  }, [hasBuiltInHandle])

  useLayoutEffect(() => {
    if (isDragging) return
    measureHandle()
    const t = setTimeout(measureHandle, 100)
    return () => clearTimeout(t)
  }, [measureHandle, isDragging])

  useLayoutEffect(() => {
    const slot = slotRef.current
    if (!slot || !hasBuiltInHandle || isDragging) return
    const ro = new ResizeObserver(() => {
      measureHandle()
    })
    ro.observe(slot)
    return () => ro.disconnect()
  }, [hasBuiltInHandle, measureHandle, isDragging])

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!onResizeWidth) return
      e.stopPropagation()
      e.preventDefault()
      isResizingRef.current = true
      resizeStartXRef.current = e.clientX
      resizeLastXRef.current = e.clientX
      setIsResizing(true)
      setPreviewColSpan(colSpanRef.current === 12 || colSpanRef.current === 24 ? colSpanRef.current : 24)
      e.currentTarget.setPointerCapture(e.pointerId)
      document.body.style.cursor = 'grabbing'
    },
    [onResizeWidth]
  )

  const handleResizePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizingRef.current) return
    resizeLastXRef.current = e.clientX
    const startSpan: 12 | 24 = colSpanRef.current === 12 ? 12 : 24
    const next = resolveResizeSnap(startSpan, e.clientX - resizeStartXRef.current)
    setPreviewColSpan(prev => (prev === next ? prev : next))
  }, [])

  const handleResizeEnd = useCallback(
    (e?: React.PointerEvent<HTMLDivElement>) => {
      if (!isResizingRef.current) return
      const clientX = e?.clientX ?? resizeLastXRef.current
      const startSpan: 12 | 24 = colSpanRef.current === 12 ? 12 : 24
      const next = resolveResizeSnap(startSpan, clientX - resizeStartXRef.current)
      isResizingRef.current = false
      setIsResizing(false)
      setPreviewColSpan(null)
      document.body.style.cursor = ''
      if (onResizeWidth && next !== startSpan) {
        onResizeWidth(id, next)
      }
    },
    [id, onResizeWidth]
  )

  const setGrabbedClass = useCallback((grabbed: boolean) => {
    const slot = slotRef.current
    if (!slot) return
    slot.classList.toggle('dashboard-widget-slot--grabbed', grabbed)
  }, [])

  const handleGrabPointerDown = useCallback(() => {
    setGrabbedClass(true)
  }, [setGrabbedClass])

  const handleGrabPointerUp = useCallback(() => {
    setGrabbedClass(false)
  }, [setGrabbedClass])

  useEffect(() => {
    if (!isDragging) return
    setGrabbedClass(false)
  }, [isDragging, setGrabbedClass])

  useEffect(() => {
    const clear = () => setGrabbedClass(false)
    window.addEventListener('pointerup', clear)
    window.addEventListener('pointercancel', clear)
    window.addEventListener('blur', clear)
    document.addEventListener('visibilitychange', clear)
    return () => {
      window.removeEventListener('pointerup', clear)
      window.removeEventListener('pointercancel', clear)
      window.removeEventListener('blur', clear)
      document.removeEventListener('visibilitychange', clear)
      setGrabbedClass(false)
    }
  }, [setGrabbedClass])

  const resizeTransition =
    onResizeWidth && !isResizing
      ? 'flex-basis 0.35s cubic-bezier(0.2, 0, 0, 1), max-width 0.35s cubic-bezier(0.2, 0, 0, 1)'
      : null

  const colStyle: React.CSSProperties = {
    transition: resizeTransition ?? undefined,
  }
  const transformText = CSS.Transform.toString(transform)
  const motionStyle: React.CSSProperties = {
    transform: transformText ? `${transformText} translateZ(0)` : undefined,
    transition: transition ?? undefined,
    opacity: isDragging ? 0 : 1,
    willChange: isDragging ? 'transform' : undefined,
  }

  const slotHeight =
    colSpan === 12 ? DASHBOARD_SLOT_HEIGHT_HALF_PX : height !== undefined ? height : 'auto'
  const slotStyle: React.CSSProperties = { height: slotHeight }
  const showResizePreview =
    isResizing && previewColSpan != null && previewColSpan !== (colSpan === 12 ? 12 : 24)

  return (
    <Col
      ref={setColRef}
      span={colSpan}
      style={colStyle}
      data-dashboard-slot-id={id}
      data-dragging={isDragging ? 'true' : undefined}
    >
      <div style={motionStyle}>
        <div
          ref={slotRef}
          className={`dashboard-widget-slot${onResizeWidth ? ' dashboard-widget-slot--resizable-width' : ''}${
            showResizePreview
              ? previewColSpan === 24
                ? ' dashboard-widget-slot--resize-preview-full'
                : ' dashboard-widget-slot--resize-preview-half'
              : ''
          }`}
          style={slotStyle}
          data-col-span={colSpan}
        >
          {!hasBuiltInHandle && (
            <div
              ref={setActivatorNodeRef}
              className="widget-drag-handle dashboard-widget-slot__handle"
              aria-label="위젯 드래그 핸들"
              onPointerDownCapture={handleGrabPointerDown}
              onPointerUp={handleGrabPointerUp}
              onPointerCancel={handleGrabPointerUp}
              onLostPointerCapture={handleGrabPointerUp}
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
              aria-label="위젯 드래그 핸들"
              style={{
                position: 'absolute',
                top: handleRect.top,
                left: handleRect.left,
                width: handleRect.width,
                height: handleRect.height,
                cursor: 'grab',
                zIndex: 1,
              }}
              onPointerDownCapture={handleGrabPointerDown}
              onPointerUp={handleGrabPointerUp}
              onPointerCancel={handleGrabPointerUp}
              onLostPointerCapture={handleGrabPointerUp}
              {...listeners}
              {...attributes}
            />
          )}
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
              title="너비 조절: 좌우로 드래그하면 50% / 100%로 변경됩니다"
            >
              <span className="dashboard-widget-resize-handle__icon-wrap">
                <DashboardWidgetResizeWidthIcon maskId={`dw-resize-mask-${resizeIconMaskId}`} />
              </span>
            </div>
          )}
          {showResizePreview && (
            <div
              className={`dashboard-widget-resize-preview dashboard-widget-resize-preview--${
                previewColSpan === 24 ? 'full' : 'half'
              }`}
              aria-hidden
            />
          )}
          {children}
        </div>
      </div>
    </Col>
  )
}

export const SortableWidgetSlot = memo(SortableWidgetSlotInner)
SortableWidgetSlot.displayName = 'SortableWidgetSlot'
