import styles from './pf-tabs.module.css'

export type PFTabsVariant = 'underline' | 'pill' | 'category'
export type PFTabsUnderlineStyle = 'isolated' | 'bordered'
export type PFTabsSize = 'large' | 'medium'

export type PFTabItem = {
  key: string
  label: string
  badge?: number | string
  disabled?: boolean
}

export type PFTabsProps = {
  items: PFTabItem[]
  value: string
  onChange: (key: string) => void
  variant?: PFTabsVariant
  underlineStyle?: PFTabsUnderlineStyle
  size?: PFTabsSize
  className?: string
  ariaLabel?: string
}

export function PFTabs({
  items,
  value,
  onChange,
  variant = 'underline',
  underlineStyle = 'bordered',
  size = 'large',
  className,
  ariaLabel = '탭',
}: PFTabsProps) {
  if (items.length === 0) return null

  const rootClassName = [
    styles.tabs,
    styles[variant],
    variant === 'underline' ? styles[underlineStyle] : undefined,
    variant === 'pill' ? styles[size] : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const handleSelect = (key: string, disabled?: boolean) => {
    if (disabled || key === value) return

    onChange(key)
  }

  return (
    <nav className={rootClassName} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const isActive = item.key === value

        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            className={[styles.tab, isActive ? styles.active : undefined].filter(Boolean).join(' ')}
            onClick={() => handleSelect(item.key, item.disabled)}
          >
            <span className={styles.label}>{item.label}</span>
            {variant === 'underline' && item.badge != null ? (
              <span className={styles.badge}>{item.badge}</span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}
