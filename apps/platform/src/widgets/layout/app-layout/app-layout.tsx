import { useEffect, useState, type ReactNode } from 'react'
import { ScrollRestoration, useNavigate } from 'react-router-dom'
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
  const [isLoggedIn, setIsLoggedIn] = useState(getDevAuthLoggedIn)
  const isMypage = layout === 'mypage'
  const isHero = layout === 'hero'
  const isAuth = layout === 'auth'
  const isHome = layout === 'home'
  const useContentShell = layout === 'default' || isHero
  const transparentHeader = isMypage || isHero || isHome

  useEffect(() => {
    const handleDevAuthChange = (event: Event) => {
      const detail = (event as CustomEvent<{ isLoggedIn: boolean }>).detail
      if (typeof detail?.isLoggedIn === 'boolean') {
        setIsLoggedIn(detail.isLoggedIn)
      }
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

  const mainClassName = isMypage ? styles.mainMypage : isHome ? styles.mainHome : styles.main

  return (
    <div className={styles.layout}>
      <ScrollRestoration />
      {isHome ? <TopBannerStrip /> : null}
      <Header
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        transparent={transparentHeader}
        inverse={isHome}
      />
      <main className={mainClassName}>{mainContent}</main>
      <Footer />
    </div>
  )
}
