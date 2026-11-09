/**
 * 버그/이슈 이력
 */

import { useCallback, useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type { BugIssueListFilter, BugIssueLog } from '@/entities/bug-issue-log/model/types'
import { useBugIssueLogsList, useExportBugIssueLogs } from '@/features/bug-issue-log/api/hooks'
import { logExcelExportFailureAlert } from '@/features/logs/shared/lib/log-excel-export-alert'
import { formatLogDateTime } from '@/features/logs/shared/lib/format-datetime'
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
  errorMessage: 800,
  userName: 140,
  occurredAt: 180,
} as const

export function BugIssueLogPage() {
  const { showAlert } = useCmsAlert()

  const {
    pendingFilters,
    setPendingFilters,
    patchPendingFilters,
    applied: appliedFilter,
    applySearch,
    hasActiveFilters,
  } = useListFilterUrl<PendingFilters, BugIssueListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    afterApplyParams: nextParams => {
      // 무한 스크롤 전환 전 링크에 남은 페이지 번호 정리
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
  const rows = listQuery.rows
  const total = listQuery.totalCount

  const { sentinelRef } = useGatedInfiniteScroll({
    hasNextPage: listQuery.hasNextPage,
    isFetchingNextPage: listQuery.isFetchingNextPage,
    fetchNextPage: listQuery.fetchNextPage,
    resetKey: JSON.stringify(appliedFilter),
  })

  const handleExcel = useCallback(() => {
    if (exportMutation.isPending) return
    void exportMutation.mutateAsync(appliedFilter).catch((error: unknown) => {
      showAlert(logExcelExportFailureAlert(error))
    })
  }, [appliedFilter, exportMutation, showAlert])

  const columns = useMemo<ColumnsType<BugIssueLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: COL.no,
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_v, _r, index) => logListRowNumber(total, 0, index),
      },
      {
        title: '에러 메시지',
        dataIndex: 'errorMessage',
        key: 'errorMessage',
        // 유연 열: 넓은 화면에서 남는 폭 흡수 (CmsDataTable 정확 폭 모드)
        minWidth: COL.errorMessage,
        className: 'log-list-page__col--left log-list-page__col--error',
        ellipsis: true,
      },
      {
        title: '사용자명',
        dataIndex: 'userName',
        key: 'userName',
        width: COL.userName,
        className: 'log-list-page__col--user',
        ellipsis: true,
      },
      {
        title: '발생일시',
        dataIndex: 'occurredAt',
        key: 'occurredAt',
        width: COL.occurredAt,
        className: 'log-list-page__col--occurred',
        render: (v: string) => formatLogDateTime(v),
      },
    ],
    [total]
  )

  return (
    <div className="log-list-page">
      <FilterTableLayout
        hasActiveFilters={hasActiveFilters}
        filter={
          <div className="admin-filter-area">
            <div className="admin-filter-area__fields">
              <div className="admin-filter-area__field admin-filter-area__field--control">
                <span className="admin-filter-area__label">사용자명</span>
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
                <span className="admin-filter-area__label">발생일</span>
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
        title="버그/이슈 이력"
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
        <CmsDataTable<BugIssueLog>
          className="cms-data-table cms-data-table--skip-auto-no-col bug-issue-log-table"
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={listQuery.isLoading}
          pagination={false}
          scroll={{
            x: COL.no + COL.errorMessage + COL.userName + COL.occurredAt,
          }}
        />
        <AdminInfiniteTableFooter
          sentinelRef={sentinelRef}
          isFetchingNextPage={listQuery.isFetchingNextPage}
        />
      </FilterTableLayout>
    </div>
  )
}
