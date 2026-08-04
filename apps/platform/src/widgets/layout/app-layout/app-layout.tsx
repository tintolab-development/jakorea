import { useEffect, useState, type ReactNode } from 'react'
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

type AppLayoutProps = {
  children: ReactNode
  layout?: LayoutVariant
}

export function AppLayout({ children, layout = 'default' }: AppLayoutProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(getDevAuthLoggedIn)
  const isMypage = layout === 'mypage'
  const isHero = layout === 'hero'
  const isAuth = layout === 'auth'
  const useContentShell = layout === 'default' || isHero
  const transparentHeader = isMypage || isHero

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
      window.location.assign('/')
    })()
  }

  const mainContent = useContentShell ? (
    <ContentShell>{children}</ContentShell>
  ) : isAuth ? (
    <AuthPageShell>{children}</AuthPageShell>
  ) : (
    children
  )

  return (
    <div className={styles.layout}>
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} transparent={transparentHeader} />
      <main className={isMypage ? styles.mainMypage : styles.main}>{mainContent}</main>
      <Footer />
    </div>
  )
}
