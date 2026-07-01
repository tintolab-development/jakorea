import { useState } from 'react'
import { PFText } from '@/shared/ui'
import logoUrl from '@/shared/assets/ja-logo.svg'
import logOutIconUrl from './image/icon/log-out.svg'
import notificationsIconUrl from './image/icon/notifications.svg'
import personIconUrl from './image/icon/person.svg'
import styles from './header.module.css'

type HeaderProps = {
  isLoggedIn?: boolean
  onLogout?: () => void
}

const navigationItems = ['JA Korea', '임팩트', '교육 소개', '참여하기', '후원하기']
const navigationItemRoutes: Partial<Record<string, string>> = {
  후원하기: '/auth/required?redirect=/support',
}
const guestUserActionRoutes: Record<string, string> = {
  회원가입: '/auth/sign-up',
  로그인: '/auth/sign-in',
}
const loggedInActions = [
  { label: '알림확인', iconUrl: notificationsIconUrl },
  { label: '마이페이지', iconUrl: personIconUrl },
  { label: '로그아웃', iconUrl: logOutIconUrl },
]

export function Header({ isLoggedIn = false, onLogout }: HeaderProps) {
  const [activeNavigationItem, setActiveNavigationItem] = useState(navigationItems[0])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a className={styles['logo-link']} href="/" aria-label="JA Korea 홈">
          <img className={styles.logo} src={logoUrl} alt="JA Korea" />
        </a>

        <nav className={styles.navigation} aria-label="주요 메뉴">
          {navigationItems.map(item => {
            const isActive = item === activeNavigationItem
            const route = navigationItemRoutes[item]
            const buttonClassName = [
              styles['navigation-button'],
              isActive ? styles['navigation-button-active'] : undefined,
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
          <div className={styles['logged-in-actions']}>
            {loggedInActions.map(({ label, iconUrl }) => (
              <button
                className={styles['icon-action-button']}
                type="button"
                aria-label={label}
                key={label}
                onClick={label === '로그아웃' ? onLogout : undefined}
              >
                <img className={styles['action-icon']} src={iconUrl} alt="" aria-hidden="true" />
              </button>
            ))}
          </div>
        ) : (
          <div className={styles['user-actions']}>
            {Object.keys(guestUserActionRoutes).map(action => {
              const route = guestUserActionRoutes[action]

              return (
                <button
                  className={styles['user-action-button']}
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
