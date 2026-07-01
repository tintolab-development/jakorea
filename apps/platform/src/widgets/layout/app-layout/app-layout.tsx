import { useState, type ReactNode } from 'react'
import { getDevAuthLoggedIn, setDevAuthLoggedIn } from '@/shared/lib'
import styles from './app-layout.module.css'
import { Footer } from './footer'
import { Header } from './header'

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(getDevAuthLoggedIn)

  const handleLogout = () => {
    setDevAuthLoggedIn(false)
    setIsLoggedIn(false)
    window.location.assign('/')
  }

  return (
    <div className={styles.layout}>
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  )
}
