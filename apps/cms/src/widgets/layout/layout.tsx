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
import { discardMemberDetailReturnOutsidePrograms } from '@/features/user/detail/lib/member-detail-program-navigation-return'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { canAccessProgram } from '@/features/permission-request/lib/program-acl'
import { canAccessPath } from '@/shared/config/menu-config'
import { ComingSoonPage } from '@/pages/error/coming-soon-page'
import {
  canAdminAction,
  canNavigateBackInAppHistory,
  isPermissionRequestsPath,
  isMemberPermissionSettingsPath,
  isSecurityLogPath,
  isSettlementItemSettingsPath,
  isTemplateManagementPath,
  resolveAdminRoleCodeFromUser,
  showAdminAccessDeniedAlert,
} from '@/shared/lib/admin-role-policy'
import {
  canAccessAccountPayments,
  isAccountPaymentsPath,
} from '@/shared/lib/account-payments-access'
import { ProgramDetailAccessGuard } from '@/features/program/shared/ui/program-detail-access-guard'
import { ProgramDetailReadOnlyProvider } from '@/features/program/shared/ui/program-detail-read-only-provider'
import { Sidebar } from './sidebar'
import { MainHeader } from './main-header'
import './layout.css'

const { Content } = AntLayout

function LayoutContent() {
  const location = useLocation()
  useEffect(() => {
    discardMemberDetailReturnOutsidePrograms(location.pathname)
  }, [location.pathname])
  const navigate = useNavigate()
  const params = useParams()
  const { user } = useAuthStore()
  const roleCode = resolveAdminRoleCodeFromUser(user)
  const securityLogBlocked =
    Boolean(user) &&
    isSecurityLogPath(location.pathname) &&
    !canAdminAction({ roleCode, action: 'view', screen: 'security-logs' })
  const permissionSettingsBlocked =
    Boolean(user) &&
    isMemberPermissionSettingsPath(location.pathname) &&
    !canAdminAction({ roleCode, action: 'view', screen: 'permission-settings' })
  const permissionRequestsBlocked =
    Boolean(user) &&
    isPermissionRequestsPath(location.pathname) &&
    !canAdminAction({ roleCode, action: 'view', screen: 'admin-permission-approval' })
  const templateManagementBlocked =
    Boolean(user) &&
    isTemplateManagementPath(location.pathname) &&
    !canAdminAction({ roleCode, action: 'view', screen: 'template-management' })
  const settlementItemSettingsBlocked =
    Boolean(user) &&
    isSettlementItemSettingsPath(location.pathname) &&
    !canAdminAction({ roleCode, action: 'view', screen: 'settlement-item-settings' })
  const accountPaymentsBlocked =
    Boolean(user) && isAccountPaymentsPath(location.pathname) && !canAccessAccountPayments(user)
  const screenAccessBlocked =
    securityLogBlocked ||
    permissionSettingsBlocked ||
    permissionRequestsBlocked ||
    templateManagementBlocked ||
    settlementItemSettingsBlocked ||
    accountPaymentsBlocked
  const deniedLogPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!screenAccessBlocked) {
      deniedLogPathRef.current = null
      return
    }
    if (deniedLogPathRef.current === location.pathname) return
    deniedLogPathRef.current = location.pathname
    const leaveBlockedScreen = () => {
      if (typeof window !== 'undefined' && canNavigateBackInAppHistory(window.history.state)) {
        navigate(-1)
        return
      }
      navigate('/', { replace: true })
    }
    const shown = showAdminAccessDeniedAlert({ onConfirm: leaveBlockedScreen })
    if (!shown) leaveBlockedScreen()
  }, [screenAccessBlocked, navigate, location.pathname])

  const pathActor = user
    ? { role: user.role, adminLevel: user.adminLevel, roleCode: user.roleCode }
    : null
  if (
    user &&
    location.pathname !== '/' &&
    !isAccountPaymentsPath(location.pathname) &&
    !canAccessPath(location.pathname, pathActor)
  ) {
    return (
      <ComingSoonPage
        title="접근 권한이 없습니다"
        description="이 페이지에 접근할 권한이 없습니다. 해당 기능은 현재 준비 중입니다."
      />
    )
  }

  if (screenAccessBlocked) {
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
      <ProgramDetailAccessGuard />
      <ProgramDetailReadOnlyProvider>
        <Outlet />
      </ProgramDetailReadOnlyProvider>
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
