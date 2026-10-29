import type { ReactNode } from 'react'
import { joinClassNames } from '../lib/join-class-names.js'
import './admin-text-tabs.css'

export type AdminTextTabItem<Key extends string = string> = {
  key: Key
  label: ReactNode
  disabled?: boolean
  title?: string
  count?: number
}

export type AdminTextTabsVariant = 'detail' | 'list'

export type AdminTextTabsProps<Key extends string = string> = {
  activeKey: Key
  onChange: (key: Key) => void
  items: readonly AdminTextTabItem<Key>[]
  trailing?: ReactNode
  variant?: AdminTextTabsVariant
  className?: string
  listClassName?: string
  wrap?: boolean
  ariaLabel?: string
  /** true면 모든 탭 비활성. 라우팅은 호출 측에서 막는다. */
  disabled?: boolean
}

export function AdminTextTabs<Key extends string = string>({
  activeKey,
  onChange,
  items,
  trailing,
  variant = 'detail',
  className,
  listClassName,
  wrap = false,
  ariaLabel = '탭',
  disabled = false,
}: AdminTextTabsProps<Key>) {
  return (
    <div
      className={joinClassNames(
        'cms-text-tabs',
        variant === 'detail' ? 'cms-text-tabs--detail' : 'cms-text-tabs--list',
        className
      )}
    >
      <div className="cms-text-tabs__row">
        <div
          className={joinClassNames(
            'cms-text-tabs__list',
            wrap && 'cms-text-tabs__list--wrap',
            listClassName
          )}
          role="tablist"
          aria-label={ariaLabel}
        >
          {items.map(item => {
            const isActive = activeKey === item.key
            const isDisabled = disabled || Boolean(item.disabled)
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                disabled={isDisabled}
                title={item.title}
                className={joinClassNames(
                  'cms-text-tabs__tab',
                  isActive && 'cms-text-tabs__tab--active'
                )}
                onClick={() => {
                  if (isDisabled || isActive) return
                  onChange(item.key)
                }}
              >
                <span className="cms-text-tabs__tab-label">{item.label}</span>
                {item.count != null ? (
                  <span className="cms-text-tabs__count">{item.count}</span>
                ) : null}
              </button>
            )
          })}
        </div>
        {trailing ? <div className="cms-text-tabs__trailing">{trailing}</div> : null}
      </div>
    </div>
  )
}
