import type { ReactNode } from 'react'
import {
  FindEmailCompletePage,
  FindEmailPage,
  FindPasswordCompletePage,
  FindPasswordPage,
  FindPasswordResetPage,
  RequiredPage,
  SignInPage,
  SignUpCompletePage,
  SignUpPage,
  SignUpSocialConnectCompletePage,
  SignUpSocialConnectErrorPage,
  SignUpSocialConnectPage,
  SocialErrorPage,
} from '@/pages/auth'
import { HomePage } from '@/pages/home'
import { TestPage } from '@/pages/test'

type RouteConfig = {
  path: string
  element: ReactNode
}

/** 라우터 도입 전 임시 라우트 정의. react-router 추가 시 이 파일에서 구성한다. */
export const routes: RouteConfig[] = [
  { path: '/', element: <HomePage /> },
  { path: '/auth/required', element: <RequiredPage /> },
  { path: '/auth/sign-in', element: <SignInPage /> },
  { path: '/auth/find-email', element: <FindEmailPage /> },
  { path: '/auth/find-email/complete', element: <FindEmailCompletePage /> },
  { path: '/auth/find-password', element: <FindPasswordPage /> },
  { path: '/auth/find-password/reset', element: <FindPasswordResetPage /> },
  { path: '/auth/find-password/complete', element: <FindPasswordCompletePage /> },
  { path: '/auth/sign-up', element: <SignUpPage /> },
  { path: '/auth/sign-up/complete', element: <SignUpCompletePage /> },
  { path: '/auth/sign-up/social-connect', element: <SignUpSocialConnectPage /> },
  {
    path: '/auth/sign-up/social-connect/complete',
    element: <SignUpSocialConnectCompletePage />,
  },
  {
    path: '/auth/sign-up/social-connect/error',
    element: <SignUpSocialConnectErrorPage />,
  },
  { path: '/auth/social/error', element: <SocialErrorPage /> },
  { path: '/test', element: <TestPage /> },
]
