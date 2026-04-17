/**
 * 위젯 타입별 렌더링 (Dashboard 비즈니스 로직 유지, 페이지 컴포넌트 경량화)
 */

import type { DashboardWidgetType } from '@/shared/config/dashboard-config'
import {
  DASHBOARD_WIDGET_REGISTRY,
  type DashboardWidgetRenderProps,
} from '@/features/dashboard/ui/dashboard-widget-registry'

export interface DashboardWidgetRendererProps extends DashboardWidgetRenderProps {
  /** 레이아웃·DnD orderedIds와 동일 (보통 DashboardWidgetType) */
  widgetType: string
}

export function DashboardWidgetRenderer(props: DashboardWidgetRendererProps): React.ReactNode {
  const { widgetType, ...rest } = props
  const render = DASHBOARD_WIDGET_REGISTRY[widgetType as DashboardWidgetType]
  if (!render) return null
  return render(rest)
}
