/**
 * 대시보드 위젯 청크 로딩용 Suspense 래퍼.
 * fallback은 기존 데이터 로딩 스켈레톤과 동일 UI.
 */

import { Suspense, type ReactNode } from 'react'
import { DashboardWidgetSkeleton } from '@/features/dashboard/ui/dashboard-widget-skeleton'

export function LazyWidget({
  children,
  height = 200,
}: {
  children: ReactNode
  height?: number
}) {
  return (
    <Suspense fallback={<DashboardWidgetSkeleton loading height={height} />}>
      {children}
    </Suspense>
  )
}
