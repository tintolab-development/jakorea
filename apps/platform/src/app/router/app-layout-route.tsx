import { Outlet } from 'react-router-dom'
import { AppLayout } from '@/widgets/layout'
import type { HeaderTheme } from '@/widgets/layout/header-theme'
import type { LayoutVariant } from '@/widgets/layout/layout-variant'

type AppLayoutRouteProps = {
  layout: LayoutVariant
  headerTheme?: HeaderTheme
}

export function AppLayoutRoute({ layout, headerTheme }: AppLayoutRouteProps) {
  return (
    <AppLayout layout={layout} headerTheme={headerTheme}>
      <Outlet />
    </AppLayout>
  )
}
