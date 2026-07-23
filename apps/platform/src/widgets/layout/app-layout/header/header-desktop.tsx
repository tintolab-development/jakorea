import { useState } from 'react'
import { PFText } from '@/shared/ui'
import logoUrl from '@/shared/assets/brand/ja-logo.svg'
import {
  getActiveNavigationItem,
  getLoggedInActionRoute,
  guestUserActionRoutes,
  loggedInActions,
  navigationItemRoutes,
  navigationItems,
} from './header-config'
import styles from './header-desktop.module.css'

type HeaderDesktopProps = {
  isLoggedIn?: boolean
  onLogout?: () => void
  transparent?: boolean
}

export function HeaderDesktop({ isLoggedIn = false, onLogout, transparent = false }: HeaderDesktopProps) {
  const [activeNavigationItem, setActiveNavigationItem] = useState(() =>
    getActiveNavigationItem(window.location.pathname)
  )
  const headerClassName = [styles.header, transparent ? styles.headerTransparent : undefined]
    .filter(Boolean)
    .join(' ')

  return (
    <header className={headerClassName}>
      <div className={styles.inner}>
        <a className={styles.logoLink} href="/" aria-label="JA Korea 홈">
          <img className={styles.logo} src={logoUrl} alt="JA Korea" />
        </a>

        <nav className={styles.navigation} aria-label="주요 메뉴">
          {navigationItems.map(item => {
            const isActive = item === activeNavigationItem
            const route = navigationItemRoutes[item]
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
                key={item}
                onClick={() => {
                  setActiveNavigationItem(item)
                  if (route) {
                    window.location.assign(route)
                  }
                }}
              >
                <PFText typo="bd-lg-sb" color={isActive ? 'primary-500' : 'black'}>
                  {item}
                </PFText>
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
                    window.location.assign(route)
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
                  onClick={() => window.location.assign(route)}
                >
                  <PFText typo="bd-md-rg" color="neutral-cool-600">
                    {action}
                  </PFText>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </header>
  )
}
