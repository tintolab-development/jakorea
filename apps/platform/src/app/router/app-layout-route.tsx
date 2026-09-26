import { Outlet } from 'react-router-dom'
import { AnalyticsTracker } from '@/features/analytics'
import { AppLayout } from '@/widgets/layout'
import type { HeaderTheme } from '@/widgets/layout/header-theme'
import type { LayoutVariant } from '@/widgets/layout/layout-variant'

const PUBLIC_ANALYTICS_LAYOUTS = new Set<LayoutVariant>([
  'home',
  'default',
  'hero',
  'introduction',
  'support',
])

type AppLayoutRouteProps = {
  layout: LayoutVariant
  headerTheme?: HeaderTheme
}

export function AppLayoutRoute({ layout, headerTheme }: AppLayoutRouteProps) {
  return (
    <AppLayout layout={layout} headerTheme={headerTheme}>
      {PUBLIC_ANALYTICS_LAYOUTS.has(layout) ? <AnalyticsTracker /> : null}
      <Outlet />
    </AppLayout>
  )
}
