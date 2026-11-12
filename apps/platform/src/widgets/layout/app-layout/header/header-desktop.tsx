import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { recordMenuClick } from '@/features/analytics'
import {
  NotificationInboxPanel,
  useMyNotificationUnreadCountQuery,
} from '@/features/notification'
import { PFText } from '@/shared/ui'
import logoUrl from '@/shared/assets/brand/ja-logo.svg'
import notificationsActiveIconUrl from '../image/icon/notifications-active.svg'
import externalLinkIconUrl from './image/icon/outlink.svg'
import {
  getActiveNavigationGroupCode,
  getLoggedInActionRoute,
  getTopCategoryNavigationTarget,
  guestUserActionRoutes,
  loggedInActions,
  type NavigationGroup,
  type NavigationSubItem,
} from './header-config'
import styles from './header-desktop.module.css'

type HeaderDesktopProps = {
  groups: readonly NavigationGroup[]
  isLoggedIn?: boolean
  onLogout?: () => void
  transparent?: boolean
  inverse?: boolean
  onDarkSurface?: boolean
}

function NavigationSubMenuItem({
  item,
  onNavigate,
  onHoverStart,
}: {
  item: NavigationSubItem
  onNavigate?: () => void
  onHoverStart?: () => void
}) {
  const isDisabled = !item.href
  const itemClassName = [
    styles.menuItem,
    'typo-bd-lg-sb',
    isDisabled ? styles.menuItemDisabled : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      <span className={styles.menuItemLabel}>{item.label}</span>
      {item.external ? (
        <img
          className={styles.menuItemExternalIcon}
          src={externalLinkIconUrl}
          alt=""
          aria-hidden="true"
        />
      ) : null}
    </>
  )

  if (item.href && !isDisabled) {
    if (item.external) {
      return (
        <a
          className={itemClassName}
          href={item.href}
          role="menuitem"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            if (item.external) recordMenuClick(item.menuCode)
            onNavigate?.()
          }}
          onMouseEnter={onHoverStart}
        >
          {content}
        </a>
      )
    }

    return (
      <Link
        className={itemClassName}
        to={item.href}
        role="menuitem"
        onClick={onNavigate}
        onMouseEnter={onHoverStart}
      >
        {content}
      </Link>
    )
  }

  return (
    <span
      className={itemClassName}
      role="menuitem"
      aria-disabled="true"
      onMouseEnter={onHoverStart}
    >
      {content}
    </span>
  )
}

