/**
 * 목록 페이지용 레이아웃: UnifiedFilterCard → 구분선 → 테이블 제목·설명·버튼(actions) → 테이블(children)
 *
 * `fields` 등 필터 설정은 {@link TableFilterGroupProps}와 동일합니다.
 *
 * **엑셀 다운로드**
 * - 기본: 툴바 우측에 {@link ExcelButton} 노출 — `excelExport` 또는 `onExcelDownload` 연결 필요
 * - `hideExcelDownload`: 엑셀 버튼을 다른 위치에 둘 때 숨김 (예: 탭 nav 우측, 풀페이지 헤더)
 * - `excelExport`: columns·data 전달 시 {@link useTableExcelExport} 자동 연결 (파일명은 `title` 기반)
 * - `onExcelDownload`가 있으면 `excelExport`보다 우선
 */

import { useMemo, type ReactNode } from 'react'
import './filter-table-layout.css'
import { resolveFilterTableExcelFilename } from './filter-table-excel-filename'
import {
  useTableExcelExport,
  type UseTableExcelExportOptions,
} from '@/shared/hooks/use-table-excel-export'
import { ExcelButton } from '@/shared/ui/excel-button'
import {
  TableFilterGroup,
  type FilterFieldConfig,
  type TableFilterGroupProps,
} from './table-filter-group'

export type { FilterFieldConfig, TableFilterGroupProps }

/** `FilterTableLayout` 엑셀 다운로드 — 파일명은 `title`에서 생성 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FilterTableExcelExportConfig<T extends object = any> = Omit<
  UseTableExcelExportOptions<T>,
  'filename'
>

export interface FilterTableLayoutProps extends TableFilterGroupProps {
  /** false면 `TableFilterGroup`·필터 하단 구분선을 숨김(캘린더 전용 뷰 등) */
  showFilter?: boolean
  /**
   * true(기본): 필드가 많거나 카드 폭이 좁을 때 flex-wrap으로 여러 줄 배치.
   * 조회 버튼은 우측 shell에 고정(입력란과 baseline 정렬). `mergedAutoFillInlineSearch`로 조회를 wrap 안에 넣을 수 있음.
   * `rows`(2행 이상)·`multiRowGridMode` 등을 직접 지정하면 해당 값이 우선합니다.
   */
  filterResponsiveWrap?: boolean
  /** 테이블 상단 제목 */
  title?: ReactNode
  /** false면 `title`을 툴바에 렌더하지 않음 (엑셀 파일명 등에는 `title` 값 그대로 사용 가능) */
  showTitle?: boolean
  /** 제목과 건수(description) 사이 보조 텍스트(JSX) */
  titleNote?: ReactNode
  /** 테이블 상단 보조 설명(건수 등) */
  description?: ReactNode
  /** 헤더 우측 버튼·액션 (엑셀 다운로드 버튼 좌측) */
  actions?: ReactNode
  /** true면 툴바 우측 엑셀 다운로드 버튼 숨김 (기본 false) */
  hideExcelDownload?: boolean
  /** 테이블 엑셀 export 설정 — `onExcelDownload` 없을 때 내부 훅으로 연결 */
  excelExport?: FilterTableExcelExportConfig
  /** 엑셀 다운로드 클릭 — `excelExport`보다 우선 */
  onExcelDownload?: () => void | Promise<void>
  excelDownloadLoading?: boolean
  excelDownloadDisabled?: boolean
  /** 구분선과 제목 사이에 노출할 상단 내비게이션(탭 등) */
  topNav?: ReactNode
  /** 필터·헤더 아래 테이블 본문 */
  children?: ReactNode
  className?: string
}

