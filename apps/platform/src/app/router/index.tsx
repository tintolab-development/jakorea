import type { ReactNode } from 'react'
import {
  RequiredPage,
  SignInPage,
  SignUpCompletePage,
  SignUpPage,
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
  { path: '/auth/sign-up', element: <SignUpPage /> },
  { path: '/auth/sign-up/complete', element: <SignUpCompletePage /> },
  { path: '/auth/sign-up/social-connect', element: <SignUpSocialConnectPage /> },
  { path: '/auth/social/error', element: <SocialErrorPage /> },
  { path: '/test', element: <TestPage /> },
]
