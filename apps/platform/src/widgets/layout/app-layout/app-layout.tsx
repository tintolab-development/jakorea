import type { ReactNode } from 'react'
import styles from './app-layout.module.css'
import { Footer } from './footer'
import { Header } from './header'

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  )
}
