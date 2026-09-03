/** LNB: `getMenuItemsByRole` 결과를 Ant Design Menu로 렌더링. 헤더는 상단 고정. */

import { Layout, Menu } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useMemo, useEffect, useCallback, type CSSProperties } from 'react'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { invalidateMemberListQueries } from '@/features/user/api/invalidate-member-list-queries'
import { getMenuItemsByRole } from '@/shared/config/menu-config'
import {
  isMemberListMenuHref,
  memberListHref,
  normalizeMemberListKind,
} from '@/shared/config/member-list-kinds'
import {
  canAdminAction,
  isPermissionSettingsPath,
  isSecurityLogPath,
  showAdminAccessDeniedAlert,
} from '@/shared/lib/admin-role-policy'
import { useSessionAdminRoleCode } from '@/shared/lib/use-session-admin-role-code'
import { MenuDropdownChevronIcon } from '@/shared/ui/icons'
import './sidebar.css'
import { Header } from './header'

const { Sider } = Layout

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const roleCode = useSessionAdminRoleCode()

  const menuItems = useMemo(() => {
    return getMenuItemsByRole(user?.role || null, user)
  }, [user?.role, user])

  const openKeys = useMemo(() => {
    const path = location.pathname
    const keys: string[] = []

    // ADMIN: 프로그램 관리 그룹 (/programs/education, /programs/:id 등)
    const isGeminiProgramScope =
      user?.role === 'ADMIN' && path.startsWith('/programs/gemini')
    const isProgramMgmt =
      user?.role === 'ADMIN' &&
      ((path.startsWith('/programs') &&
        !path.startsWith('/programs/my') &&
        !path.startsWith('/programs/favorites')) ||
        isGeminiProgramScope)
    if (isProgramMgmt) {
      keys.push('programs-group')
    }

    if (isGeminiProgramScope) {
      keys.push('gemini-program-group')
    }

    if (user?.role === 'ADMIN' && path.startsWith('/message-management')) {
      keys.push('message-management-group')
    }

    if (
      user?.role === 'ADMIN' &&
      (path.startsWith('/users/list') ||
        path.startsWith('/instructors') ||
        path.startsWith('/admin/members') ||
        path.startsWith('/admin/settings/permissions') ||
        path.startsWith('/admin/permission-requests'))
    ) {
      keys.push('members-group')
      // 회원 목록(2뎁스) 아래 3뎁스 — `member-list-group` 없으면 네비 후 서브메뉴가 닫힘
      if (
        path.startsWith('/users/list') ||
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

    if (user?.role === 'ADMIN' && path.startsWith('/admin/notifications')) {
      keys.push('notification-messages-group')
    }

    if (path.startsWith('/settlement-management')) {
      keys.push('settlement-management-group')
    }

    return keys
  }, [location.pathname, user?.role])

  const [controlledOpenKeys, setControlledOpenKeys] = useState<string[]>(openKeys)

  /** 경로에 맞는 그룹은 열어 주되, 사용자가 펼쳐 둔 다른 그룹은 자동으로 닫지 않음 */
  useEffect(() => {
    setControlledOpenKeys(prev => {
      const merged = new Set(prev)
      for (const key of openKeys) merged.add(key)
      return [...merged]
    })
  }, [openKeys])

  const selectedKeys = useMemo(() => {
    const path = location.pathname

    if (user?.role === 'ADMIN' && path === '/users/list') {
      const kind = normalizeMemberListKind(new URLSearchParams(location.search).get('kind'))
      return [memberListHref(kind)]
    }

    if (user?.role === 'ADMIN' && path.startsWith('/instructors')) {
      return [memberListHref('instructors')]
    }

    // ADMIN: 프로그램 상세·수정 URL에서도 일반 프로그램 LNB 키로 하이라이트
    const programsReserved = [
      'my',
      'favorites',
      'volunteer',
      'general',
      'company-school',
      'trained-teachers',
      'ujat',
      'gemini',
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
        return ['/programs/general']
      }
    }

    if (user?.role === 'ADMIN' && path.startsWith('/templates/')) {
      if (path.startsWith('/templates/form-management')) {
        return ['/templates/form-management']
      }
    }

    // ADMIN: 게시글 관리 — 상세 URL에서도 목록 메뉴 키로 하이라이트
    if (user?.role === 'ADMIN' && path.startsWith('/admin/posts/notices')) {
      return ['/admin/posts/notices']
    }
    if (user?.role === 'ADMIN' && path.startsWith('/admin/posts/faq')) {
      return ['/admin/posts/faq']
    }

    return [path]
  }, [location.pathname, location.search, user?.role])

  const sidebarWidth = 'var(--sidebar-width)'
  const sidebarChrome: CSSProperties = {
    background: 'var(--color-sidebar-bg)',
    color: 'var(--color-sidebar-text)',
  }

  const expandIcon = useCallback(
    ({ isOpen }: { isOpen?: boolean }) => <MenuDropdownChevronIcon open={!!isOpen} />,
    []
  )

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
          expandIcon={expandIcon}
          onClick={({ key }) => {
            if (typeof key !== 'string' || !key.startsWith('/')) return
            if (
              isSecurityLogPath(key) &&
              !canAdminAction({ roleCode, action: 'view', screen: 'security-logs' })
            ) {
              showAdminAccessDeniedAlert()
              return
            }
            if (
              isPermissionSettingsPath(key) &&
              !canAdminAction({ roleCode, action: 'view', screen: 'permission-settings' })
            ) {
              showAdminAccessDeniedAlert()
              return
            }
            const alreadyOnExactHref = `${location.pathname}${location.search}` === key
            navigate(key)
            // 동일 유형 메뉴 재클릭은 URL이 안 바뀌어 observer remount가 없다.
            if (alreadyOnExactHref && isMemberListMenuHref(key)) {
              invalidateMemberListQueries(queryClient)
            }
          }}
        />
      </div>
    </Sider>
  )
}
