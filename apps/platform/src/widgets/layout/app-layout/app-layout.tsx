import { useState, type ReactNode } from 'react'
import { MYPAGE_PATH } from '@/features/mypage'
import { getDevAuthLoggedIn, setDevAuthLoggedIn } from '@/shared/lib'
import styles from './app-layout.module.css'
import { Footer } from './footer'
import { Header } from './header'

type AppLayoutProps = {
  children: ReactNode
}

function isMypagePath(pathname: string) {
  return pathname === MYPAGE_PATH || pathname.startsWith(`${MYPAGE_PATH}/`)
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(getDevAuthLoggedIn)
  const isMypage = isMypagePath(window.location.pathname)

  const handleLogout = () => {
    setDevAuthLoggedIn(false)
    setIsLoggedIn(false)
    window.location.assign('/')
  }

  return (
    <div className={styles.layout}>
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} transparent={isMypage} />
      <main className={isMypage ? styles['main-mypage'] : styles.main}>{children}</main>
      <Footer />
    </div>
  )
}
