/**
 * 목록 페이지용 레이아웃: TableFilterGroup → 구분선 → 테이블 제목·설명·버튼(actions) → 테이블(children)
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
import { isFilterFieldPctWidth } from './table-filter-group-field-width'
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
   * true(기본): 픽셀/기본 폭 필드가 4개 이상일 때 flex-wrap으로 여러 줄 배치.
   * `%` 열 비율 필드는 Row 고정 배치(한 줄·조회 우측 shell). `mergedAutoFillInlineSearch` 미지정 시 4개 이상 wrap 화면은 true(조회·필드 같은 flex-wrap).
   * `rows`·`multiRowGridMode` 등을 직접 지정하면 해당 값이 우선합니다.
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
  /** 헤더 우측 버튼·액션 (엑셀 다운로드 버튼 좌측). 버튼 간격은 레이아웃에서 8px 고정 — 별도 gap 래퍼 불필요 */
  actions?: ReactNode
  /** 엑셀 다운로드 버튼 우측 액션 (예: 프로그램 신규 등록) */
  actionsAfterExcel?: ReactNode
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
  /**
   * `'calendar'` — `calendar-set` 본문 슬롯(`filter-table-layout__calendar-body`).
   * sticky·가로 overflow는 `filter-table-layout.css` + `layout-content`에서 처리.
   */
  contentVariant?: 'table' | 'calendar'
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
  actionsAfterExcel,
  hideExcelDownload = false,
  excelExport,
  onExcelDownload,
  excelDownloadLoading,
  excelDownloadDisabled,
  topNav,
  contentVariant = 'table',
  children,
  className,
  multiRowGridMode,
  multiRowResponsiveLayout,
  mergedAutoFillInlineSearch,
  rows,
  ...tableFilterGroupRest
}: FilterTableLayoutProps) {
  const hasExplicitRows = rows != null && rows.length > 0
  const singleRowFields = tableFilterGroupRest.fields ?? []
  const hasPctWidthFields = singleRowFields.some(isFilterFieldPctWidth)
  /**
   * `rows` 지정 화면·`%` 열 비율 필드는 Row+Col 고정 배치.
   * 픽셀/기본 폭 필드가 4개 이상일 때만 merged-auto-fill wrap 기본 적용.
   */
  const shouldApplyDefaultResponsiveWrap =
    showFilter &&
    filterResponsiveWrap &&
    !hasExplicitRows &&
    multiRowGridMode === undefined &&
    !hasPctWidthFields &&
    singleRowFields.length >= 4

  const resolvedMultiRowGridMode =
    multiRowGridMode ?? (shouldApplyDefaultResponsiveWrap ? 'responsive' : 'fixed')
  const resolvedMultiRowResponsiveLayout =
    multiRowResponsiveLayout ?? (shouldApplyDefaultResponsiveWrap ? 'merged-auto-fill' : 'per-row')
  /** 4개 이상 단일 행 wrap 시 조회를 필드와 같은 flex-wrap에 넣어 shell·필드 가로 겹침 방지 */
  const resolvedMergedAutoFillInlineSearch =
    mergedAutoFillInlineSearch ?? shouldApplyDefaultResponsiveWrap

  const rootClass = [
    'filter-table-layout',
    !showFilter && 'filter-table-layout--without-filter',
    shouldApplyDefaultResponsiveWrap && 'filter-table-layout--filter-responsive-wrap',
    contentVariant === 'calendar' && 'filter-table-layout--calendar-view',
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
  const showToolbarActions = actions != null || actionsAfterExcel != null || showExcelButton
  const showToolbar =
    toolbarTitle != null ||
    titleNote != null ||
    description != null ||
    actions != null ||
    actionsAfterExcel != null ||
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
              {actions != null ? (
                <div className="filter-table-layout__toolbar-actions-slot">{actions}</div>
              ) : null}
              {showExcelButton ? (
                <div className="filter-table-layout__toolbar-excel">
                  <ExcelButton
                    onClick={resolvedOnExcelDownload}
                    loading={resolvedExcelDownloadLoading}
                    disabled={excelDownloadDisabled || resolvedOnExcelDownload == null}
                  />
                </div>
              ) : null}
              {actionsAfterExcel != null ? (
                <div className="filter-table-layout__toolbar-actions-slot">{actionsAfterExcel}</div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="filter-table-layout__table">
        {contentVariant === 'calendar' ? (
          <div className="filter-table-layout__calendar-body">{children}</div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
