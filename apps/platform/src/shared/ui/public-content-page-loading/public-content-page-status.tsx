import type { ReactNode } from 'react'
import styles from './public-content-page-loading.module.css'

type PublicContentPageStatusProps = {
  children: ReactNode
  className?: string
  /** viewport — 전체 본문 중앙 · inline — 히어로 아래 · list — 목록/그리드 슬롯 */
  layout?: 'viewport' | 'inline' | 'list'
}

export function PublicContentPageStatus({
  children,
  className,
  layout = 'viewport',
}: PublicContentPageStatusProps) {
  const layoutClass =
    layout === 'viewport'
      ? styles.pageStatusViewport
      : layout === 'list'
        ? styles.pageStatusList
        : styles.pageStatusInline

  const rootClassName = [layoutClass, className]
    .filter(Boolean)
    .join(' ')

  return <div className={rootClassName}>{children}</div>
}
