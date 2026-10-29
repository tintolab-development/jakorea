import type { ReactNode } from 'react'
import { joinClassNames } from '../lib/join-class-names.js'
import { AdminTextTabs } from './admin-text-tabs.js'

export type AdminPageTabItem<Value extends string = string> = {
  label: ReactNode
  value: Value
  disabled?: boolean
  count?: number
  title?: string
}

export type AdminPageTabsSize = 'page' | 'section'

export type AdminPageTabsProps<Value extends string = string> = {
  items: readonly AdminPageTabItem<Value>[]
  value: Value
  onChange: (value: Value) => void
  disabled?: boolean
  size?: AdminPageTabsSize
  className?: string
  wrap?: boolean
  trailing?: ReactNode
  'aria-label'?: string
}

/**
 * 페이지/섹션 텍스트 탭. 도메인 value·라우팅은 호출 측에서만 처리한다.
 */
export function AdminPageTabs<Value extends string = string>({
  items,
  value,
  onChange,
  disabled,
  size = 'page',
  className,
  wrap,
  trailing,
  'aria-label': ariaLabel = '탭',
}: AdminPageTabsProps<Value>) {
  return (
    <AdminTextTabs
      activeKey={value}
      onChange={onChange}
      disabled={disabled}
      variant="list"
      wrap={wrap}
      trailing={trailing}
      ariaLabel={ariaLabel}
      className={joinClassNames(
        'admin-page-tabs',
        size === 'section' ? 'admin-page-tabs--section' : 'admin-page-tabs--page',
        className
      )}
      items={items.map(item => ({
        key: item.value,
        label: item.label,
        disabled: item.disabled,
        count: item.count,
        title: item.title,
      }))}
    />
  )
}
