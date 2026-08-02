import type { ReactNode } from 'react'
import {
  AdminRegisteredBirthPage,
  AdminRegisteredChangePasswordPage,
  AdminRegisteredCompletePage,
  AdminRegisteredConfirmPage,
  AdminRegisteredEditPage,
  AdminRegisteredIdentityPage,
  AdminRegisteredNoticePage,
  FindEmailCompletePage,
  FindEmailPage,
  FindPasswordCompletePage,
  FindPasswordPage,
  FindPasswordResetPage,
  RequiredPage,
  SignInPage,
  SignUpCompletePage,
  SignUpPage,
  SignUpIdentityCallbackPage,
  SignUpGuardianIdentityCallbackPage,
  SignUpIdentityMockNicePage,
  SignUpGuardianIdentityMockNicePage,
  SignUpSocialConnectCompletePage,
  SignUpSocialConnectErrorPage,
  SignUpSocialConnectPage,
  SocialErrorPage,
} from '@/pages/auth'
import { HomePage } from '@/pages/home'
import { MypageHomePage } from '@/pages/mypage'
import {
  ProgramApplyCompletePage,
  ProgramApplyPage,
  ProgramDetailPage,
  ProgramsPage,
} from '@/pages/programs'
import { DesignSystemPage } from '@/pages/design-system'
import { YoutubeEmbedPage } from '@/pages/youtube-embed'
import { parseProgramRoute } from '@/features/program'
import type { LayoutVariant } from '@/widgets/layout/layout-variant'

export type RouteConfig = {
  path: string
  element: ReactNode
  layout?: LayoutVariant
}

function authRoute(path: string, element: ReactNode): RouteConfig {
  return { path, element, layout: 'auth' }
}

/** 라우터 도입 전 임시 라우트 정의. react-router 추가 시 handle.layout 등으로 이전한다. */
const staticRoutes: RouteConfig[] = [
  { path: '/', element: <HomePage /> },
  authRoute('/auth/required', <RequiredPage />),
  authRoute('/auth/sign-in', <SignInPage />),
  authRoute('/auth/admin-registered/notice', <AdminRegisteredNoticePage />),
  authRoute('/auth/admin-registered/birth', <AdminRegisteredBirthPage />),
  authRoute('/auth/admin-registered/identity', <AdminRegisteredIdentityPage />),
  authRoute('/auth/admin-registered/change-password', <AdminRegisteredChangePasswordPage />),
  authRoute('/auth/admin-registered/confirm', <AdminRegisteredConfirmPage />),
  authRoute('/auth/admin-registered/edit', <AdminRegisteredEditPage />),
  authRoute('/auth/admin-registered/complete', <AdminRegisteredCompletePage />),
  authRoute('/auth/find-email', <FindEmailPage />),
  authRoute('/auth/find-email/complete', <FindEmailCompletePage />),
  authRoute('/auth/find-password', <FindPasswordPage />),
  authRoute('/auth/find-password/reset', <FindPasswordResetPage />),
  authRoute('/auth/find-password/complete', <FindPasswordCompletePage />),
  authRoute('/auth/sign-up', <SignUpPage />),
  { path: '/auth/sign-up/identity/callback', element: <SignUpIdentityCallbackPage />, layout: 'full' },
  { path: '/auth/sign-up/identity/mock', element: <SignUpIdentityMockNicePage />, layout: 'full' },
  {
    path: '/auth/sign-up/guardian-identity/callback',
    element: <SignUpGuardianIdentityCallbackPage />,
    layout: 'full',
  },
  {
    path: '/auth/sign-up/guardian-identity/mock',
    element: <SignUpGuardianIdentityMockNicePage />,
    layout: 'full',
  },
  authRoute('/auth/sign-up/complete', <SignUpCompletePage />),
  authRoute('/auth/sign-up/social-connect', <SignUpSocialConnectPage />),
  authRoute('/auth/sign-up/social-connect/complete', <SignUpSocialConnectCompletePage />),
  authRoute('/auth/sign-up/social-connect/error', <SignUpSocialConnectErrorPage />),
  authRoute('/auth/social/error', <SocialErrorPage />),
  { path: '/mypage', element: <MypageHomePage />, layout: 'mypage' },
  { path: '/design-system', element: <DesignSystemPage />, layout: 'full' },
  /** 하위 호환 — 기존 북마크용 */
  { path: '/test', element: <DesignSystemPage />, layout: 'full' },
  { path: '/dev/youtube', element: <YoutubeEmbedPage />, layout: 'full' },
]

export const routes = staticRoutes

export function resolveLayout(pathname: string): LayoutVariant {
  const staticRoute = staticRoutes.find(route => route.path === pathname)
  if (staticRoute?.layout) {
    return staticRoute.layout
  }

  if (pathname === '/mypage' || pathname.startsWith('/mypage/')) {
    return 'mypage'
  }

  if (parseProgramRoute(pathname)) {
    return 'default'
  }

  return staticRoute?.layout ?? 'default'
}

export function resolveRoute(pathname: string): RouteConfig {
  const staticRoute = staticRoutes.find(route => route.path === pathname)
  if (staticRoute) {
    return staticRoute
  }

  const programRoute = parseProgramRoute(pathname)
  if (programRoute) {
    switch (programRoute.name) {
      case 'list':
        return { path: pathname, element: <ProgramsPage />, layout: 'default' }
      case 'detail':
        return { path: pathname, element: <ProgramDetailPage />, layout: 'default' }
      case 'apply':
        return { path: pathname, element: <ProgramApplyPage />, layout: 'default' }
      case 'complete':
        return { path: pathname, element: <ProgramApplyCompletePage />, layout: 'default' }
    }
  }

  return staticRoutes[0]
}
