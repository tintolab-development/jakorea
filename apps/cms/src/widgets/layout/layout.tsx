/**
 * 기본 레이아웃 컴포넌트
 * Phase 1.1: Ant Design Layout 활용
 * 타이틀을 사이드바 최상단으로 이동
 * 헤더 제거 완료
 */

import { Layout as AntLayout } from 'antd'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import './layout.css'

const { Content } = AntLayout

export function Layout() {
  return (
    <AntLayout className="app-layout" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <AntLayout>
        <Content className="layout-content">
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}






