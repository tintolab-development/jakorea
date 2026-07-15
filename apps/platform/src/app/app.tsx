import { AppLayout } from '@/widgets/layout'
import { resolveRoute } from './router'

export function App() {
  const currentPath = window.location.pathname
  const currentRoute = resolveRoute(currentPath)

  return (
    <AppLayout layout={currentRoute.layout ?? 'default'}>
      {currentRoute.element}
    </AppLayout>
  )
}
