/**
 * 파일 다운로드 이력
 */

import { useCallback, useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  FileDownloadListFilter,
  FileDownloadLog,
} from '@/entities/file-download-log/model/types'
import {
  useExportFileDownloadLogs,
  useFileDownloadLogsList,
} from '@/features/file-download-log/api/hooks'
import { downloadCsv } from '@/features/logs/shared/lib/export-csv'
import { formatLogDateTime } from '@/features/logs/shared/lib/format-datetime'
import { LogResultToolbar } from '@/features/logs/shared/ui/log-result-toolbar'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  FILTER_SEARCH_BUTTON_WIDTH_PX,
} from '@/shared/constants/filter-field-width'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { useListFilterUrl } from '@/shared/lib/use-list-filter-url'
import type { TableSearchParamRule } from '@/shared/lib/use-table-search'
import {
  applyDateRangeToSearchParams,
  pendingDateRangeTupleEqual,
  resolvePendingDateRangeFromUrl,
  type PendingDateRange,
  type UrlDateRangePendingSyncRef,
} from '@/shared/lib/url-date-range-pending-sync'
import { CmsButton, CmsDateRangePicker, CmsInput, useCmsAlert } from '@/shared/ui'

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

const COL = {
  no: TABLE_COLUMN_WIDTHS.index,
  fileName: 280,
  userName: 140,
  downloadedAt: 180,
  ip: 140,
} as const

const EMPTY_TEXT = '검색 결과가 없습니다. 필터 조건을 변경해 주세요.'

export function FileDownloadLogPage() {
  const { showAlert } = useCmsAlert()

  const {
    pendingFilters,
    setPendingFilters,
    applied: appliedFilter,
    applySearch,
  } = useListFilterUrl<PendingFilters, FileDownloadListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
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
  const rows = listQuery.data?.rows ?? []
  const total = listQuery.data?.total ?? 0
  const loading = listQuery.isLoading || listQuery.isFetching

  const handleExcel = useCallback(() => {
    void exportMutation
      .mutateAsync(appliedFilter)
      .then(mode => {
        if (mode === 'use-local-csv') {
          downloadCsv({
            filenameBase: '파일_다운로드_이력',
            headers: ['No.', '다운로드 파일명', '사용자명', '다운로드 일시', 'IP'],
            rows: rows.map((row, index) => [
              total - index,
              row.fileName,
              row.userName,
              formatLogDateTime(row.downloadedAt),
              row.ip,
            ]),
          })
        }
      })
      .catch(() => {
        showAlert({
          title: '내보내기 실패',
          content: '엑셀 내보내기에 실패했습니다. 다시 시도해 주세요.',
        })
      })
  }, [appliedFilter, exportMutation, rows, showAlert, total])

  const columns = useMemo<ColumnsType<FileDownloadLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: COL.no,
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_v, _r, index) => total - index,
      },
      {
        title: '다운로드 파일명',
        dataIndex: 'fileName',
        key: 'fileName',
        width: COL.fileName,
        ellipsis: true,
      },
      {
        title: '사용자명',
        dataIndex: 'userName',
        key: 'userName',
        width: COL.userName,
        ellipsis: true,
      },
      {
        title: '다운로드 일시',
        dataIndex: 'downloadedAt',
        key: 'downloadedAt',
        width: COL.downloadedAt,
        render: (v: string) => formatLogDateTime(v),
      },
      {
        title: 'IP',
        dataIndex: 'ip',
        key: 'ip',
        width: COL.ip,
      },
    ],
    [total]
  )

  return (
    <div className="log-list-page">
      <div className="admin-list-card log-list-page__filter-card">
        <div className="admin-filter-area">
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <span className="admin-filter-area__label">파일명</span>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="파일명을 입력하세요"
              value={pendingFilters.fileName}
              onChange={e =>
                setPendingFilters(prev => ({ ...prev, fileName: e.target.value }))
              }
              onPressEnter={applySearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <span className="admin-filter-area__label">사용자명</span>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="사용자명을 입력하세요"
              value={pendingFilters.userName}
              onChange={e =>
                setPendingFilters(prev => ({ ...prev, userName: e.target.value }))
              }
              onPressEnter={applySearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--date-range">
            <span className="admin-filter-area__label">다운로드 일시</span>
            <CmsDateRangePicker
              inputSize="large"
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
          <div className="admin-filter-area__actions">
            <CmsButton
              className="admin-filter-area__search-button"
              variant="primary"
              size="large"
              type="button"
              width={FILTER_SEARCH_BUTTON_WIDTH_PX}
              onClick={applySearch}
            >
              조회
            </CmsButton>
          </div>
        </div>
      </div>

      <div className="admin-list-card log-list-page__result-card">
        <LogResultToolbar
          title="파일 다운로드 이력"
          total={total}
          onExcelDownload={handleExcel}
          excelDisabled={rows.length === 0}
        />

        <Table<FileDownloadLog>
          className="cms-data-table"
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={false}
          locale={{ emptyText: EMPTY_TEXT }}
          scroll={{
            x: COL.no + COL.fileName + COL.userName + COL.downloadedAt + COL.ip,
          }}
        />
      </div>
    </div>
  )
}
