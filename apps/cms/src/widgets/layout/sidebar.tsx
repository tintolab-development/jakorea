/** LNB: `getMenuItemsByRole` 결과를 Ant Design Menu로 렌더링. 헤더는 상단 고정. */

import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useMemo, useEffect, type CSSProperties } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getMenuItemsByRole } from '@/shared/config/menu-config'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants/messages'
import { memberListHref, normalizeMemberListKind } from '@/shared/config/member-list-kinds'
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
    }

    if (
      user?.role === 'ADMIN' &&
      (path.startsWith('/users/list') ||
        path.startsWith('/users/participants') ||
        path.startsWith('/schools') ||
        path.startsWith('/instructors') ||
        path.startsWith('/admin/members') ||
        path.startsWith('/admin/settings/permissions') ||
        path.startsWith('/admin/permission-requests'))
    ) {
      keys.push('members-group')
      // 회원 목록(2뎁스) 아래 3뎁스 — `member-list-group` 없으면 네비 후 서브메뉴가 닫힘
      if (
        path.startsWith('/users/list') ||
        path.startsWith('/schools') ||
        path.startsWith('/instructors') ||
        path.startsWith('/admin/members')
      ) {
        keys.push('member-list-group')
      }
      if (
        path.startsWith('/admin/settings/permissions') ||
        path.startsWith('/admin/permission-requests')
      ) {
        keys.push('member-permissions-group')
      }
    }

    if (user?.role === 'ADMIN' && (path.startsWith('/admin/posts') || path.startsWith('/posts'))) {
      keys.push('posts-group')
    }

    if (user?.role === 'ADMIN' && path.startsWith('/logs')) {
      keys.push('logs-group')
    }

    if (path.startsWith('/settlement-management')) {
      keys.push('settlement-management-group')
    }

    return keys
  }, [location.pathname, user?.role])

  const [controlledOpenKeys, setControlledOpenKeys] = useState<string[]>(openKeys)

  useEffect(() => {
    setControlledOpenKeys(openKeys)
  }, [openKeys])

  const selectedKeys = useMemo(() => {
    const path = location.pathname

    if (user?.role === 'ADMIN' && path === '/users/list') {
      const kind = normalizeMemberListKind(new URLSearchParams(location.search).get('kind'))
      return [memberListHref(kind)]
    }

    if (user?.role === 'ADMIN' && path.startsWith('/schools')) {
      return [memberListHref('institutions')]
    }

    if (user?.role === 'ADMIN' && path.startsWith('/instructors')) {
      return [memberListHref('instructors')]
    }

    // ADMIN: 프로그램 상세·수정 URL에서도 일반 교육 프로그램 메뉴 하이라이트
    const programsReserved = [
      'my',
      'favorites',
      'volunteer',
      'education',
      'economy-education',
      'new',
      'satisfaction',
    ]
    if (user?.role === 'ADMIN' && path.startsWith('/programs/')) {
      const rest = path.slice('/programs/'.length)
      const segments = rest.split('/').filter(Boolean)
      const firstSegment = segments[0]
      if (firstSegment && !programsReserved.includes(firstSegment)) {
        return ['/programs/education']
      }
    }

    if (user?.role === 'ADMIN' && path.startsWith('/templates/')) {
      if (path.startsWith('/templates/form-management')) {
        return ['/templates/form-management']
      }
      if (path.startsWith('/templates/kakao-notification')) {
        return ['/templates/kakao-notification']
      }
      if (path.startsWith('/templates/email-management')) {
        return ['/templates/email-management']
      }
    }

    return [path]
  }, [location.pathname, location.search, user?.role])

  const sidebarWidth = 'var(--sidebar-width)'
  const sidebarChrome: CSSProperties = {
    background: 'var(--color-sidebar-bg)',
    color: 'var(--color-sidebar-text)',
  }

  return (
    <Sider width={sidebarWidth} className="sidebar-container" style={sidebarChrome}>
      <Header />
      <div className="sidebar-menu-wrapper" style={sidebarChrome}>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={controlledOpenKeys.length > 0 ? controlledOpenKeys : openKeys}
          onOpenChange={setControlledOpenKeys}
          className="sidebar-menu"
          style={sidebarChrome}
          items={menuItems}
          onClick={({ key }) => {
            // 기존: if (typeof key === 'string' && key.startsWith('/')) navigate(key)
            if (typeof key !== 'string' || !key.startsWith('/')) return
            if (key === '/programs/education') {
              window.alert(FEATURE_COMING_SOON_ALERT_MESSAGE)
              // navigate(key)
              return
            }
            if (key === '/templates/kakao-notification' || key === '/templates/email-management') {
              window.alert(FEATURE_COMING_SOON_ALERT_MESSAGE)
              return
            }
            navigate(key)
          }}
        />
      </div>
    </Sider>
  )
}
