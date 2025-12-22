/**
 * 사이드바 컴포넌트
 * Phase 1.1: Ant Design Menu를 활용한 네비게이션
 * 타이틀을 사이드바 최상단에 배치
 */

import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useMemo } from 'react'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined,
  BookOutlined,
  FileTextOutlined,
  CalendarOutlined,
  TeamOutlined,
  UserOutlined,
  BankOutlined,
  ShopOutlined,
  DollarOutlined,
  HistoryOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons'
import './sidebar.css'
import { Header } from './header'

const { Sider } = Layout

const menuItems: MenuProps['items'] = [
  { key: '/', label: '대시보드', icon: <DashboardOutlined /> },
  { key: '/programs', label: '프로그램', icon: <BookOutlined /> },
  { key: '/applications', label: '신청 관리', icon: <FileTextOutlined /> },
  { key: '/schedules', label: '일정 관리', icon: <CalendarOutlined /> },
  { key: '/matchings', label: '매칭 관리', icon: <TeamOutlined /> },
  { key: '/instructors', label: '강사 관리', icon: <UserOutlined /> },
  { key: '/schools', label: '학교 관리', icon: <BankOutlined /> },
  { key: '/sponsors', label: '스폰서 관리', icon: <ShopOutlined /> },
  {
    key: 'settlements-group',
    label: '정산 관리',
    icon: <DollarOutlined />,
    children: [
      { key: '/settlements', label: '정산 목록' },
      { key: '/settlements/monthly', label: '월별 정산 관리' },
      { key: '/settlements/calculation-settings', label: '산출 로직 설정' },
    ],
  },
  { key: '/mypage', label: '마이페이지', icon: <UserSwitchOutlined /> },
  { key: '/histories', label: '이력 목록', icon: <HistoryOutlined /> },
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

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
    <Sider width={200} style={{ background: '#fff' }}>
      <Header />
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        openKeys={controlledOpenKeys.length > 0 ? controlledOpenKeys : openKeys}
        onOpenChange={setControlledOpenKeys}
        style={{ height: 'calc(100% - 64px)', borderRight: 0 }}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  )
}
