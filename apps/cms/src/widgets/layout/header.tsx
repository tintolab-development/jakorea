/**
 * 헤더 컴포넌트
 * Phase 1.1: Ant Design Header
 * 사이드바 네비게이션에 JAKOREA 로고 표시
 */

import { Layout } from 'antd'
import { useNavigate } from 'react-router-dom'
import './header.css'

const { Header: AntHeader } = Layout

// 로고 이미지 경로 (public 폴더 사용 시)
const LOGO_PATH = '/logo/JA_New_Brand_Logo_01.webp'

export function Header() {
  const navigate = useNavigate()

  return (
    <AntHeader className="app-header sidebar-header">
      <div className="sidebar-logo-container" onClick={() => navigate('/')}>
        <img src={LOGO_PATH} alt="JA Korea" className="sidebar-logo" />
      </div>
    </AntHeader>
  )
}
