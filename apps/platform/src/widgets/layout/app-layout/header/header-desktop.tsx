import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PFText } from '@/shared/ui'
import logoUrl from '@/shared/assets/brand/ja-logo.svg'
import externalLinkIconUrl from '@/shared/assets/icons/arrow-diagonal-black.svg'
import {
  getActiveNavigationItem,
  getLoggedInActionRoute,
  guestUserActionRoutes,
  loggedInActions,
  navigationGroups,
  type NavigationSubItem,
} from './header-config'
import styles from './header-desktop.module.css'

type HeaderDesktopProps = {
  isLoggedIn?: boolean
  onLogout?: () => void
  transparent?: boolean
  inverse?: boolean
}

function NavigationSubMenuItem({
  item,
  onNavigate,
}: {
  item: NavigationSubItem
  onNavigate?: () => void
}) {
  const isDisabled = !item.href
  const itemClassName = [
    styles.menuItem,
    'typo-bd-md-md',
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
          onClick={onNavigate}
        >
          {content}
        </a>
      )
    }

    return (
      <Link className={itemClassName} to={item.href} role="menuitem" onClick={onNavigate}>
        {content}
      </Link>
    )
  }

  return (
    <span className={itemClassName} role="menuitem" aria-disabled="true">
      {content}
    </span>
  )
}

export function HeaderDesktop({
  isLoggedIn = false,
  onLogout,
  transparent = false,
  inverse = false,
}: HeaderDesktopProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [activeNavigationItem, setActiveNavigationItem] = useState(() =>
    getActiveNavigationItem(pathname),
  )
  const [isNavOpen, setIsNavOpen] = useState(false)

  useEffect(() => {
    setActiveNavigationItem(getActiveNavigationItem(pathname))
    setIsNavOpen(false)
  }, [pathname])

  const closeNav = () => {
    setIsNavOpen(false)
  }

  const headerClassName = [
    styles.header,
    transparent ? styles.headerTransparent : undefined,
    inverse ? styles.headerInverse : undefined,
    isNavOpen ? styles.headerNavOpen : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  const dropdownClassName = [styles.dropdownPanel, isNavOpen ? styles.dropdownPanelOpen : undefined]
    .filter(Boolean)
    .join(' ')

  return (
    <header
      className={headerClassName}
      onMouseLeave={() => {
        setIsNavOpen(false)
      }}
    >
      <div className={styles.inner}>
        <Link className={styles.logoLink} to="/" aria-label="JA Korea 홈">
          <img className={styles.logo} src={logoUrl} alt="JA Korea" />
        </Link>

        <nav
          className={styles.navigation}
          aria-label="주요 메뉴"
          aria-expanded={isNavOpen}
          onMouseEnter={() => {
            setIsNavOpen(true)
          }}
        >
          {navigationGroups.map(group => {
            const isActive = group.label === activeNavigationItem
            const buttonClassName = [
              styles.navigationButton,
              isActive ? styles.navigationButtonActive : undefined,
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button
                className={buttonClassName}
                type="button"
                aria-pressed={isActive}
                key={group.label}
                onClick={() => {
                  setActiveNavigationItem(group.label)
                  const href = 'href' in group ? group.href : undefined
                  if (href) {
                    closeNav()
                    navigate(href)
                  }
                }}
              >
                <span className={styles.navigationButtonLabel}>
                  <PFText
                    typo="bd-lg-sb"
                    color={isActive ? 'primary-500' : inverse ? 'white' : 'black'}
                  >
                    {group.label}
                  </PFText>
                </span>
              </button>
            )
          })}
        </nav>

        {isLoggedIn ? (
          <div className={styles.loggedInActions}>
            {loggedInActions.map(({ label, iconUrl }) => (
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
            ))}
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
                  <PFText typo="bd-md-rg" color={inverse ? 'white' : 'neutral-cool-600'}>
                    {action}
                  </PFText>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div
        className={dropdownClassName}
        role="menu"
        aria-label="주요 메뉴 하위"
        onMouseEnter={() => {
          setIsNavOpen(true)
        }}
      >
        <div className={styles.dropdownInner}>
          <div className={styles.dropdownLogoSpacer} aria-hidden="true" />
          <div className={styles.dropdownColumns}>
            {navigationGroups.map(group => (
              <div
                className={styles.menuGroup}
                role="group"
                aria-label={group.label}
                key={group.label}
              >
                {group.children.map(item => (
                  <NavigationSubMenuItem
                    item={item}
                    key={item.label}
                    onNavigate={closeNav}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className={styles.dropdownAuthSpacer} aria-hidden="true" />
        </div>
      </div>
    </header>
  )
}
