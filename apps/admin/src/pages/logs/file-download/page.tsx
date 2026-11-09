/**
 * 파일 다운로드 이력
 */

import { useCallback, useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type {
  FileDownloadListFilter,
  FileDownloadLog,
} from '@/entities/file-download-log/model/types'
import {
  useExportFileDownloadLogs,
  useFileDownloadLogsList,
} from '@/features/file-download-log/api/hooks'
import { displayLogField } from '@/features/logs/shared/lib/display-log-field'
import { logExcelExportFailureAlert } from '@/features/logs/shared/lib/log-excel-export-alert'
import { formatLogDateTime } from '@/features/logs/shared/lib/format-datetime'
import { LogListAccessDenied } from '@/features/logs/shared/ui/log-list-access-denied'
import { isAdminForbidden } from '@/features/system-inbox/lib/http-status'
import { logListRowNumber } from '@/features/logs/shared/lib/list-page'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useGatedInfiniteScroll } from '@/shared/hooks/use-gated-infinite-scroll'
import { useListFilterUrl } from '@/shared/lib/use-list-filter-url'
import type { TableSearchParamRule } from '@/shared/lib/use-table-search'
import {
  applyDateRangeToSearchParams,
  pendingDateRangeTupleEqual,
  resolvePendingDateRangeFromUrl,
  type PendingDateRange,
  type UrlDateRangePendingSyncRef,
} from '@/shared/lib/url-date-range-pending-sync'
import {
  AdminInfiniteTableFooter,
  CmsButton,
  CmsDateRangePicker,
  AdminFilterTextInput,
  useCmsAlert,
  FilterTableLayout,
  ExcelButton,
} from '@/shared/ui'

import '@/features/logs/shared/ui/log-list-layout.css'

type PendingFilters = {
  fileName: string
  userName: string
  range: PendingDateRange
}

const INITIAL_PENDING: PendingFilters = {
  fileName: '',
  userName: '',
  range: null,
}

const rangeSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

function parseApplied(searchParams: URLSearchParams): FileDownloadListFilter {
  const filter: FileDownloadListFilter = {}
  const fileName = (searchParams.get('fd_file') ?? '').trim()
  if (fileName) filter.fileName = fileName
  const userName = (searchParams.get('fd_user') ?? '').trim()
  if (userName) filter.userName = userName
  const from = searchParams.get('fd_from')
  const to = searchParams.get('fd_to')
  if (from) filter.from = from
  if (to) filter.to = to
  return filter
}

const searchSyncRules: readonly TableSearchParamRule<PendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'fileName',
    paramKey: 'fd_file',
    condition: f => f.fileName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'userName',
    paramKey: 'fd_user',
    condition: f => f.userName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      applyDateRangeToSearchParams(nextParams, f.range, 'fd_from', 'fd_to')
    },
  },
]

function rangeAsPicker(period: PendingDateRange): [Dayjs | null, Dayjs | null] {
  if (!period) return [null, null]
  return [period[0] ?? null, period[1] ?? null]
}

/** Figma 237:16282 — No. 80 · 파일명 618 · 사용자/일시/IP 각 280 */
const COL = {
  no: TABLE_COLUMN_WIDTHS.index,
  fileName: 618,
  userName: 280,
  downloadedAt: 280,
  ip: 280,
} as const

const TABLE_SCROLL_X = COL.no + COL.fileName + COL.userName + COL.downloadedAt + COL.ip

