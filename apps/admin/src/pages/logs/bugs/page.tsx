/**
 * 버그/이슈 이력
 */

import { useCallback, useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  BugIssueListFilter,
  BugIssueLog,
} from '@/entities/bug-issue-log/model/types'
import {
  useBugIssueLogsList,
  useExportBugIssueLogs,
} from '@/features/bug-issue-log/api/hooks'
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
  userName: string
  range: PendingDateRange
}

const INITIAL_PENDING: PendingFilters = {
  userName: '',
  range: null,
}

const rangeSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

function parseApplied(searchParams: URLSearchParams): BugIssueListFilter {
  const filter: BugIssueListFilter = {}
  const userName = (searchParams.get('bg_user') ?? '').trim()
  if (userName) filter.userName = userName
  const from = searchParams.get('bg_from')
  const to = searchParams.get('bg_to')
  if (from) filter.from = from
  if (to) filter.to = to
  return filter
}

const searchSyncRules: readonly TableSearchParamRule<PendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'userName',
    paramKey: 'bg_user',
    condition: f => f.userName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      applyDateRangeToSearchParams(nextParams, f.range, 'bg_from', 'bg_to')
    },
  },
]

function rangeAsPicker(period: PendingDateRange): [Dayjs | null, Dayjs | null] {
  if (!period) return [null, null]
  return [period[0] ?? null, period[1] ?? null]
}

const COL = {
  no: TABLE_COLUMN_WIDTHS.index,
  errorMessage: 480,
  userName: 140,
  occurredAt: 180,
} as const

const EMPTY_TEXT = '검색 결과가 없습니다. 필터 조건을 변경해 주세요.'

export function BugIssueLogPage() {
  const { showAlert } = useCmsAlert()

  const {
    pendingFilters,
    setPendingFilters,
    applied: appliedFilter,
    applySearch,
  } = useListFilterUrl<PendingFilters, BugIssueListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    syncPendingFromUrl: ({ searchParams, setPendingFilters: setPending }) => {
      const userName = searchParams.get('bg_user') ?? ''
      const from = searchParams.get('bg_from')
      const to = searchParams.get('bg_to')

      setPending(prev => {
        const range = resolvePendingDateRangeFromUrl({
          ref: rangeSyncRef,
          from,
          to,
          prev: prev.range,
        }) as PendingDateRange

        const next: PendingFilters = { userName, range }
        if (
          prev.userName === next.userName &&
          pendingDateRangeTupleEqual(prev.range, next.range)
        ) {
          return prev
        }
        return next
      })
    },
  })

  const listQuery = useBugIssueLogsList(appliedFilter)
  const exportMutation = useExportBugIssueLogs()
  const rows = listQuery.data?.rows ?? []
  const total = listQuery.data?.total ?? 0
  const loading = listQuery.isLoading || listQuery.isFetching

  const handleExcel = useCallback(() => {
    void exportMutation
      .mutateAsync(appliedFilter)
      .then(mode => {
        if (mode === 'use-local-csv') {
          downloadCsv({
            filenameBase: '버그_이슈_이력',
            headers: ['No.', '에러 메시지', '사용자명', '발생일시'],
            rows: rows.map((row, index) => [
              total - index,
              row.errorMessage,
              row.userName,
              formatLogDateTime(row.occurredAt),
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

  const columns = useMemo<ColumnsType<BugIssueLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: COL.no,
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_v, _r, index) => total - index,
      },
      {
        title: '에러 메시지',
        dataIndex: 'errorMessage',
        key: 'errorMessage',
        width: COL.errorMessage,
        className: 'log-list-page__col--left',
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
        title: '발생일시',
        dataIndex: 'occurredAt',
        key: 'occurredAt',
        width: COL.occurredAt,
        render: (v: string) => formatLogDateTime(v),
      },
    ],
    [total]
  )

  return (
    <div className="log-list-page">
      <div className="admin-list-card log-list-page__filter-card">
        <div className="admin-filter-area">
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
            <span className="admin-filter-area__label">발생일시</span>
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
          title="버그/이슈 이력"
          total={total}
          onExcelDownload={handleExcel}
          excelDisabled={rows.length === 0}
        />

        <Table<BugIssueLog>
          className="cms-data-table"
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={false}
          locale={{ emptyText: EMPTY_TEXT }}
          scroll={{
            x: COL.no + COL.errorMessage + COL.userName + COL.occurredAt,
          }}
        />
      </div>
    </div>
  )
}
