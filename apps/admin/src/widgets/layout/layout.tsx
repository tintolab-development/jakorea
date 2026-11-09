/**
 * 기본 레이아웃 — CMS 셸과 동일 구조 (LNB + 상단 GNB, auth/ACL 이후 연동)
 */

import { useEffect, useRef } from 'react'
import { Layout as AntLayout } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useHomepageLogAccess } from '@/features/auth/hooks/use-homepage-log-access'
import {
  HOMEPAGE_LOG_ACCESS_DENIED_ALERT,
  isHomepageLogPath,
} from '@/shared/lib/homepage-log-access'
import { cmsAlertModal } from '@/shared/ui'
import { HomepageActionGuard } from './homepage-action-guard'
import { Sidebar } from './sidebar'
import { MainHeader } from './main-header'
import './layout.css'

const { Content } = AntLayout

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const contentRef = useRef<HTMLElement>(null)
  const logAccess = useHomepageLogAccess()
  // 권한 설정 V1.2: 로그 관리 URL 직접 진입도 화면을 그리기 전에 막는다(Master 전용).
  const onLogPath = isHomepageLogPath(location.pathname)
  const logScreenBlocked = onLogPath && logAccess.status === 'denied'
  // 본인 정보 확인 전에는 로그 화면을 그리지 않는다(로그 API 403 화면이 먼저 보이지 않게).
  const logScreenPending = onLogPath && logAccess.status === 'pending'
  const deniedPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!logScreenBlocked) {
      deniedPathRef.current = null
      return
    }
    if (deniedPathRef.current === location.pathname) return
    deniedPathRef.current = location.pathname
    cmsAlertModal.show({
      ...HOMEPAGE_LOG_ACCESS_DENIED_ALERT,
      onConfirm: () => {
        const idx = (window.history.state as { idx?: unknown } | null)?.idx
        if (typeof idx === 'number' && idx > 0) navigate(-1)
        else navigate('/', { replace: true })
      },
    })
  }, [location.pathname, logScreenBlocked, navigate])

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <AntLayout className="app-layout" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <AntLayout>
        <MainHeader />
        <Content ref={contentRef} className="layout-content">
          <div className="layout-content-outlet">
            {logScreenBlocked || logScreenPending ? null : (
              <HomepageActionGuard>
                <Outlet />
              </HomepageActionGuard>
            )}
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