export function FileDownloadLogPage() {
  const { showAlert } = useCmsAlert()

  const {
    pendingFilters,
    setPendingFilters,
    patchPendingFilters,
    applied: appliedFilter,
    applySearch,
    hasActiveFilters,
  } = useListFilterUrl<PendingFilters, FileDownloadListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    afterApplyParams: nextParams => {
      // 무한 스크롤 전환 전 링크에 남은 페이지 번호 정리
      nextParams.delete('fd_page')
    },
    syncPendingFromUrl: ({ searchParams, setPendingFilters: setPending }) => {
      const fileName = searchParams.get('fd_file') ?? ''
      const userName = searchParams.get('fd_user') ?? ''
      const from = searchParams.get('fd_from')
      const to = searchParams.get('fd_to')

      setPending(prev => {
        const range = resolvePendingDateRangeFromUrl({
          ref: rangeSyncRef,
          from,
          to,
          prev: prev.range,
        }) as PendingDateRange

        const next: PendingFilters = { fileName, userName, range }
        if (
          prev.fileName === next.fileName &&
          prev.userName === next.userName &&
          pendingDateRangeTupleEqual(prev.range, next.range)
        ) {
          return prev
        }
        return next
      })
    },
  })

  const listQuery = useFileDownloadLogsList(appliedFilter)
  const exportMutation = useExportFileDownloadLogs()
  const rows = listQuery.rows
  const total = listQuery.totalCount

  const { sentinelRef } = useGatedInfiniteScroll({
    hasNextPage: listQuery.hasNextPage,
    isFetchingNextPage: listQuery.isFetchingNextPage,
    fetchNextPage: listQuery.fetchNextPage,
    resetKey: JSON.stringify(appliedFilter),
  })
  const forbidden = isAdminForbidden(listQuery.error)

  const handleExcel = useCallback(() => {
    if (exportMutation.isPending) return
    void exportMutation.mutateAsync(appliedFilter).catch((error: unknown) => {
      showAlert(logExcelExportFailureAlert(error))
    })
  }, [appliedFilter, exportMutation, showAlert])

  const columns = useMemo<ColumnsType<FileDownloadLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: COL.no,
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_v, _r, index) => logListRowNumber(total, 0, index),
      },
      {
        title: '다운로드 파일명',
        dataIndex: 'fileName',
        key: 'fileName',
        width: COL.fileName,
        ellipsis: true,
        render: (v: string) => displayLogField(v),
      },
      {
        title: '사용자',
        dataIndex: 'userName',
        key: 'userName',
        width: COL.userName,
        ellipsis: true,
        render: (v: string) => displayLogField(v),
      },
      {
        title: '다운로드 일시',
        dataIndex: 'downloadedAt',
        key: 'downloadedAt',
        width: COL.downloadedAt,
        render: (v: string) => (v?.trim() ? formatLogDateTime(v) : '-'),
      },
      {
        title: 'IP',
        dataIndex: 'ip',
        key: 'ip',
        width: COL.ip,
        render: (v: string) => displayLogField(v),
      },
    ],
    [total]
  )

  if (forbidden) {
    return <LogListAccessDenied />
  }

  return (
    <div className="log-list-page">
      <FilterTableLayout
        hasActiveFilters={hasActiveFilters}
        filter={
          <div className="admin-filter-area">
            <div className="admin-filter-area__fields">
              <div className="admin-filter-area__field admin-filter-area__field--control">
                <span className="admin-filter-area__label">다운로드 파일명</span>
                <AdminFilterTextInput
                  inputSize="medium"
                  width={FILTER_CONTROL_MAX_WIDTH_PX}
                  placeholder="파일명을 입력해 주세요"
                  value={pendingFilters.fileName}
                  onChange={value => patchPendingFilters(prev => ({ ...prev, fileName: value }))}
                  onPressEnter={applySearch}
                />
              </div>
              <div className="admin-filter-area__field admin-filter-area__field--control">
                <span className="admin-filter-area__label">사용자</span>
                <AdminFilterTextInput
                  inputSize="medium"
                  width={FILTER_CONTROL_MAX_WIDTH_PX}
                  placeholder="사용자명을 입력해 주세요"
                  value={pendingFilters.userName}
                  onChange={value => patchPendingFilters(prev => ({ ...prev, userName: value }))}
                  onPressEnter={applySearch}
                />
              </div>
              <div className="admin-filter-area__field admin-filter-area__field--date-range">
                <span className="admin-filter-area__label">다운로드일</span>
                <CmsDateRangePicker
                  inputSize="medium"
                  width={FILTER_CONTROL_WIDE_FIELD_WIDTH_PX}
                  value={rangeAsPicker(pendingFilters.range)}
                  onChange={dates =>
                    setPendingFilters(prev => ({
                      ...prev,
                      range: dates ?? null,
                    }))
                  }
                  placeholder={['시작일', '종료일']}
                />
              </div>
            </div>
            <div className="admin-filter-area__actions">
              <CmsButton
                className="admin-filter-area__search-button"
                variant="primary"
                size="medium"
                type="button"
                onClick={applySearch}
              >
                조회
              </CmsButton>
            </div>
          </div>
        }
        title="파일 다운로드 이력"
        description={`총 ${total.toLocaleString('ko-KR')}건`}
        actions={
          <ExcelButton
            onClick={handleExcel}
            empty={total === 0}
            loading={exportMutation.isPending}
            disabled={exportMutation.isPending}
          />
        }
      >
        <CmsDataTable<FileDownloadLog>
          className="cms-data-table"
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={listQuery.isLoading}
          pagination={false}
          scroll={{ x: TABLE_SCROLL_X }}
        />
        <AdminInfiniteTableFooter
          sentinelRef={sentinelRef}
          isFetchingNextPage={listQuery.isFetchingNextPage}
        />
      </FilterTableLayout>
    </div>
  )
}
