/**
 * 위젯 편집 가능 대시보드
 */

import { Responsive } from 'react-grid-layout'
import type { Layout } from 'react-grid-layout'
import { useWidgetEditorStore } from '../model/widget-editor-store'
import { WidgetCard } from './widget-card'
import { getWidgetDefinition } from '../lib/widget-registry'
import { Empty } from 'antd'
import { useState, useEffect } from 'react'
import 'react-grid-layout/css/styles.css'
import './widget-editor-dashboard.css'

export function WidgetEditorDashboard() {
  // 모든 Hook을 먼저 호출 (Hook 규칙 준수)
  const { draftState, editMode, updateLayout, setDragging, setResizing } = useWidgetEditorStore()
  const layout = draftState.breakpoints?.lg || []
  const widgets = draftState.widgets
  const [width, setWidth] = useState(1200) // 기본 너비

  // 컨테이너 너비 계산 (WidthProvider 대체)
  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('.widget-editor-dashboard')
      if (container) {
        setWidth(container.clientWidth)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const handleLayoutChange = (
    _newLayout: Layout,
    allLayouts: Partial<Record<string, Layout>>
  ) => {
    // ResponsiveGridLayout의 onLayoutChange는 첫 번째 인자가 Layout (현재 breakpoint의 Layout[])
    // allLayouts에서 lg를 가져와서 사용
    if (allLayouts.lg && Array.isArray(allLayouts.lg)) {
      updateLayout(allLayouts.lg, 'lg')
    }
  }

  const handleDragStart = () => {
    setDragging(true)
  }

  const handleDragStop = () => {
    setDragging(false)
  }

  const handleResizeStart = () => {
    setResizing(true)
  }

  const handleResizeStop = () => {
    setResizing(false)
  }

  // 그리드 설정: 셀 스냅 + 겹침 방지 + 밀어내기(push/reflow) + 세로 compaction
  const gridProps = {
    className: 'widget-grid',
    width: width,
    cols: { lg: 24, md: 12, sm: 6, xs: 4, xxs: 2 },
    rowHeight: 60,
    isDraggable: editMode,
    isResizable: false, // 크기 조정은 프리셋으로만
    compactType: 'vertical' as const, // 세로 방향 자동 정리(빈 공간 최소화)
    preventCollision: false, // false = 드래그 시 다른 위젯이 밀려나며 재배치(push)
    allowOverlap: false, // 위젯끼리 절대 겹치지 않음
    isBounded: true, // 그리드 영역 밖으로 나가지 않음
    margin: [16, 16],
    containerPadding: [0, 0],
    useCSSTransforms: true, // 부드러운 드래그(transform 기반)
  }

  // Hook 호출 후 early return (Hook 규칙 준수)
  if (widgets.length === 0) {
    return (
      <div className="widget-editor-dashboard">
        <Empty description="위젯이 없습니다. 편집 모드에서 위젯을 추가해주세요." />
      </div>
    )
  }

  return (
    <div className="widget-editor-dashboard">
      <Responsive
        {...gridProps}
        layouts={{ lg: layout }}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        // @ts-expect-error - draggableHandle은 Responsive에서도 지원하지만 타입 정의에 없음
        draggableHandle=".widget-card-header[data-drag-handle]"
      >
        {widgets.map(widget => {
          const widgetDef = getWidgetDefinition(widget.widgetKey)
          if (!widgetDef) {
            return null
          }

          const preset = widgetDef.sizePresets[widget.size]
          const layoutItem = layout.find(item => item.i === widget.id)

          return (
            <div key={widget.id} data-grid={layoutItem || { x: 0, y: 0, w: preset.w, h: preset.h }}>
              <WidgetCard widgetInstance={widget} />
            </div>
          )
        })}
      </Responsive>
    </div>
  )
}
