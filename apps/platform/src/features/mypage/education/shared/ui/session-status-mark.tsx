import type { ReactNode } from 'react'
import { PFText } from '@/shared/ui'
import styles from './session-status-mark.module.css'

export type EducationSessionStatusMarkTone = 'success' | 'alert' | 'muted' | 'neutral'

type EducationSessionStatusMarkProps = {
  tone: EducationSessionStatusMarkTone
  label: string
  iconSrc?: string
  extra?: ReactNode
}

export function EducationSessionStatusMark({
  tone,
  label,
  iconSrc,
  extra,
}: EducationSessionStatusMarkProps) {
  return (
    <div className={[styles.mark, styles[tone]].join(' ')}>
      {iconSrc ? (
        <img className={styles.icon} src={iconSrc} alt="" width={32} height={32} aria-hidden="true" />
      ) : null}
      <PFText as="span" typo="hl-sm" className={styles.label}>
        {label}
      </PFText>
      {extra}
    </div>
  )
}
