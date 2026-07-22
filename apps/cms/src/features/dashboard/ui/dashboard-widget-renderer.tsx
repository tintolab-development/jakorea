/**
 * 위젯 타입별 렌더링 (Dashboard 비즈니스 로직 격리, 페이지 컴포넌트 경량화)
 */

import { memo } from 'react'
import type { DashboardWidgetType } from '@/shared/config/dashboard-config'
import {
  DASHBOARD_WIDGET_REGISTRY,
  type DashboardWidgetRenderProps,
} from '@/features/dashboard/ui/dashboard-widget-registry'

export interface DashboardWidgetRendererProps extends DashboardWidgetRenderProps {
  /** 레이아웃·DnD orderedIds와 동일 (보통 DashboardWidgetType) */
  widgetType: string
}

function DashboardWidgetRendererInner(props: DashboardWidgetRendererProps): React.ReactNode {
  const { widgetType, ...rest } = props
  const render = DASHBOARD_WIDGET_REGISTRY[widgetType as DashboardWidgetType]
  if (!render) return null
  return render(rest)
}

/** 부모(대시보드) 리렌더 시 동일 props면 슬롯별 재렌더 생략 */
export const DashboardWidgetRenderer = memo(DashboardWidgetRendererInner)
