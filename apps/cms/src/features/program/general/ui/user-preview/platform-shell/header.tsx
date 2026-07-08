import { PFText } from './pf-text'
import logoUrl from './assets/ja-logo.svg'
import logOutIconUrl from './assets/icon/log-out.svg'
import notificationsIconUrl from './assets/icon/notifications.svg'
import personIconUrl from './assets/icon/person.svg'
import styles from './header.module.css'

const navigationItems = ['JA Korea', '임팩트', '교육 소개', '참여하기', '후원하기']
const ACTIVE_NAV_ITEM = '교육 소개'

const loggedInActions = [
  { label: '알림확인', iconUrl: notificationsIconUrl },
  { label: '마이페이지', iconUrl: personIconUrl },
  { label: '로그아웃', iconUrl: logOutIconUrl },
]

/** 미리보기 전용 — Platform Header 정적 표현 */
export function PlatformPreviewHeader() {
  return (
    <header className={`${styles.header} platform-preview-header`}>
      <div className={`${styles.inner} platform-preview-header__inner`}>
        <span className={styles['logo-link']} aria-label="JA Korea 홈">
          <img className={styles.logo} src={logoUrl} alt="JA Korea" />
        </span>

        <nav className={styles.navigation} aria-label="주요 메뉴">
          {navigationItems.map(item => {
            const isActive = item === ACTIVE_NAV_ITEM
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
                tabIndex={-1}
              >
                <PFText typo="bd-lg-sb" color={isActive ? 'primary-500' : 'black'}>
                  {item}
                </PFText>
              </button>
            )
          })}
        </nav>

        <div className={styles['logged-in-actions']}>
          {loggedInActions.map(({ label, iconUrl }) => (
            <button
              className={styles['icon-action-button']}
              type="button"
              aria-label={label}
              key={label}
              tabIndex={-1}
            >
              <img className={styles['action-icon']} src={iconUrl} alt="" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
