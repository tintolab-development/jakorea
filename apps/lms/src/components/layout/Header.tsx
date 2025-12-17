/**
 * 헤더 컴포넌트
 * Phase 1.1: 기본 헤더 구조
 */

import './Header.css'

export default function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">JaKorea LMS</h1>
        <div className="header-actions">{/* 향후: 사용자 메뉴, 알림 등 추가 */}</div>
      </div>
    </header>
  )
}
