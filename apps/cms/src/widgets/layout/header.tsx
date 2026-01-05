/**
 * 헤더 컴포넌트
 * Phase 1.1: Ant Design Header
 * Phase 4.1.1: 사용자 정보 및 로그아웃 버튼 추가
 */

import { Layout, Typography, Button, Dropdown } from 'antd'
import { useNavigate } from 'react-router-dom'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { RoleBadge } from '@/shared/ui'
import type { MenuProps } from 'antd'
import './header.css'

const { Header: AntHeader } = Layout
const { Text } = Typography

// 로고 이미지 경로 (public 폴더 사용 시)
const LOGO_PATH = '/logo/JA_New_Brand_Logo_01.webp'

export function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      label: '로그아웃',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ]

  return (
    <AntHeader className="app-header sidebar-header">
      <div className="sidebar-logo-container" onClick={() => navigate('/')}>
        <img src={LOGO_PATH} alt="JA Korea" className="sidebar-logo" />
      </div>
      {user && (
        <div className="header-user-section">
          <div className="header-user-info">
            <div className="header-user-name-row">
              <div className="header-user-icon">
                <UserOutlined />
              </div>
              <div className="header-user-details">
                <Text strong className="header-user-name">
                  {user.name}
                </Text>
                <Text type="secondary" className="header-user-email">
                  {user.email}
                </Text>
              </div>
            </div>
            <div className="header-user-role-badge">
              <RoleBadge role={user.role} size="small" variant="tag" />
            </div>
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomLeft" trigger={['click']}>
            <Button type="text" className="header-account-button">
              계정 관리
            </Button>
          </Dropdown>
        </div>
      )}
    </AntHeader>
  )
}
