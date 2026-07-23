import { HeaderDesktop } from './header-desktop'
import { HeaderMobile } from './header-mobile'

export type HeaderProps = {
  isLoggedIn?: boolean
  onLogout?: () => void
  transparent?: boolean
  onMobileMenuOpen?: () => void
}

export function Header({ isLoggedIn, onLogout, transparent, onMobileMenuOpen }: HeaderProps) {
  return (
    <>
      <HeaderMobile transparent={transparent} onMenuOpen={onMobileMenuOpen} />
      <HeaderDesktop isLoggedIn={isLoggedIn} onLogout={onLogout} transparent={transparent} />
    </>
  )
}
