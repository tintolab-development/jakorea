/**
 * 사이드바 상단 로고
 */

import { Layout } from 'antd'
import { useNavigate } from 'react-router-dom'
import logoImage from '@/assets/images/logo/ja_korea_logo.png'
import './header.css'

const { Header: AntHeader } = Layout

export function Header() {
  const navigate = useNavigate()

  return (
    <AntHeader className="app-header sidebar-header">
      <div className="sidebar-logo-container" onClick={() => navigate('/')}>
        <img
          src={logoImage}
          style={{ width: '182px', height: 'auto' }}
          alt="JA Korea"
          className="sidebar-logo"
        />
      </div>
    </AntHeader>
  )
}
