/**
 * 위젯 카드 컴포넌트 (드래그 핸들 포함)
 * 드래그/리사이즈 중에는 본문 영역만 포인터 비활성화 (헤더는 드래그 가능 유지)
 */

import { Card } from 'antd'
import { useWidgetEditorStore } from '../model/widget-editor-store'
import { WidgetMenu } from './widget-menu'
import { getWidgetDefinition } from '../lib/widget-registry'
import type { WidgetInstance } from '../model/widget-types'
import './widget-card.css'

interface WidgetCardProps {
  widgetInstance: WidgetInstance
  children?: React.ReactNode
}

export function WidgetCard({ widgetInstance, children }: WidgetCardProps) {
  const { editMode, isDragging, isResizing } = useWidgetEditorStore()
  const widgetDef = getWidgetDefinition(widgetInstance.widgetKey)

  if (!widgetDef) {
    return null
  }

  const WidgetComponent = widgetDef.render
  const isInteracting = isDragging || isResizing

  return (
    <Card
      className={`widget-card${editMode ? ' widget-card-editing' : ''}${isInteracting ? ' widget-card-interacting' : ''}`}
      title={
        <div className="widget-card-header" data-drag-handle>
          <span className="widget-card-title">{widgetDef.title}</span>
          {editMode && (
            <div className="widget-card-actions" onClick={e => e.stopPropagation()}>
              <WidgetMenu widgetInstance={widgetInstance} />
            </div>
          )}
        </div>
      }
      hoverable={editMode}
    >
      <div className={`widget-card-body${isInteracting ? ' widget-card-body-disabled' : ''}`}>
        {isInteracting && <div className="widget-card-body-overlay" aria-hidden />}
        {children ?? <WidgetComponent />}
      </div>
    </Card>
  )
}
