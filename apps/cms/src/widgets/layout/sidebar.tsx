/**
 * 사이드바 컴포넌트
 * Phase 1.1: Ant Design Menu를 활용한 네비게이션
 * Phase 4.2.1: 권한별 메뉴 구성 적용
 * 타이틀을 사이드바 최상단에 배치
 */

import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getMenuItemsByRole } from '@/shared/config/menu-config'
import './sidebar.css'
import { Header } from './header'

const { Sider } = Layout

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  // 권한별 메뉴 필터링
  const menuItems = useMemo(() => {
    return getMenuItemsByRole(user?.role || null)
  }, [user?.role])

  // 현재 경로에 따라 열린 서브메뉴 결정
  const openKeys = useMemo(() => {
    const path = location.pathname
    // 정산 관리 관련 경로인 경우 서브메뉴 열기
    if (path.startsWith('/settlements')) {
      return ['settlements-group']
    }
    return []
  }, [location.pathname])

  const [controlledOpenKeys, setControlledOpenKeys] = useState<string[]>(openKeys)

  return (
    <Sider width={200} style={{ background: '#fff', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          openKeys={controlledOpenKeys.length > 0 ? controlledOpenKeys : openKeys}
          onOpenChange={setControlledOpenKeys}
          style={{ flex: 1, borderRight: 0, overflowY: 'auto', overflowX: 'hidden' }}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </div>
    </Sider>
  )
}
