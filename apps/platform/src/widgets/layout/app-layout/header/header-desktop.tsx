import { useState } from 'react'
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
}

function NavigationSubMenuItem({ item }: { item: NavigationSubItem }) {
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
    return (
      <a
        className={itemClassName}
        href={item.href}
        role="menuitem"
        {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : undefined)}
      >
        {content}
      </a>
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
}: HeaderDesktopProps) {
  const [activeNavigationItem, setActiveNavigationItem] = useState(() =>
    getActiveNavigationItem(window.location.pathname)
  )
  const [isNavOpen, setIsNavOpen] = useState(false)

  const headerClassName = [styles.header, transparent ? styles.headerTransparent : undefined]
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
        <a className={styles.logoLink} href="/" aria-label="JA Korea 홈">
          <img className={styles.logo} src={logoUrl} alt="JA Korea" />
        </a>

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
                    window.location.assign(href)
                  }
                }}
              >
                <PFText typo="bd-lg-sb" color={isActive ? 'primary-500' : 'black'}>
                  {group.label}
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
                  <NavigationSubMenuItem item={item} key={item.label} />
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
