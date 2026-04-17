/**
 * 목록 페이지용 레이아웃: UnifiedFilterCard → 구분선 → 테이블 제목·설명·버튼(actions) → 테이블(children)
 *
 * `fields` 등 필터 설정은 {@link TableFilterGroupProps}와 동일합니다.
 */

import type { ReactNode } from 'react'
import { Divider } from '@/shared/components/divider'
import './filter-table-layout.css'
import {
  TableFilterGroup,
  type FilterFieldConfig,
  type TableFilterGroupProps,
} from './table-filter-group'

export type { FilterFieldConfig, TableFilterGroupProps }

export interface FilterTableLayoutProps extends TableFilterGroupProps {
  /** 테이블 상단 제목 */
  title?: ReactNode
  /** 테이블 상단 보조 설명(건수 등) */
  description?: ReactNode
  /** 헤더 우측 버튼·액션 */
  actions?: ReactNode
  /** 구분선과 제목 사이에 노출할 상단 내비게이션(탭 등) */
  topNav?: ReactNode
  /** 필터·헤더 아래 테이블 본문 */
  children?: ReactNode
  className?: string
}

export function FilterTableLayout({
  title,
  description,
  actions,
  topNav,
  children,
  className,
  ...TableFilterGroupProps
}: FilterTableLayoutProps) {
  const rootClass = ['filter-table-layout', className].filter(Boolean).join(' ')
  const showToolbar = title != null || description != null || actions != null

  return (
    <div className={rootClass}>
      <div className="filter-table-layout__filter">
        <TableFilterGroup {...TableFilterGroupProps} />
      </div>

      <div className="filter-table-layout__divider">
        <Divider />
      </div>

      {topNav != null ? <div className="filter-table-layout__top-nav">{topNav}</div> : null}

      {showToolbar ? (
        <div className="filter-table-layout__toolbar">
          <div className="filter-table-layout__toolbar-main">
            {title != null ? <div className="filter-table-layout__title">{title}</div> : null}
            {description != null ? (
              <div className="filter-table-layout__description">{description}</div>
            ) : null}
          </div>
          {actions != null ? (
            <div className="filter-table-layout__toolbar-actions">{actions}</div>
          ) : null}
        </div>
      ) : null}

      <div className="filter-table-layout__table">{children}</div>
    </div>
  )
}
