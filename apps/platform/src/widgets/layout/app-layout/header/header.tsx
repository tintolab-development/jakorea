import { useState } from 'react'
import { useSiteGnb } from '@/features/site-shell'
import { HeaderDesktop } from './header-desktop'
import { HeaderMobile } from './header-mobile'
import { HeaderMobileMenu } from './header-mobile-menu'

export type HeaderProps = {
  isLoggedIn?: boolean
  onLogout?: () => void
  transparent?: boolean
  /** 어두운 표면 위 오버레이용 — PC 로고·텍스트 흰색 반전. 모바일 바는 적용하지 않음 */
  inverse?: boolean
  /** active/indicator까지 흰색 (headerTheme=inverse, PC only) */
  onDarkSurface?: boolean
}

export function Header({
  isLoggedIn,
  onLogout,
  transparent,
  inverse,
  onDarkSurface,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const gnb = useSiteGnb()

  return (
    <>
      <HeaderMobile
        transparent={transparent}
        isMenuOpen={isMobileMenuOpen}
        onMenuOpen={() => setIsMobileMenuOpen(true)}
      />
      <HeaderDesktop
        groups={gnb.groups}
        isLoggedIn={isLoggedIn}
        onLogout={onLogout}
        transparent={transparent}
        inverse={inverse}
        onDarkSurface={onDarkSurface}
      />
      <HeaderMobileMenu
        groups={gnb.groups}
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isLoggedIn={isLoggedIn}
        onLogout={onLogout}
      />
    </>
  )
}
