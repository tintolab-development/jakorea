/**
 * DnD 전용 위젯 카드 래퍼
 * 기존 WidgetCard를 그대로 사용하며, 그리드 아이템용 래퍼만 제공.
 * - 드래그 핸들·드래그 중 비활성화·오버플로우 클리핑은 WidgetCard 내부에서 처리.
 */

import { WidgetCard } from './widget-card'
import type { WidgetInstance } from '../model/widget-types'
import './draggable-widget-card.css'

export interface DraggableWidgetCardProps {
  widgetInstance: WidgetInstance
}

/**
 * 드래그 가능 대시보드에서 사용하는 위젯 카드.
 * 기존 WidgetCard를 감싸서 RGL 그리드 아이템 내부에서 동일한 UI/동작을 유지.
 */
export function DraggableWidgetCard({ widgetInstance }: DraggableWidgetCardProps) {
  return (
    <div className="draggable-widget-card">
      <WidgetCard widgetInstance={widgetInstance} />
    </div>
  )
}
