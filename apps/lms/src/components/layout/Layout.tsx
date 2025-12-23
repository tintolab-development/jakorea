/**
 * 기본 레이아웃 컴포넌트
 * Phase 1.1: Header, Sidebar, Main Content 레이아웃
 */

import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import './Layout.css'

export default function Layout() {
  return (
    <div className="layout">
      <Header />
      <div className="layout-body">
        <Sidebar />
        <main className="layout-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}





