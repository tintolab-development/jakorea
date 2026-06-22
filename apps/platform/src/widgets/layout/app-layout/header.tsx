import { PFText } from '@/shared/ui'
import logoUrl from '@/shared/assets/ja-logo.svg'
import styles from './header.module.css'

type HeaderProps = {
  isLoggedIn?: boolean
}

const navigationItems = ['JA Korea', '임팩트', '교육 소개', '참여하기', '후원하기']

export function Header({ isLoggedIn = false }: HeaderProps) {
  const userActions = isLoggedIn ? ['알림확인', '마이페이지', '로그아웃'] : ['회원가입', '로그인']

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a className={styles['logo-link']} href="/" aria-label="JA Korea 홈">
          <img className={styles.logo} src={logoUrl} alt="JA Korea" />
        </a>

        <nav className={styles.navigation} aria-label="주요 메뉴">
          {navigationItems.map(item => (
            <button className={styles['navigation-button']} type="button" key={item}>
              <PFText typo="bd-lg-sb" color="black">
                {item}
              </PFText>
            </button>
          ))}
        </nav>

        <div className={styles['user-actions']}>
          {userActions.map(action => (
            <button className={styles['user-action-button']} type="button" key={action}>
              <PFText typo="bd-md-rg" color="neutral-cool-600">
                {action}
              </PFText>
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
