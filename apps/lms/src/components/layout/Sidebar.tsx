/**
 * 사이드바 컴포넌트
 * Phase 1.1: 네비게이션 메뉴
 */

import { NavLink } from 'react-router-dom'
import './Sidebar.css'

interface NavItem {
  path: string
  label: string
  icon?: string // 향후 아이콘 추가
}

const navItems: NavItem[] = [
  { path: '/', label: '대시보드' },
  { path: '/programs', label: '프로그램' },
  { path: '/applications', label: '신청 관리' },
  { path: '/schedules', label: '일정 관리' },
  { path: '/matchings', label: '매칭 관리' },
  { path: '/instructors', label: '강사 관리' },
  { path: '/schools', label: '학교 관리' },
  { path: '/sponsors', label: '스폰서 관리' },
  { path: '/settlements', label: '정산 관리' },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}




