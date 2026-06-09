import type { ReactNode } from 'react'
import styles from './app-layout.module.css'

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.logo}>JaKorea Platform</span>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerText}>© JaKorea</p>
        </div>
      </footer>
    </div>
  )
}
