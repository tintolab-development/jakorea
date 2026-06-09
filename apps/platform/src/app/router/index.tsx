import type { ReactNode } from 'react'
import { HomePage } from '@/pages/home'

type RouteConfig = {
  path: string
  element: ReactNode
}

/** 라우터 도입 전 임시 라우트 정의. react-router 추가 시 이 파일에서 구성한다. */
export const routes: RouteConfig[] = [{ path: '/', element: <HomePage /> }]
