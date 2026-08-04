import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from '@/widgets/layout'
import { HomePage } from '@/pages/home/page'
import { PlaceholderPage } from '@/pages/placeholder/page'
import { HeroBannersPage } from '@/pages/main/hero-banners/page'
import { PopupsPage } from '@/pages/main/popups/page'
import { StripBannersPage } from '@/pages/main/strip-banners/page'
import { SocialLinksPage } from '@/pages/main/social-links/page'
import { ContentsPage } from '@/pages/main/contents/page'
import { JaKoreaIntroPage } from '@/pages/ja-korea/intro/page'
import { GlobalValuePage } from '@/pages/ja-korea/global-value/page'
import { WorldwidePage } from '@/pages/ja-korea/worldwide/page'
import { getLeafMenuPaths } from '@/shared/config/menu-config'

const IMPLEMENTED_PATHS = new Set([
  'main/hero-banners',
  'main/popups',
  'main/strip-banners',
  'main/social-links',
  'main/contents',
  'ja-korea/intro',
  'ja-korea/global-value',
  'ja-korea/worldwide',
])

const leafRoutes = getLeafMenuPaths()
  .map(path => path.replace(/^\//, ''))
  .filter(path => !IMPLEMENTED_PATHS.has(path))
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
      { path: 'main/hero-banners', element: <HeroBannersPage /> },
      { path: 'main/popups', element: <PopupsPage /> },
      { path: 'main/strip-banners', element: <StripBannersPage /> },
      { path: 'main/social-links', element: <SocialLinksPage /> },
      { path: 'main/contents', element: <ContentsPage /> },
      { path: 'ja-korea/intro', element: <JaKoreaIntroPage /> },
      { path: 'ja-korea/global-value', element: <GlobalValuePage /> },
      { path: 'ja-korea/worldwide', element: <WorldwidePage /> },
      ...leafRoutes,
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
