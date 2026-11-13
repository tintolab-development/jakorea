import type { ReactNode } from 'react'
import { PFText } from '@/shared/ui'
import styles from './session-card-header.module.css'

type EducationSessionCardHeaderProps = {
  badge: ReactNode
  date: string
  subtitle?: ReactNode
  aside?: ReactNode
  /** PC 미만에서 aside를 메타 아래로 쌓고 꽉 채움 (opt-in, 기본 off) */
  mobileStack?: boolean
}

export function EducationSessionCardHeader({
  badge,
  date,
  subtitle,
  aside,
  mobileStack = false,
}: EducationSessionCardHeaderProps) {
  return (
    <div className={[styles.top, mobileStack ? styles.mobileStack : undefined].filter(Boolean).join(' ')}>
      {/* Figma 11001:285665 — 상태 배지 · 일자 · 일시/차시가 한 줄 (일시는 일자 오른쪽) */}
      <div className={styles.meta}>
        {badge}
        <PFText as="span" typo="hd-sm" color="black" className={styles.date}>
          {date}
        </PFText>
        {subtitle}
      </div>
      {aside ? <div className={styles.aside}>{aside}</div> : null}
    </div>
  )
}
