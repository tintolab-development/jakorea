/**
 * 기본 레이아웃 컴포넌트
 * Phase 1.1: Ant Design Layout 활용
 * 타이틀을 사이드바 최상단으로 이동
 * Phase: 유저 로그인 정보를 사이드바에서 헤더로 이동
 */

import { Layout as AntLayout } from 'antd'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { MainHeader } from './main-header'
import './layout.css'

const { Content } = AntLayout

export function Layout() {
  return (
    <AntLayout className="app-layout" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <AntLayout>
        <MainHeader />
        <Content className="layout-content">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
