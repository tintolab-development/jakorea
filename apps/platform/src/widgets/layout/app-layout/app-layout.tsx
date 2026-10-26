import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { clearAdminRegisteredWizardState } from '@/features/auth/admin-registered'
import { clearInstructorApplySessionCache } from '@/features/mypage/instructor-apply/lib/instructor-apply-session-cache'
import { postPortalLogout } from '@/features/auth/sign-in'
import { ScrollRestoration, useLocation, useNavigate } from 'react-router-dom'
import { parseProgramRoute } from '@/features/program/lib/routes'
import { isTalentDonationApplyPath } from '@/features/talent-donation'
import {
  DEV_AUTH_CHANGE_EVENT,
  clearAuthTokens,
  getDevAuthLoggedIn,
  getFileUploadOverlayActive,
  getFileUploadOverlayServerSnapshot,
  getRefreshToken,
  setDevAuthLoggedIn,
  subscribeFileUploadOverlay,
} from '@/shared/lib'
import { PFLoadingSpinner } from '@/shared/ui'
import { SiteDocumentHead } from '@/features/site-shell'
import type { HeaderTheme } from '@/widgets/layout/header-theme'
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
  headerTheme?: HeaderTheme
}

export function AppLayout({
  children,
  layout = 'default',
  headerTheme = 'default',
}: AppLayoutProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [isLoggedIn, setIsLoggedIn] = useState(getDevAuthLoggedIn)
  const isMypageHome = layout === 'mypage'
  const isMypage = isMypageHome || layout === 'mypage-subpage'
  const isHero = layout === 'hero'
  const isAuth = layout === 'auth'
  const isPublicForm = layout === 'public-form'
  const isHome = layout === 'home'
  const isSupport = layout === 'support'
  const isIntroduction = layout === 'introduction'
  /** 재능기부 신청 폼 — 히어로 오버레이(음수 margin·투명 헤더) 제외 */
  const isSupportHero = isSupport && !isTalentDonationApplyPath(pathname)
  /** 상세는 자체 셸을 쓰므로 ContentShell을 한 번 더 씌우지 않는다. 목록과 같은 레이아웃에 두어 헤더가 다시 마운트되지 않게 한다. */
  const skipContentShell = parseProgramRoute(pathname)?.name === 'detail'
  const useContentShell = (layout === 'default' || isHero) && !skipContentShell
  const transparentHeader =
    isMypageHome || isHero || isHome || isSupportHero || isIntroduction
  /* 홈은 기존처럼 PC inverse. 그 외는 route의 headerTheme만 사용. 모바일 바는 theme 무관 */
  const inverseHeader = headerTheme === 'inverse' || isHome
  const fileUploadActive = useSyncExternalStore(
    subscribeFileUploadOverlay,
    getFileUploadOverlayActive,
    getFileUploadOverlayServerSnapshot,
  )

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
          await postPortalLogout(refreshToken)
        } catch {
          // 로컬 세션은 항상 정리
        }
      }
      clearAuthTokens()
      clearAdminRegisteredWizardState()
      clearInstructorApplySessionCache()
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
          : isPublicForm
            ? styles.mainPublic
            : styles.main

  return (
    <div className={styles.layout}>
      <SiteDocumentHead />
      <ScrollRestoration />
      {isHome ? <TopBannerStrip /> : null}
      {isPublicForm ? null : (
        <Header
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          transparent={transparentHeader}
          inverse={inverseHeader}
          onDarkSurface={headerTheme === 'inverse'}
        />
      )}
      <main className={mainClassName} data-pf-main="true">
        {mainContent}
      </main>
      {isPublicForm ? null : <Footer />}
      {fileUploadActive ? (
        <PFLoadingSpinner blocking label="파일을 업로드하는 중" />
      ) : null}
    </div>
  )
}
