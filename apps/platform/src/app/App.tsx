import { AppLayout } from '@/widgets/layout'
import { routes } from './router'

export function App() {
  const currentPath = window.location.pathname
  const currentRoute = routes.find((route) => route.path === currentPath) ?? routes[0]

  return (
    <AppLayout>
      {currentRoute.element}
    </AppLayout>
  )
}
