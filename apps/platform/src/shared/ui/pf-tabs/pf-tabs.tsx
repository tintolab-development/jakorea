import { useDragScroll } from '@/shared/hooks/use-drag-scroll'
import styles from './pf-tabs.module.css'

export type PFTabsVariant = 'underline' | 'pill' | 'category'
export type PFTabsUnderlineStyle = 'isolated' | 'bordered'
/** pill: large·medium. underline: small만 적용(16px·44px·가로 스크롤) */
export type PFTabsSize = 'large' | 'medium' | 'small'

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
  /**
   * true면 가로 스크롤 탭을 마우스로 누른 채 끌어 스크롤한다.
   * 임계 거리 이상 끌었으면 손을 뗄 때 탭을 선택하지 않는다.
   */
  dragScroll?: boolean
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
  dragScroll = false,
}: PFTabsProps) {
  const { containerRef, dragScrollHandlers } = useDragScroll<HTMLElement>()

  if (items.length === 0) return null

  const rootClassName = [
    styles.tabs,
    styles[variant],
    variant === 'underline' ? styles[underlineStyle] : undefined,
    variant === 'pill' || (variant === 'underline' && size === 'small') ? styles[size] : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const handleSelect = (key: string, disabled?: boolean) => {
    if (disabled || key === value) return

    onChange(key)
  }

  return (
    <nav
      ref={containerRef}
      className={rootClassName}
      role="tablist"
      aria-label={ariaLabel}
      {...(dragScroll ? dragScrollHandlers : undefined)}
    >
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
