import type { ReactNode } from 'react'
import styles from './pf-state-badge.module.css'

export type PFStateBadgeSize = 'large' | 'small'
export type PFStateBadgeTone = 'progress' | 'success' | 'error' | 'disabled'

export type PFStateBadgeProps = {
  size?: PFStateBadgeSize
  tone?: PFStateBadgeTone
  className?: string
  children: ReactNode
}

const sizeTypographyClassMap: Record<PFStateBadgeSize, string> = {
  large: 'typo-bd-md-sb',
  small: 'typo-bd-sm-sb',
}

export function PFStateBadge({
  size = 'large',
  tone = 'progress',
  className,
  children,
}: PFStateBadgeProps) {
  const badgeClassName = [styles.badge, styles[size], styles[tone], sizeTypographyClassMap[size], className]
    .filter(Boolean)
    .join(' ')

  return <span className={badgeClassName}>{children}</span>
}
