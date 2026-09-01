import type { ReactNode } from 'react'
import styles from './auth-page-shell.module.css'

type AuthPageShellProps = {
  children: ReactNode
  className?: string
  containerClassName?: string
}

export function AuthPageShell({ children, className, containerClassName }: AuthPageShellProps) {
  const pageClassName = [styles.page, className].filter(Boolean).join(' ')
  const innerClassName = [styles.container, containerClassName].filter(Boolean).join(' ')

  return (
    <div className={pageClassName}>
      <div className={innerClassName}>{children}</div>
    </div>
  )
}
