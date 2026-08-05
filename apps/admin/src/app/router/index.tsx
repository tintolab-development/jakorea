import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from '@/widgets/layout'
import { HomePage } from '@/pages/home/page'
import { HeroBannersPage } from '@/pages/main/hero-banners/page'
import { StripBannersPage } from '@/pages/main/strip-banners/page'
import { SocialLinksPage } from '@/pages/main/social-links/page'
import { ContentsPage } from '@/pages/main/contents/page'
import { PopupsPage } from '@/pages/main/popups/page'
import { DesignSystemPage } from '@/pages/design-system/page'
import { PlaceholderPage } from '@/pages/placeholder/page'
import { getLeafMenuPaths } from '@/shared/config/menu-config'

const IMPLEMENTED_LEAF_PATHS = new Set([
  '/main/strip-banners',
  '/main/hero-banners',
  '/main/social-links',
  '/main/contents',
  '/main/popups',
])

/** LNB 리프 경로 → 빈 화면(플레이스홀더). 구현된 화면은 제외 */
const leafRoutes = getLeafMenuPaths()
  .filter(path => !IMPLEMENTED_LEAF_PATHS.has(path))
  .map(path => path.replace(/^\//, ''))
  .map(path => ({
    path,
    element: <PlaceholderPage />,
  }))

export const router = createBrowserRouter([
  {
    path: '/design-system',
    element: <DesignSystemPage />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'main/strip-banners', element: <StripBannersPage /> },
      { path: 'main/hero-banners', element: <HeroBannersPage /> },
      { path: 'main/social-links', element: <SocialLinksPage /> },
      { path: 'main/contents', element: <ContentsPage /> },
      { path: 'main/popups', element: <PopupsPage /> },
      ...leafRoutes,
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
