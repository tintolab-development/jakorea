/**
 * 페이지·슬롯 로딩 스피너 (CMS page-content-loading 미러)
 * TanStack Query isLoading 시 empty보다 먼저 표시.
 */

import { Spin } from 'antd'
import './page-content-loading.css'

export type PageContentLoadingVariant = 'default' | 'viewport' | 'table-slot'

export type PageContentLoadingProps = {
  variant?: PageContentLoadingVariant
  /** 기본: 로딩 중 */
  'aria-label'?: string
  className?: string
}

const VARIANT_CLASS: Record<PageContentLoadingVariant, string> = {
  default: 'page-content-loading',
  viewport: 'page-content-loading page-content-loading--viewport',
  'table-slot': 'page-content-loading page-content-loading--table-slot',
}

export function PageContentLoading({
  variant = 'default',
  'aria-label': ariaLabel = '로딩 중',
  className,
}: PageContentLoadingProps) {
  const classes = [VARIANT_CLASS[variant], className].filter(Boolean).join(' ')
  return (
    <div className={classes} role="status" aria-label={ariaLabel}>
      <Spin size="large" />
    </div>
  )
}