export function HeaderDesktop({
  groups,
  isLoggedIn = false,
  onLogout,
  transparent = false,
  inverse = false,
  onDarkSurface = false,
}: HeaderDesktopProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [activeGroupCode, setActiveGroupCode] = useState<string | null>(() =>
    getActiveNavigationGroupCode(pathname),
  )
  const [hoveredGroupCode, setHoveredGroupCode] = useState<string | null>(null)
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [menuPanelBottom, setMenuPanelBottom] = useState<number | null>(null)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const navigationRef = useRef<HTMLElement | null>(null)
  const notificationAnchorRef = useRef<HTMLDivElement | null>(null)
  const notificationButtonRef = useRef<HTMLButtonElement | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unreadNotificationCount = useMyNotificationUnreadCountQuery(isLoggedIn)

  const cancelScheduledClose = () => {
    if (closeTimerRef.current == null) return
    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = null
  }

  const closeNav = () => {
    cancelScheduledClose()
    setIsNavOpen(false)
    setHoveredGroupCode(null)
  }

  const scheduleClose = () => {
    cancelScheduledClose()
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null
      setIsNavOpen(false)
      setHoveredGroupCode(null)
    }, 120)
  }

  const openGroup = (groupCode: string) => {
    cancelScheduledClose()
    setHoveredGroupCode(groupCode)
    setIsNavOpen(true)
  }

  useEffect(() => {
    setActiveGroupCode(getActiveNavigationGroupCode(pathname))
    closeNav()
    setIsNotificationOpen(false)
  }, [pathname])

  useEffect(() => () => cancelScheduledClose(), [])

  const notificationOpen = isLoggedIn && isNotificationOpen

  useEffect(() => {
    if (!notificationOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const anchor = notificationAnchorRef.current
      if (anchor && event.target instanceof Node && anchor.contains(event.target)) return
      setIsNotificationOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsNotificationOpen(false)
      notificationButtonRef.current?.focus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [notificationOpen])

  useLayoutEffect(() => {
    if (!isNavOpen) return

    const updateMenuPanelBottom = () => {
      const navigation = navigationRef.current
      if (!navigation) return
      setMenuPanelBottom(navigation.getBoundingClientRect().bottom)
    }

    updateMenuPanelBottom()
    window.addEventListener('resize', updateMenuPanelBottom)

    const navigation = navigationRef.current
    const resizeObserver =
      typeof ResizeObserver === 'undefined' || !navigation
        ? null
        : new ResizeObserver(updateMenuPanelBottom)

    if (resizeObserver && navigation) {
      resizeObserver.observe(navigation)
    }

    return () => {
      window.removeEventListener('resize', updateMenuPanelBottom)
      resizeObserver?.disconnect()
    }
  }, [isNavOpen])

  const headerClassName = [
    styles.header,
    transparent ? styles.headerTransparent : undefined,
    inverse ? styles.headerInverse : undefined,
    onDarkSurface ? styles.headerOnDark : undefined,
    isNavOpen ? styles.headerNavOpen : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  const highlightedGroupCode = hoveredGroupCode ?? activeGroupCode

  return (
    <header
      className={headerClassName}
      onMouseEnter={cancelScheduledClose}
      onMouseLeave={scheduleClose}
    >
      <div className={styles.inner}>
        <Link className={styles.logoLink} to="/" aria-label="JA Korea 홈">
          <img className={styles.logo} src={logoUrl} alt="JA Korea" />
        </Link>

        <nav
          ref={navigationRef}
          className={styles.navigation}
          aria-label="주요 메뉴"
          aria-expanded={isNavOpen}
        >
          {groups.map(group => {
            const isHighlighted = group.groupCode === highlightedGroupCode
            const isRouteActive = group.groupCode === activeGroupCode
            const buttonClassName = [
              styles.navigationButton,
              isHighlighted ? styles.navigationButtonActive : undefined,
            ]
              .filter(Boolean)
              .join(' ')

            const openThisGroup = () => {
              openGroup(group.groupCode)
            }

            return (
              <div className={styles.menuColumn} key={group.groupCode}>
                <button
                  className={buttonClassName}
                  type="button"
                  aria-pressed={isRouteActive}
                  onMouseEnter={openThisGroup}
                  onClick={() => {
                    setActiveGroupCode(group.groupCode)
                    const target = getTopCategoryNavigationTarget(group)
                    if (!target) return
                    closeNav()
                    if (target.external) {
                      const source = group.children.find(
                        child => child.external && child.href === target.href,
                      )
                      if (source) recordMenuClick(source.menuCode)
                      window.open(target.href, '_blank', 'noopener,noreferrer')
                      return
                    }
                    navigate(target.href)
                  }}
                >
                  <span className={styles.navigationButtonLabel}>
                    <PFText typo="bd-lg-sb" color="inherit">
                      {group.label}
                    </PFText>
                  </span>
                </button>
                <div
                  className={styles.menuGroup}
                  role="group"
                  aria-label={group.label}
                  aria-hidden={isNavOpen ? undefined : true}
                >
                  {group.children.map(item => (
                    <NavigationSubMenuItem
                      item={item}
                      key={item.menuCode}
                      onNavigate={closeNav}
                      onHoverStart={openThisGroup}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        {isLoggedIn ? (
          <div className={styles.loggedInActions}>
            {loggedInActions.map(({ label, iconUrl }) =>
              label === '알림' ? (
                <div className={styles.notificationAnchor} ref={notificationAnchorRef} key={label}>
                  <button
                    ref={notificationButtonRef}
                    className={styles.iconActionButton}
                    type="button"
                    aria-label={
                      unreadNotificationCount > 0
                        ? `${label} (읽지 않은 알림 ${unreadNotificationCount}건)`
                        : label
                    }
                    aria-haspopup="dialog"
                    aria-expanded={notificationOpen}
                    onClick={() => {
                      closeNav()
                      setIsNotificationOpen(open => !open)
                    }}
                  >
                    <img
                      className={[
                        styles.actionIcon,
                        unreadNotificationCount > 0 ? styles.actionIconActive : undefined,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      src={unreadNotificationCount > 0 ? notificationsActiveIconUrl : iconUrl}
                      alt=""
                      aria-hidden="true"
                    />
                  </button>
                  {notificationOpen ? (
                    <div className={styles.notificationPopover} role="dialog" aria-label="알림">
                      <NotificationInboxPanel onNavigate={() => setIsNotificationOpen(false)} />
                    </div>
                  ) : null}
                </div>
              ) : (
                <button
                  className={styles.iconActionButton}
                  type="button"
                  aria-label={label}
                  key={label}
                  onClick={() => {
                    if (label === '로그아웃') {
                      onLogout?.()
                      return
                    }

                    const route = getLoggedInActionRoute(label)
                    if (route) {
                      navigate(route)
                    }
                  }}
                >
                  <img className={styles.actionIcon} src={iconUrl} alt="" aria-hidden="true" />
                </button>
              ),
            )}
          </div>
        ) : (
          <div className={styles.userActions}>
            {Object.keys(guestUserActionRoutes).map(action => {
              const route = guestUserActionRoutes[action]

              return (
                <button
                  className={styles.userActionButton}
                  type="button"
                  key={action}
                  onClick={() => navigate(route)}
                >
                  <PFText typo="bd-md-rg" color="inherit">
                    {action}
                  </PFText>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {isNavOpen && menuPanelBottom !== null ? (
        <div
          className={styles.navigationBackdrop}
          style={{ top: `${menuPanelBottom}px` }}
          aria-hidden="true"
        />
      ) : null}

    </header>
  )
}
