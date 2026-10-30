import type { ReactNode } from 'react'

import './filter-table-layout.css'

export interface FilterTableLayoutProps {
  /** 필터·조회 슬롯. CMS TableFilterGroup 대신 앱이 컨트롤을 넣는다. */
  filter?: ReactNode
  showFilter?: boolean
  title?: ReactNode
  showTitle?: boolean
  titleNote?: ReactNode
  description?: ReactNode
  /** 툴바 우측 액션. Excel/권한은 호출 측에서 전달. */
  actions?: ReactNode
  topNav?: ReactNode
  children?: ReactNode
  className?: string
}

export function FilterTableLayout({
  filter,
  showFilter = true,
  title,
  showTitle = true,
  titleNote,
  description,
  actions,
  topNav,
  children,
  className,
}: FilterTableLayoutProps) {
  const toolbarTitle = showTitle ? title : null
  const showToolbar =
    toolbarTitle != null || titleNote != null || description != null || actions != null
  const showFilterSlot = showFilter && filter != null

  const rootClass = [
    'filter-table-layout',
    !showFilterSlot && 'filter-table-layout--without-filter',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass}>
      {showFilterSlot ? (
        <>
          <div className="filter-table-layout__filter">{filter}</div>
          <div className="filter-table-layout__divider" role="separator" aria-hidden />
        </>
      ) : null}

      {topNav != null ? <div className="filter-table-layout__top-nav">{topNav}</div> : null}

      {showToolbar ? (
        <div className="filter-table-layout__toolbar">
          <div className="filter-table-layout__toolbar-main">
            {toolbarTitle != null ? (
              <div className="filter-table-layout__title table-title">{toolbarTitle}</div>
            ) : null}
            {titleNote != null ? (
              <div className="filter-table-layout__title-note">{titleNote}</div>
            ) : null}
            {description != null ? (
              <div className="filter-table-layout__description table-description">
                {description}
              </div>
            ) : null}
          </div>
          {actions != null ? (
            <div className="filter-table-layout__toolbar-actions">
              <div className="filter-table-layout__toolbar-actions-slot table-header-actions--wrapper">
                {actions}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="filter-table-layout__table">{children}</div>
    </div>
  )
}