export function FilterTableLayout({
  showFilter = true,
  filterResponsiveWrap = true,
  title,
  showTitle = true,
  titleNote,
  description,
  actions,
  hideExcelDownload = false,
  excelExport,
  onExcelDownload,
  excelDownloadLoading,
  excelDownloadDisabled,
  topNav,
  children,
  className,
  multiRowGridMode,
  multiRowResponsiveLayout,
  mergedAutoFillInlineSearch,
  rows,
  ...tableFilterGroupRest
}: FilterTableLayoutProps) {
  const hasExplicitMultiRowLayout = rows != null && rows.length > 1
  const shouldApplyDefaultResponsiveWrap =
    showFilter && filterResponsiveWrap && !hasExplicitMultiRowLayout && multiRowGridMode === undefined

  const resolvedMultiRowGridMode =
    multiRowGridMode ?? (shouldApplyDefaultResponsiveWrap ? 'responsive' : 'fixed')
  const resolvedMultiRowResponsiveLayout =
    multiRowResponsiveLayout ?? (shouldApplyDefaultResponsiveWrap ? 'merged-auto-fill' : 'per-row')
  const resolvedMergedAutoFillInlineSearch =
    mergedAutoFillInlineSearch ?? false

  const rootClass = [
    'filter-table-layout',
    !showFilter && 'filter-table-layout--without-filter',
    shouldApplyDefaultResponsiveWrap && 'filter-table-layout--filter-responsive-wrap',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const excelFilename = useMemo(() => resolveFilterTableExcelFilename(title), [title])

  const { exportExcel, isExporting: isExcelExporting } = useTableExcelExport({
    columns: excelExport?.columns ?? [],
    data: excelExport?.data ?? [],
    filename: excelFilename,
    exporter: excelExport?.exporter,
    alertOnEmpty: excelExport?.alertOnEmpty,
    emptyAlertTitle: excelExport?.emptyAlertTitle,
    emptyAlertContent: excelExport?.emptyAlertContent,
    errorAlertTitle: excelExport?.errorAlertTitle,
    errorAlertContent: excelExport?.errorAlertContent,
  })

  const resolvedOnExcelDownload =
    onExcelDownload ?? (excelExport != null ? exportExcel : undefined)
  const resolvedExcelDownloadLoading = excelDownloadLoading ?? isExcelExporting

  const toolbarTitle = showTitle ? title : null
  const showExcelButton = !hideExcelDownload
  const showToolbarActions = actions != null || showExcelButton
  const showToolbar =
    toolbarTitle != null ||
    titleNote != null ||
    description != null ||
    actions != null ||
    showExcelButton

  return (
    <div className={rootClass}>
      {showFilter ? (
        <>
          <div className="filter-table-layout__filter">
            <TableFilterGroup
              {...tableFilterGroupRest}
              rows={rows}
              multiRowGridMode={resolvedMultiRowGridMode}
              multiRowResponsiveLayout={resolvedMultiRowResponsiveLayout}
              mergedAutoFillInlineSearch={resolvedMergedAutoFillInlineSearch}
            />
          </div>

          <div className="filter-table-layout__divider" role="separator" aria-hidden />
        </>
      ) : null}

      {topNav != null ? <div className="filter-table-layout__top-nav">{topNav}</div> : null}

      {showToolbar ? (
        <div className="filter-table-layout__toolbar">
          <div className="filter-table-layout__toolbar-main">
            {toolbarTitle != null ? (
              <div className="filter-table-layout__title">{toolbarTitle}</div>
            ) : null}
            {titleNote != null ? (
              <div className="filter-table-layout__title-note">{titleNote}</div>
            ) : null}
            {description != null ? (
              <div className="filter-table-layout__description">{description}</div>
            ) : null}
          </div>
          {showToolbarActions ? (
            <div className="filter-table-layout__toolbar-actions">
              {actions}
              {showExcelButton ? (
                <ExcelButton
                  onClick={resolvedOnExcelDownload}
                  loading={resolvedExcelDownloadLoading}
                  disabled={excelDownloadDisabled || resolvedOnExcelDownload == null}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="filter-table-layout__table">{children}</div>
    </div>
  )
}
