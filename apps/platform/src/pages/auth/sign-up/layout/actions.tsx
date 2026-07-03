import type { ReactNode } from 'react'
import styles from '../wizard.module.css'

type SignUpActionsProps = {
  variant: 'default' | 'terms'
  children: ReactNode
}

export function SignUpActions({ variant, children }: SignUpActionsProps) {
  const className = variant === 'terms' ? styles['terms-actions'] : styles.actions

  return <div className={className}>{children}</div>
}
