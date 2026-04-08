/**
 * 목록 페이지 조합: UnifiedFilterCard(FilterListLayout) + 구분선 + ViewModeController + 선택 children(테이블 슬롯)
 * 도메인 로직 없음 — 컴포넌트 연결만 담당
 */

import type { ReactNode } from 'react'
import { FilterListLayout, type UnifiedFilterCardProps } from '../filter-list-layout'
import { ViewModeController, type ViewModeToggleOption } from '../view-mode'
import './list-page-layout.css'

export type ListPageLayoutProps<T extends string = string> = UnifiedFilterCardProps & {
  viewMode: T
  onViewModeChange: (v: T) => void
  viewModeOptions: readonly ViewModeToggleOption<T>[]
  renderHeader: (viewMode: T) => ReactNode
  renderContent: (viewMode: T) => ReactNode
  className?: string
  children?: ReactNode
}

function tableShell(inner: ReactNode) {
  return <div className="list-page-layout__table-shell">{inner}</div>
}

export function ListPageLayout<T extends string>({
  viewMode,
  onViewModeChange,
  viewModeOptions,
  renderHeader,
  renderContent,
  className,
  children,
  ...filterProps
}: ListPageLayoutProps<T>) {
  const rootClass = ['list-page-layout', className].filter(Boolean).join(' ')

  return (
    <FilterListLayout
      {...filterProps}
      className={rootClass}
      listHeader={
        <>
          <div className="participating-institutions-section__divider" />
          <div className="participating-institutions-section__below-divider">
            <ViewModeController<T>
              value={viewMode}
              onChange={onViewModeChange}
              options={viewModeOptions}
              renderHeader={renderHeader}
              renderContent={mode => tableShell(renderContent(mode))}
            />
          </div>
        </>
      }
    >
      {children != null ? tableShell(children) : null}
    </FilterListLayout>
  )
}
