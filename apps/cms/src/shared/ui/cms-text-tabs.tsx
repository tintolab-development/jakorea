/**
 * 민트 밑줄 텍스트 탭 — 프로그램 상세·등록·권한 승인 등 공통
 * (비활성 #7D7D7D / 활성 JA-mint-01 + 2px 하단 스트로크, 탭 배경 없음)
 */

import type { ReactNode } from 'react'
import './cms-text-tabs.css'

export type CmsTextTabItem<Key extends string = string> = {
  key: Key
  label: ReactNode
  disabled?: boolean
  title?: string
}

export type CmsTextTabsVariant = 'detail' | 'list'

export type CmsTextTabsProps<Key extends string = string> = {
  activeKey: Key
  onChange: (key: Key) => void
  items: readonly CmsTextTabItem<Key>[]
  /** 탭 행 우측 (저장·미리보기 등) */
  trailing?: ReactNode
  /**
   * `detail`(기본): 상·하 패딩 — 프로그램 상세 등
   * `list`: 행 패딩 없음 — 목록에서 연 등록 플로우
   */
  variant?: CmsTextTabsVariant
  className?: string
  listClassName?: string
  /** 좁은 폭에서 탭 줄바꿈 */
  wrap?: boolean
  ariaLabel?: string
}

function joinClasses(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function CmsTextTabs<Key extends string = string>({
  activeKey,
  onChange,
  items,
  trailing,
  variant = 'detail',
  className,
  listClassName,
  wrap = false,
  ariaLabel = '탭',
}: CmsTextTabsProps<Key>) {
  return (
    <div
      className={joinClasses(
        'cms-text-tabs',
        variant === 'detail' ? 'cms-text-tabs--detail' : 'cms-text-tabs--list',
        className
      )}
    >
      <div className="cms-text-tabs__row">
        <div
          className={joinClasses('cms-text-tabs__list', wrap && 'cms-text-tabs__list--wrap', listClassName)}
          role="tablist"
          aria-label={ariaLabel}
        >
          {items.map(item => {
            const isActive = activeKey === item.key
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                disabled={item.disabled}
                title={item.title}
                className={joinClasses(
                  'cms-text-tabs__tab',
                  isActive && 'cms-text-tabs__tab--active'
                )}
                onClick={() => {
                  if (item.disabled || isActive) return
                  onChange(item.key)
                }}
              >
                <span className="cms-text-tabs__tab-label">{item.label}</span>
              </button>
            )
          })}
        </div>
        {trailing ? <div className="cms-text-tabs__trailing">{trailing}</div> : null}
      </div>
    </div>
  )
}
