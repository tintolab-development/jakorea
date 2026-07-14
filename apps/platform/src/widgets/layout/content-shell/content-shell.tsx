import type { ReactNode } from 'react'
import styles from './content-shell.module.css'

type ContentShellProps = {
  children: ReactNode
}

export function ContentShell({ children }: ContentShellProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.inner}>{children}</div>
    </div>
  )
}
