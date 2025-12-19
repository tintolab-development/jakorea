/**
 * 사이드바 컴포넌트
 * Phase 1.1: Ant Design Menu를 활용한 네비게이션
 * 타이틀을 사이드바 최상단에 배치
 */

import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
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
} from '@ant-design/icons'
import './sidebar.css'
import { Header } from './header'

const { Sider } = Layout

const menuItems = [
  { key: '/', label: '대시보드', icon: <DashboardOutlined /> },
  { key: '/programs', label: '프로그램', icon: <BookOutlined /> },
  { key: '/applications', label: '신청 관리', icon: <FileTextOutlined /> },
  { key: '/schedules', label: '일정 관리', icon: <CalendarOutlined /> },
  { key: '/matchings', label: '매칭 관리', icon: <TeamOutlined /> },
  { key: '/instructors', label: '강사 관리', icon: <UserOutlined /> },
  { key: '/schools', label: '학교 관리', icon: <BankOutlined /> },
  { key: '/sponsors', label: '스폰서 관리', icon: <ShopOutlined /> },
  { key: '/settlements', label: '정산 관리', icon: <DollarOutlined /> },
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Sider width={200} style={{ background: '#fff' }}>
      <Header />
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        style={{ height: 'calc(100% - 64px)', borderRight: 0 }}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  )
}
