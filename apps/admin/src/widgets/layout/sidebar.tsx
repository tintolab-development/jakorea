/** LNB — CMS Sidebar 패턴 (역할 필터 없음) */

import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useMemo, useEffect, useCallback, type CSSProperties } from 'react'
import { getSidebarMenuItems, getOpenKeysForPath } from '@/shared/config/menu-config'
import { useHomepageLogAccess } from '@/features/auth/hooks/use-homepage-log-access'
import {
  HOMEPAGE_LOG_ACCESS_DENIED_ALERT,
  isHomepageLogPath,
} from '@/shared/lib/homepage-log-access'
import { cmsAlertModal } from '@/shared/ui'
import { MenuDropdownChevronIcon } from '@/shared/ui/icons'
import './sidebar.css'
import { Header } from './header'
import { collectMenuRouteKeys, resolveSidebarSelectedKey } from './sidebar-selected-key'

const { Sider } = Layout

const SIDEBAR_MENU_ITEMS = getSidebarMenuItems()
const SIDEBAR_MENU_ROUTE_KEYS = collectMenuRouteKeys(SIDEBAR_MENU_ITEMS)

const SIDEBAR_CHROME: CSSProperties = {
  background: 'var(--color-sidebar-bg)',
  color: 'var(--color-sidebar-text)',
}

function sameOpenKeys(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  if (a.length === 0) return true
  const bSet = new Set(b)
  return a.every(key => bSet.has(key))
}

function mergeOpenKeys(prev: readonly string[], required: readonly string[]): string[] {
  if (required.length === 0) return prev as string[]
  const merged = new Set(prev)
  let changed = false
  for (const key of required) {
    if (!merged.has(key)) {
      merged.add(key)
      changed = true
    }
  }
  if (!changed) return prev as string[]
  return [...merged]
}

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const pathOpenKeys = useMemo(() => getOpenKeysForPath(location.pathname), [location.pathname])

  const [controlledOpenKeys, setControlledOpenKeys] = useState<string[]>(pathOpenKeys)

  useEffect(() => {
    setControlledOpenKeys(prev => mergeOpenKeys(prev, pathOpenKeys))
  }, [pathOpenKeys])

  const selectedKeys = useMemo(
    () => [resolveSidebarSelectedKey(location.pathname, SIDEBAR_MENU_ROUTE_KEYS)],
    [location.pathname]
  )

  const expandIcon = useCallback(
    ({ isOpen }: { isOpen?: boolean }) => <MenuDropdownChevronIcon open={!!isOpen} />,
    []
  )

  const handleOpenChange = useCallback((keys: string[]) => {
    setControlledOpenKeys(prev => (sameOpenKeys(prev, keys) ? prev : keys))
  }, [])

  const logAccess = useHomepageLogAccess()
  const handleMenuClick = useCallback(
    ({ key }: { key: string }) => {
      if (typeof key !== 'string' || !key.startsWith('/')) return
      // 권한 설정 V1.2: 로그 관리는 Master 전용 — 누르는 즉시 안내하고 이동하지 않는다.
      if (isHomepageLogPath(key) && logAccess.resolved && !logAccess.allowed) {
        cmsAlertModal.show(HOMEPAGE_LOG_ACCESS_DENIED_ALERT)
        return
      }
      navigate(key)
    },
    [logAccess.allowed, logAccess.resolved, navigate]
  )

  return (
    <Sider width="var(--sidebar-width)" className="sidebar-container" style={SIDEBAR_CHROME}>
      <Header />
      <div className="sidebar-menu-wrapper" style={SIDEBAR_CHROME}>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={controlledOpenKeys}
          onOpenChange={handleOpenChange}
          className="sidebar-menu"
          style={SIDEBAR_CHROME}
          items={SIDEBAR_MENU_ITEMS}
          expandIcon={expandIcon}
          onClick={handleMenuClick}
        />
      </div>
    </Sider>
  )
}
