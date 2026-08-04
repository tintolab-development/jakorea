/** LNB — CMS Sidebar 패턴 (역할 필터 없음) */

import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useMemo, useEffect, useCallback, type CSSProperties } from 'react'
import { getSidebarMenuItems, getOpenKeysForPath } from '@/shared/config/menu-config'
import { MenuDropdownChevronIcon } from '@/shared/ui/icons'
import './sidebar.css'
import { Header } from './header'

const { Sider } = Layout

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = useMemo(() => getSidebarMenuItems(), [])

  const pathOpenKeys = useMemo(
    () => getOpenKeysForPath(location.pathname),
    [location.pathname]
  )

  const [controlledOpenKeys, setControlledOpenKeys] = useState<string[]>(pathOpenKeys)

  useEffect(() => {
    setControlledOpenKeys(prev => {
      const merged = new Set(prev)
      for (const key of pathOpenKeys) merged.add(key)
      return [...merged]
    })
  }, [pathOpenKeys])

  const selectedKeys = useMemo(() => [location.pathname], [location.pathname])

  const expandIcon = useCallback(
    ({ isOpen }: { isOpen?: boolean }) => <MenuDropdownChevronIcon open={!!isOpen} />,
    []
  )

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
          openKeys={controlledOpenKeys.length > 0 ? controlledOpenKeys : pathOpenKeys}
          onOpenChange={setControlledOpenKeys}
          className="sidebar-menu"
          style={sidebarChrome}
          items={menuItems}
          expandIcon={expandIcon}
          onClick={({ key }) => {
            if (typeof key !== 'string' || !key.startsWith('/')) return
            navigate(key)
          }}
        />
      </div>
    </Sider>
  )
}
