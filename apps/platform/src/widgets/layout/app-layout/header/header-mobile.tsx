import { Link } from 'react-router-dom'
import logoUrl from '@/shared/assets/brand/ja-logo.svg'
import menuIconUrl from './image/icon/menu.svg'
import styles from './header-mobile.module.css'

type HeaderMobileProps = {
  transparent?: boolean
  isMenuOpen?: boolean
  onMenuOpen?: () => void
}

export function HeaderMobile({ transparent = false, isMenuOpen = false, onMenuOpen }: HeaderMobileProps) {
  const headerClassName = [styles.header, transparent ? styles.headerTransparent : undefined]
    .filter(Boolean)
    .join(' ')

  return (
    <header className={headerClassName}>
      <Link className={styles.logoLink} to="/" aria-label="JA Korea 홈">
        <img className={styles.logo} src={logoUrl} alt="JA Korea" />
      </Link>
      <button
        className={styles.menuButton}
        type="button"
        aria-label="메뉴 열기"
        aria-expanded={isMenuOpen}
        aria-controls="mobile-header-menu"
        onClick={onMenuOpen}
      >
        <img className={styles.menuIcon} src={menuIconUrl} alt="" aria-hidden="true" />
      </button>
    </header>
  )
}
