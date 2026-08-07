import { Outlet } from 'react-router-dom'
import { AppLayout } from '@/widgets/layout'
import type { LayoutVariant } from '@/widgets/layout/layout-variant'

type AppLayoutRouteProps = {
  layout: LayoutVariant
}

export function AppLayoutRoute({ layout }: AppLayoutRouteProps) {
  return (
    <AppLayout layout={layout}>
      <Outlet />
    </AppLayout>
  )
}
