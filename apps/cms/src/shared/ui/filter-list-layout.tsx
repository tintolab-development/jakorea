/**
 * 목록 페이지 공통 레이아웃: 상단 UnifiedFilterCard · 리스트 헤더(제목·건수·액션) · 본문(테이블)
 *
 * `fields` 항목은 {@link FilterFieldConfig} 기준이며, `width`·`flex`·`style`로 칸 너비를 지정할 수 있다.
 */

import type { ReactNode } from 'react'
import {
  UnifiedFilterCard,
  type FilterFieldConfig,
  type UnifiedFilterCardProps,
} from './unified-filter-card'
import './filter-list-layout.css'

export type { FilterFieldConfig, UnifiedFilterCardProps }

export interface FilterListLayoutProps extends UnifiedFilterCardProps {
  /** 제목·건수·우측 버튼 등 */
  listHeader?: ReactNode
  /** 테이블 및 부가 UI(센티넬 등) */
  children: ReactNode
  /** 루트에 합칠 클래스 (예: program-list-content-wrapper) */
  className?: string
}

export function FilterListLayout({
  listHeader,
  children,
  className,
  ...unifiedFilterCardProps
}: FilterListLayoutProps) {
  const rootClass = ['filter-list-layout', className].filter(Boolean).join(' ')
  return (
    <div className={rootClass}>
      <div className="filter-list-layout__filter">
        <UnifiedFilterCard {...unifiedFilterCardProps} />
      </div>
      {listHeader != null ? <div className="filter-list-layout__header">{listHeader}</div> : null}
      <div className="filter-list-layout__body">{children}</div>
    </div>
  )
}
