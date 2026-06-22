import { useState } from 'react'
import { PFText } from '@/shared/ui'
import logoUrl from '@/shared/assets/ja-logo.svg'
import styles from './header.module.css'

type HeaderProps = {
  isLoggedIn?: boolean
}

const navigationItems = ['JA Korea', '임팩트', '교육 소개', '참여하기', '후원하기']
const guestUserActionRoutes: Record<string, string> = {
  회원가입: '/auth/sign-up',
  로그인: '/auth/sign-in',
}

export function Header({ isLoggedIn = false }: HeaderProps) {
  const [activeNavigationItem, setActiveNavigationItem] = useState(navigationItems[0])
  const userActions = isLoggedIn ? ['알림확인', '마이페이지', '로그아웃'] : ['회원가입', '로그인']

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a className={styles['logo-link']} href="/" aria-label="JA Korea 홈">
          <img className={styles.logo} src={logoUrl} alt="JA Korea" />
        </a>

        <nav className={styles.navigation} aria-label="주요 메뉴">
          {navigationItems.map(item => {
            const isActive = item === activeNavigationItem
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
                onClick={() => setActiveNavigationItem(item)}
              >
                <PFText typo="bd-lg-sb" color={isActive ? 'primary-500' : 'black'}>
                  {item}
                </PFText>
              </button>
            )
          })}
        </nav>

        <div className={styles['user-actions']}>
          {userActions.map(action => {
            const route = guestUserActionRoutes[action]

            return (
              <button
                className={styles['user-action-button']}
                type="button"
                key={action}
                onClick={route ? () => window.location.assign(route) : undefined}
              >
                <PFText typo="bd-md-rg" color="neutral-cool-600">
                  {action}
                </PFText>
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}
