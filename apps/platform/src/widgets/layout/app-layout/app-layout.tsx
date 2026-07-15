import { useState, type ReactNode } from 'react'
import { getDevAuthLoggedIn, setDevAuthLoggedIn } from '@/shared/lib'
import type { LayoutVariant } from '@/widgets/layout/layout-variant'
import { ContentShell } from '@/widgets/layout/content-shell'
import styles from './app-layout.module.css'
import { Footer } from './footer'
import { Header } from './header'

type AppLayoutProps = {
  children: ReactNode
  layout?: LayoutVariant
}

export function AppLayout({ children, layout = 'default' }: AppLayoutProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(getDevAuthLoggedIn)
  const isMypage = layout === 'mypage'
  const useContentShell = layout === 'default'

  const handleLogout = () => {
    setDevAuthLoggedIn(false)
    setIsLoggedIn(false)
    window.location.assign('/')
  }

  return (
    <div className={styles.layout}>
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} transparent={isMypage} />
      <main className={isMypage ? styles.mainMypage : styles.main}>
        {useContentShell ? <ContentShell>{children}</ContentShell> : children}
      </main>
      <Footer />
    </div>
  )
}
