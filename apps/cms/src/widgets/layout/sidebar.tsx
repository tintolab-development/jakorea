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
    const keys: string[] = []

    // 관리자용 정산 관리
    if (path.startsWith('/settlements') && !path.startsWith('/settlements/my')) {
      keys.push('settlements-group')
    }

    // 마이페이지 관련
    if (
      path.startsWith('/mypage') ||
      path.startsWith('/histories') ||
      path.startsWith('/programs/my') ||
      path.startsWith('/programs/favorites') ||
      path.startsWith('/settlements/my')
    ) {
      keys.push('mypage-group')

      // 개인정보 관리 (개인정보 + 강사 이력)
      if (path.startsWith('/mypage/profile') || path.startsWith('/histories')) {
        keys.push('personal-info-group')
      }

      // 프로그램 관리
      if (path.startsWith('/programs/my') || path.startsWith('/programs/favorites')) {
        keys.push('program-management-group')
      }

      // 정산 이력/현황 관리
      if (path.startsWith('/settlements/my')) {
        keys.push('settlement-history-group')
      }
    }

    // 사용자 봉사단 관련 메뉴 (VOLUNTEER 역할일 때)
    if (user?.role === 'VOLUNTEER') {
      if (
        path.startsWith('/mypage') ||
        path.startsWith('/volunteers/my') ||
        path.startsWith('/programs/favorites')
      ) {
        keys.push('volunteer-mypage-group')

        // 프로그램관리
        if (path.startsWith('/volunteers/my/programs') || path.startsWith('/programs/favorites')) {
          keys.push('volunteer-program-mgmt')
        }

        // 봉사단 활동 관리
        if (path.startsWith('/volunteers/my/schedules') || path.startsWith('/volunteers/my/histories')) {
          keys.push('volunteer-activity-mgmt')
        }
      }
    }

    return keys
  }, [location.pathname, user?.role])

  const [controlledOpenKeys, setControlledOpenKeys] = useState<string[]>(openKeys)

  return (
    <Sider width={220} className="sidebar-container">
      <Header />
      <div className="sidebar-menu-wrapper">
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          openKeys={controlledOpenKeys.length > 0 ? controlledOpenKeys : openKeys}
          onOpenChange={setControlledOpenKeys}
          className="sidebar-menu"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </div>
    </Sider>
  )
}
