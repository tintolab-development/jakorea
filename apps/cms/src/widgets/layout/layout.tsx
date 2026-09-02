/**
 * 기본 레이아웃 컴포넌트
 * Phase 1.1: Ant Design Layout 활용
 * 타이틀을 사이드바 최상단으로 이동
 * Phase: 유저 로그인 정보를 사이드바에서 헤더로 이동
 * 접근 권한이 없는 경로는 콘텐츠 영역에서만 Coming Soon 표시 (LNB·헤더 유지)
 */

import { Suspense, useEffect, useRef } from 'react'
import { Layout as AntLayout } from 'antd'
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { RouterLoadingFallback } from '@/app/router/loading-fallback'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canAccessProgram } from '@/features/permission-request/lib/program-acl'
import { canAccessPath } from '@/shared/config/menu-config'
import { ComingSoonPage } from '@/pages/error/coming-soon-page'
import {
  canAdminAction,
  isSecurityLogPath,
  resolveAdminRoleCodeFromUser,
  showAdminAccessDeniedAlert,
} from '@/shared/lib/admin-role-policy'
import { Sidebar } from './sidebar'
import { MainHeader } from './main-header'
import './layout.css'

const { Content } = AntLayout

function LayoutContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const { user } = useAuthStore()
  const roleCode = resolveAdminRoleCodeFromUser(user)
  const securityLogBlocked =
    Boolean(user) &&
    isSecurityLogPath(location.pathname) &&
    !canAdminAction({ roleCode, action: 'view', screen: 'security-logs' })
  const deniedLogPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!securityLogBlocked) {
      deniedLogPathRef.current = null
      return
    }
    if (deniedLogPathRef.current === location.pathname) return
    deniedLogPathRef.current = location.pathname
    showAdminAccessDeniedAlert()
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/', { replace: true })
  }, [securityLogBlocked, navigate, location.pathname])

  const pathActor = user ? { role: user.role, adminLevel: user.adminLevel } : null
  if (user && location.pathname !== '/' && !canAccessPath(location.pathname, pathActor)) {
    return (
      <ComingSoonPage
        title="접근 권한이 없습니다"
        description="이 페이지에 접근할 권한이 없습니다. 해당 기능은 현재 준비 중입니다."
      />
    )
  }

  if (securityLogBlocked) {
    return null
  }

  const programId = params.id || params.programId
  if (user && programId && location.pathname.includes('/programs/')) {
    const action = location.pathname.includes('/edit') ? 'EDIT' : 'VIEW'
    if (!canAccessProgram(user, programId, action)) {
      return (
        <ComingSoonPage
          title="접근 권한이 없습니다"
          description="이 프로그램에 접근할 권한이 없습니다. 해당 기능은 현재 준비 중입니다."
        />
      )
    }
  }

  return (
    <Suspense fallback={<RouterLoadingFallback />}>
      <Outlet />
    </Suspense>
  )
}

export function Layout() {
  const location = useLocation()
  const contentRef = useRef<HTMLElement>(null)
  const isTemplatesPath = location.pathname.startsWith('/templates')

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <AntLayout className="app-layout">
      <Sidebar />
      <AntLayout>
        <MainHeader />
        <Content
          ref={contentRef}
          className={`layout-content ${isTemplatesPath ? 'layout-content--templates' : ''}`}
        >
          <div className="layout-content-outlet">
            <LayoutContent />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
