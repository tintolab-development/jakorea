import type { ReactNode } from 'react'
import styles from './auth-page-shell.module.css'

type AuthPageShellProps = {
  children: ReactNode
  className?: string
  containerClassName?: string
  fill?: boolean
}

export function AuthPageShell({
  children,
  className,
  containerClassName,
  fill = false,
}: AuthPageShellProps) {
  const pageClassName = [styles.page, fill ? styles.pageFill : null, className]
    .filter(Boolean)
    .join(' ')
  const innerClassName = [
    styles.container,
    fill ? styles.containerFill : null,
    containerClassName,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={pageClassName}>
      <div className={innerClassName}>{children}</div>
    </div>
  )
}
