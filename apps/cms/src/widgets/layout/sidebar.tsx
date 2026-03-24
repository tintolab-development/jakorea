/** LNB: `getMenuItemsByRole` 결과를 Ant Design Menu로 렌더링. 헤더는 상단 고정. */

import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getMenuItemsByRole } from '@/shared/config/menu-config'
import './sidebar.css'
import { Header } from './header'

const { Sider } = Layout

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  const menuItems = useMemo(() => {
    return getMenuItemsByRole(user?.role || null, user)
  }, [user?.role, user])

  const openKeys = useMemo(() => {
    const path = location.pathname
    const keys: string[] = []

    // ADMIN: 프로그램 관리 그룹 (/programs/education, /programs/:id 등)
    const isProgramMgmt =
      user?.role === 'ADMIN' &&
      path.startsWith('/programs') &&
      !path.startsWith('/programs/my') &&
      !path.startsWith('/programs/favorites')
    if (isProgramMgmt) {
      keys.push('programs-group')
    }

    if (user?.role === 'ADMIN' && path.startsWith('/templates')) {
      keys.push('templates-group')
      if (path.startsWith('/templates/program-forms')) {
        keys.push('program-forms-group')
      }
      if (path.startsWith('/templates/file-forms')) {
        keys.push('file-forms-group')
      }
    }

    if (
      user?.role === 'ADMIN' &&
      (path.startsWith('/users') ||
        path.startsWith('/schools') ||
        path.startsWith('/instructors') ||
        path.startsWith('/admin/members') ||
        path.startsWith('/admin/settings/permissions'))
    ) {
      keys.push('members-group')
      if (path.startsWith('/admin/members') || path.startsWith('/admin/settings/permissions')) {
        keys.push('admin-group')
      }
    }

    if (user?.role === 'ADMIN' && (path.startsWith('/admin/posts') || path.startsWith('/posts'))) {
      keys.push('posts-group')
    }

    if (user?.role === 'ADMIN' && path.startsWith('/logs')) {
      keys.push('logs-group')
    }

    return keys
  }, [location.pathname, user?.role])

  const [controlledOpenKeys, setControlledOpenKeys] = useState<string[]>(openKeys)

  useEffect(() => {
    setControlledOpenKeys(openKeys)
  }, [openKeys])

  const selectedKeys = useMemo(() => {
    const path = location.pathname

    // ADMIN: 프로그램 상세·수정 URL에서도 일반 교육 프로그램 메뉴 하이라이트
    const programsReserved = ['my', 'favorites', 'volunteer', 'education', 'economy-education', 'new', 'satisfaction']
    if (user?.role === 'ADMIN' && path.startsWith('/programs/')) {
      const rest = path.slice('/programs/'.length)
      const segments = rest.split('/').filter(Boolean)
      const firstSegment = segments[0]
      if (firstSegment && !programsReserved.includes(firstSegment)) {
        return ['/programs/education']
      }
    }

    return [path]
  }, [location.pathname, user?.role])

  return (
    <Sider width={220} className="sidebar-container">
      <Header />
      <div className="sidebar-menu-wrapper">
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={controlledOpenKeys.length > 0 ? controlledOpenKeys : openKeys}
          onOpenChange={setControlledOpenKeys}
          className="sidebar-menu"
          items={menuItems}
          onClick={({ key }) => {
            if (typeof key === 'string' && key.startsWith('/')) navigate(key)
          }}
        />
      </div>
    </Sider>
  )
}
