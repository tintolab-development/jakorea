import { useEffect, useState, type ReactNode } from 'react'
import { clearAdminRegisteredWizardState } from '@/features/auth/admin-registered'
import { ScrollRestoration, useLocation, useNavigate } from 'react-router-dom'
import { isTalentDonationApplyPath } from '@/features/talent-donation'
import { postPortalAuthLogout } from '@/shared/api/axios-instance'
import {
  DEV_AUTH_CHANGE_EVENT,
  clearAuthTokens,
  getDevAuthLoggedIn,
  getRefreshToken,
  setDevAuthLoggedIn,
} from '@/shared/lib'
import type { LayoutVariant } from '@/widgets/layout/layout-variant'
import { AuthPageShell } from '@/widgets/layout/auth-page-shell'
import { ContentShell } from '@/widgets/layout/content-shell'
import styles from './app-layout.module.css'
import { Footer } from './footer'
import { Header } from './header/header'
import { TopBannerStrip } from './top-banner-strip'

type AppLayoutProps = {
  children: ReactNode
  layout?: LayoutVariant
}

export function AppLayout({ children, layout = 'default' }: AppLayoutProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [isLoggedIn, setIsLoggedIn] = useState(getDevAuthLoggedIn)
  const isMypageHome = layout === 'mypage'
  const isMypage = isMypageHome || layout === 'mypage-subpage'
  const isHero = layout === 'hero'
  const isAuth = layout === 'auth'
  const isHome = layout === 'home'
  const isSupport = layout === 'support'
  const isIntroduction = layout === 'introduction'
  /** 재능기부 신청 폼 — 히어로 오버레이(음수 margin·투명 헤더) 제외 */
  const isSupportHero = isSupport && !isTalentDonationApplyPath(pathname)
  const useContentShell = layout === 'default' || isHero
  const transparentHeader =
    isMypageHome || isHero || isHome || isSupportHero || isIntroduction
  /* 홈 PC만 반전 — 모바일은 header-mobile CSS에서 불투명·컬러 로고로 덮음 */
  const inverseHeader = isHome

  useEffect(() => {
    const handleDevAuthChange = () => {
      setIsLoggedIn(getDevAuthLoggedIn())
    }

    window.addEventListener(DEV_AUTH_CHANGE_EVENT, handleDevAuthChange)
    return () => window.removeEventListener(DEV_AUTH_CHANGE_EVENT, handleDevAuthChange)
  }, [])

  const handleLogout = () => {
    const refreshToken = getRefreshToken()
    void (async () => {
      if (refreshToken) {
        try {
          await postPortalAuthLogout(refreshToken)
        } catch {
          // 로컬 세션은 항상 정리
        }
      }
      clearAuthTokens()
      clearAdminRegisteredWizardState()
      setDevAuthLoggedIn(false)
      setIsLoggedIn(false)
      navigate('/')
    })()
  }

  const mainContent = useContentShell ? (
    <ContentShell>{children}</ContentShell>
  ) : isAuth ? (
    <AuthPageShell>{children}</AuthPageShell>
  ) : (
    children
  )

  const mainClassName = isMypage
    ? styles.mainMypage
    : isHome
      ? styles.mainHome
      : isSupportHero
        ? styles.mainSupport
        : isIntroduction
          ? styles.mainIntroduction
          : styles.main

  return (
    <div className={styles.layout}>
      <ScrollRestoration />
      {isHome ? <TopBannerStrip /> : null}
      <Header
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        transparent={transparentHeader}
        inverse={inverseHeader}
      />
      <main className={mainClassName}>{mainContent}</main>
      <Footer />
    </div>
  )
}
