import { useState } from 'react'
import { HeaderDesktop } from './header-desktop'
import { HeaderMobile } from './header-mobile'
import { HeaderMobileMenu } from './header-mobile-menu'

export type HeaderProps = {
  isLoggedIn?: boolean
  onLogout?: () => void
  transparent?: boolean
  /** 어두운 히어로 위 오버레이용 — 로고·텍스트 흰색 반전 */
  inverse?: boolean
}

export function Header({ isLoggedIn, onLogout, transparent, inverse }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <HeaderMobile
        transparent={transparent}
        inverse={inverse}
        isMenuOpen={isMobileMenuOpen}
        onMenuOpen={() => setIsMobileMenuOpen(true)}
      />
      <HeaderDesktop
        isLoggedIn={isLoggedIn}
        onLogout={onLogout}
        transparent={transparent}
        inverse={inverse}
      />
      <HeaderMobileMenu
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isLoggedIn={isLoggedIn}
        onLogout={onLogout}
      />
    </>
  )
}
