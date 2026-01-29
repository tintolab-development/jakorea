/**
 * DnD 전용 대시보드
 * 2열 그리드(cols=12), 밀집 리팩, 미드라인 기준 드롭 열 결정.
 * - 드롭 시 포인터/요소 중심이 그리드 중앙선 오른쪽이면 x=6, 왼쪽이면 x=0.
 */

import { useRef, useState, useEffect } from 'react'
import { Responsive } from 'react-grid-layout'
import type { Layout, LayoutItem } from 'react-grid-layout'
import { useWidgetEditorStore } from '../model/widget-editor-store'
import { getWidgetDefinition } from '../lib/widget-registry'
import { getDndSizeForWidget } from '../lib/dnd-layout-constants'
import { sanitizeLayoutToTwoColumns } from '../lib/repack-layout'
import { startPointerTracking, stopPointerTracking, getLastPointerX } from '../lib/pointer-tracker'
import { DraggableWidgetCard } from './draggable-widget-card'
import { Empty } from 'antd'
import 'react-grid-layout/css/styles.css'
import './draggable-dashboard.css'

const COLS_LG = 12
const ROW_HEIGHT = 60
const MARGIN: [number, number] = [16, 16]
const CONTAINER_PADDING: [number, number] = [0, 0]
const RIGHT_X = 6

const BREAKPOINTS = { lg: 0 }
const COLS = { lg: COLS_LG }

export function DraggableDashboard() {
  const gridContainerRef = useRef<HTMLDivElement>(null)
  const { draftState, editMode, updateLayout, setDragging, setResizing, repackLayout } =
    useWidgetEditorStore()
  const layout = draftState.breakpoints?.lg || []
  const widgets = draftState.widgets
  const [width, setWidth] = useState(1200)

  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('.draggable-dashboard')
      if (container) setWidth(container.clientWidth)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const handleLayoutChange = (_newLayout: Layout, allLayouts: Partial<Record<string, Layout>>) => {
    if (allLayouts.lg && Array.isArray(allLayouts.lg)) {
      updateLayout(allLayouts.lg, 'lg')
    }
  }

  const handleDragStart = () => {
    setDragging(true)
    startPointerTracking()
  }

  const handleDragStop = (
    newLayout: Layout,
    _oldItem: LayoutItem,
    newItem: LayoutItem,
    _placeholder: LayoutItem,
    e: MouseEvent | TouchEvent | undefined,
    node: HTMLElement | undefined
  ) => {
    // 1) 그리드 컨테이너 중앙선 (포인터가 왼쪽/오른쪽 판단 기준)
    const rect = gridContainerRef.current?.getBoundingClientRect()
    const midX = rect ? rect.left + rect.width / 2 : 0

    // 2) 포인터 X: 이벤트 → 드래그된 노드 중심 → 윈도우 pointermove 추적값 → 중앙선 폴백
    let pointerX: number | null = null
    if (e) {
      if ('clientX' in e && typeof e.clientX === 'number') {
        pointerX = e.clientX
      } else if ('changedTouches' in e && e.changedTouches?.length) {
        pointerX = e.changedTouches[0].clientX
      }
    }
    if (pointerX == null && node) {
      const nodeRect = node.getBoundingClientRect()
      pointerX = nodeRect.left + nodeRect.width / 2
    }
    if (pointerX == null) {
      pointerX = getLastPointerX()
    }
    if (pointerX == null) {
      pointerX = midX
    }

    stopPointerTracking()
    setDragging(false)

    // 3) 중앙선 오른쪽(이상) → x=6, 왼쪽 → x=0 (중앙선 포함 오른쪽 편향)
    const targetX = pointerX >= midX ? RIGHT_X : (0 as 0 | 6)
    const draggedId = newItem.i
    const isHalfWidth = newItem.w < COLS_LG

    if (isHalfWidth) {
      const layoutWithForcedX = newLayout.map(item =>
        item.i === draggedId ? { ...item, x: targetX } : item
      )
      const sanitized = sanitizeLayoutToTwoColumns(layoutWithForcedX)
      updateLayout(sanitized, 'lg')
      repackLayout({ instanceId: draggedId, x: targetX })
    } else {
      repackLayout()
    }
  }

  const handleResizeStart = () => setResizing(true)
  const handleResizeStop = () => {
    setResizing(false)
    repackLayout()
  }

  const gridProps = {
    className: 'draggable-dashboard-grid',
    width,
    breakpoints: BREAKPOINTS,
    cols: COLS,
    rowHeight: ROW_HEIGHT,
    isDraggable: editMode,
    isResizable: false,
    compactType: 'vertical' as const,
    preventCollision: false,
    allowOverlap: false,
    isBounded: true,
    margin: MARGIN,
    containerPadding: CONTAINER_PADDING,
    useCSSTransforms: true,
  }

  if (widgets.length === 0) {
    return (
      <div className="draggable-dashboard" ref={gridContainerRef}>
        <Empty description="위젯이 없습니다. 편집 모드에서 위젯을 추가해주세요." />
      </div>
    )
  }

  return (
    <div className="draggable-dashboard" ref={gridContainerRef}>
      <Responsive
        {...gridProps}
        layouts={{ lg: layout }}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        // @ts-expect-error - draggableHandle은 Responsive에서 지원하나 타입에 없음
        draggableHandle=".widget-card-header[data-drag-handle]"
      >
        {widgets.map(widget => {
          const widgetDef = getWidgetDefinition(widget.widgetKey)
          if (!widgetDef) return null
          const layoutItem = layout.find(item => item.i === widget.id)
          const { w, h } = getDndSizeForWidget(widget.widgetKey)
          const grid = layoutItem ?? { x: 0, y: 0, w, h }
          return (
            <div key={widget.id} data-grid={grid}>
              <DraggableWidgetCard widgetInstance={widget} />
            </div>
          )
        })}
      </Responsive>
    </div>
  )
}
