/**
 * 버그/이슈 이력
 */

import { useCallback, useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type { BugIssueListFilter, BugIssueLog } from '@/entities/bug-issue-log/model/types'
import { useBugIssueLogsList, useExportBugIssueLogs } from '@/features/bug-issue-log/api/hooks'
import { downloadCsv } from '@/features/logs/shared/lib/export-csv'
import { formatLogDateTime } from '@/features/logs/shared/lib/format-datetime'
import {
  logListRowNumber,
  logTablePagination,
  parseLogListPage,
  setLogListPageParam,
} from '@/features/logs/shared/lib/list-page'
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
import {
  CmsButton,
  CmsDateRangePicker,
  AdminFilterTextInput,
  useCmsAlert,
  FilterTableLayout,
  ExcelButton,
} from '@/shared/ui'

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
  filter.page = parseLogListPage(searchParams.get('bg_page'))
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
    patchPendingFilters,
    applied: appliedFilter,
    applySearch,
    patchSearchParams,
  } = useListFilterUrl<PendingFilters, BugIssueListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    afterApplyParams: nextParams => {
      nextParams.delete('bg_page')
    },
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
        if (prev.userName === next.userName && pendingDateRangeTupleEqual(prev.range, next.range)) {
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
  const page = appliedFilter.page ?? 0
  const loading = listQuery.isLoading || listQuery.isFetching

  const handlePageChange = useCallback(
    (nextPage: number) => {
      patchSearchParams(next => setLogListPageParam(next, 'bg_page', nextPage))
    },
    [patchSearchParams]
  )

  const handleExcel = useCallback(() => {
    void exportMutation
      .mutateAsync(appliedFilter)
      .then(result => {
        if (result === 'remote-downloaded') return
        const all = result.rows
        downloadCsv({
          filenameBase: '버그_이슈_이력',
          headers: ['No.', '에러 메시지', '사용자명', '발생일시'],
          rows: all.map((row, index) => [
            all.length - index,
            row.errorMessage,
            row.userName,
            formatLogDateTime(row.occurredAt),
          ]),
        })
      })
      .catch(() => {
        showAlert({
          title: '내보내기 실패',
          content: '엑셀 내보내기에 실패했습니다. 다시 시도해 주세요.',
        })
      })
  }, [appliedFilter, exportMutation, showAlert])

  const columns = useMemo<ColumnsType<BugIssueLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: COL.no,
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_v, _r, index) => logListRowNumber(total, page, index),
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
    [total, page]
  )

  return (
    <div className="log-list-page">
      <FilterTableLayout
        filter={
          <div className="admin-filter-area">
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <span className="admin-filter-area__label">사용자명</span>
              <AdminFilterTextInput
                inputSize="large"
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                placeholder="사용자명을 입력하세요"
                value={pendingFilters.userName}
                onChange={value => patchPendingFilters(prev => ({ ...prev, userName: value }))}
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
        }
        title="버그/이슈 이력"
        description={`총 ${total.toLocaleString('ko-KR')}건`}
        actions={<ExcelButton onClick={handleExcel} disabled={total === 0} />}
      >
        <CmsDataTable<BugIssueLog>
          className="cms-data-table"
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={logTablePagination({ page, total, onChange: handlePageChange })}
          locale={{ emptyText: EMPTY_TEXT }}
          scroll={{
            x: COL.no + COL.errorMessage + COL.userName + COL.occurredAt,
          }}
        />
      </FilterTableLayout>
    </div>
  )
}
