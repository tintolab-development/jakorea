/**
 * 기본 레이아웃 — CMS 셸과 동일 구조 (LNB + 상단 GNB, auth/ACL 이후 연동)
 */

import { useEffect, useRef } from 'react'
import { Layout as AntLayout } from 'antd'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { MainHeader } from './main-header'
import './layout.css'

const { Content } = AntLayout

export function Layout() {
  const location = useLocation()
  const contentRef = useRef<HTMLElement>(null)

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
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
