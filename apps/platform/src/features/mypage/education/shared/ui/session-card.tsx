import type { ReactNode } from 'react'
import styles from './session-card.module.css'

type EducationSessionCardProps = {
  tone?: 'default' | 'danger'
  className?: string
  children: ReactNode
}

export function EducationSessionCard({
  tone = 'default',
  className,
  children,
}: EducationSessionCardProps) {
  const cardClassName = [styles.card, tone === 'danger' ? styles.danger : undefined, className]
    .filter(Boolean)
    .join(' ')

  return <article className={cardClassName}>{children}</article>
}
