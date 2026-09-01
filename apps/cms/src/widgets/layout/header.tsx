/**
 * 헤더 컴포넌트 (사이드바 상단)
 * Phase 1.1: Ant Design Header
 * 유저 로그인 정보는 MainHeader(콘텐츠 상단)로 이동, 여기서는 로고만 표시
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
