/**
 * 대시보드 위젯 로딩 스켈레톤
 * 위젯 데이터 로딩 중 동일한 placeholder UI 재사용
 */

import { Card } from 'antd'
import { WidgetTitleWithHandle } from '@/features/dashboard/ui/widget-title-with-handle'

export interface DashboardWidgetSkeletonProps {
  loading: boolean
  height?: number
}

const DEFAULT_HEIGHT = 200

export function DashboardWidgetSkeleton({
  loading,
  height = DEFAULT_HEIGHT,
}: DashboardWidgetSkeletonProps) {
  return (
    <Card loading={loading} title={<WidgetTitleWithHandle />}>
      <div style={{ height }} />
    </Card>
  )
}
