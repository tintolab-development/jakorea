import type { ReactNode } from 'react'
import { SignInPage, SignUpPage } from '@/pages/auth'
import { HomePage } from '@/pages/home'
import { TestPage } from '@/pages/test'

type RouteConfig = {
  path: string
  element: ReactNode
}

/** 라우터 도입 전 임시 라우트 정의. react-router 추가 시 이 파일에서 구성한다. */
export const routes: RouteConfig[] = [
  { path: '/', element: <HomePage /> },
  { path: '/auth/sign-in', element: <SignInPage /> },
  { path: '/auth/sign-up', element: <SignUpPage /> },
  { path: '/test', element: <TestPage /> },
]
