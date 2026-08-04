import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from '@/widgets/layout'
import { HomePage } from '@/pages/home/page'
import { PlaceholderPage } from '@/pages/placeholder/page'
import { getLeafMenuPaths } from '@/shared/config/menu-config'

/** LNB 리프 경로 → 빈 화면(플레이스홀더). 기능 화면은 이후 Phase에서 연결 */
const leafRoutes = getLeafMenuPaths()
  .map(path => path.replace(/^\//, ''))
  .map(path => ({
    path,
    element: <PlaceholderPage />,
  }))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      ...leafRoutes,
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
