import type { ReactNode } from 'react'
import styles from './pf-category-badge.module.css'

export type PFCategoryBadgeSize = 'large' | 'small'
export type PFCategoryBadgeVariant = 'primary' | 'secondary' | 'closed'
export type PFCategoryBadgeIconVariant = 'primary' | 'secondary'

export type PFCategoryBadgeProps = {
  size?: PFCategoryBadgeSize
  variant?: PFCategoryBadgeVariant
  icon?: ReactNode
  iconVariant?: PFCategoryBadgeIconVariant
  className?: string
  children: ReactNode
}

const sizeTypographyClassMap: Record<PFCategoryBadgeSize, string> = {
  large: 'typo-bd-md-sb',
  small: 'typo-bd-sm-sb',
}

const sizeWithIconTypographyClassMap: Record<PFCategoryBadgeSize, string> = {
  large: 'typo-bd-sm-sb',
  small: 'typo-label-md',
}

export function PFCategoryBadge({
  size = 'large',
  variant = 'primary',
  icon,
  iconVariant = 'secondary',
  className,
  children,
}: PFCategoryBadgeProps) {
  const hasIcon = icon != null

  const badgeClassName = [
    styles.badge,
    hasIcon ? (size === 'large' ? styles.largeWithIcon : styles.smallWithIcon) : styles[size],
    hasIcon ? styles[iconVariant === 'primary' ? 'iconPrimary' : 'iconSecondary'] : styles[variant],
    hasIcon ? sizeWithIconTypographyClassMap[size] : sizeTypographyClassMap[size],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={badgeClassName}>
      {hasIcon ? <span className={styles.iconSlot}>{icon}</span> : null}
      <span className={styles.label}>{children}</span>
    </span>
  )
}
