import type { ReactNode } from 'react'
import { PFText } from '@/shared/ui'
import styles from './session-card-header.module.css'

type EducationSessionCardHeaderProps = {
  badge: ReactNode
  date: string
  subtitle?: ReactNode
  aside?: ReactNode
}

export function EducationSessionCardHeader({
  badge,
  date,
  subtitle,
  aside,
}: EducationSessionCardHeaderProps) {
  return (
    <div className={styles.top}>
      <div className={styles.meta}>
        {badge}
        <PFText as="span" typo="hd-sm" className={styles.date}>
          {date}
        </PFText>
        {subtitle}
      </div>
      {aside ? <div className={styles.aside}>{aside}</div> : null}
    </div>
  )
}
