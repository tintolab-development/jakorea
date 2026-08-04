import { useState } from 'react'
import { HeaderDesktop } from './header-desktop'
import { HeaderMobile } from './header-mobile'
import { HeaderMobileMenu } from './header-mobile-menu'

export type HeaderProps = {
  isLoggedIn?: boolean
  onLogout?: () => void
  transparent?: boolean
}

export function Header({ isLoggedIn, onLogout, transparent }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <HeaderMobile
        transparent={transparent}
        isMenuOpen={isMobileMenuOpen}
        onMenuOpen={() => setIsMobileMenuOpen(true)}
      />
      <HeaderDesktop isLoggedIn={isLoggedIn} onLogout={onLogout} transparent={transparent} />
      <HeaderMobileMenu
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isLoggedIn={isLoggedIn}
        onLogout={onLogout}
      />
    </>
  )
}
