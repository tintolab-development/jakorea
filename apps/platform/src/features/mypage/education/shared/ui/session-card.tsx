import type { ReactNode } from 'react'
import styles from './session-card.module.css'

type EducationSessionCardProps = {
  tone?: 'default' | 'danger'
  children: ReactNode
}

export function EducationSessionCard({ tone = 'default', children }: EducationSessionCardProps) {
  const className = [styles.card, tone === 'danger' ? styles.danger : undefined]
    .filter(Boolean)
    .join(' ')

  return <article className={className}>{children}</article>
}
