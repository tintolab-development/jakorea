/**
 * 개인정보 조회 이력
 */

import { useCallback, useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type { PiiAccessListFilter, PiiAccessLog } from '@/entities/pii-access-log/model/types'
import { useExportPiiAccessLogs, usePiiAccessLogsList } from '@/features/pii-access-log/api/hooks'
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
  targetName: string
  purpose: string
  accessorName: string
  range: PendingDateRange
}

const INITIAL_PENDING: PendingFilters = {
  targetName: '',
  purpose: '',
  accessorName: '',
  range: null,
}

const rangeSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

function parseApplied(searchParams: URLSearchParams): PiiAccessListFilter {
  const filter: PiiAccessListFilter = {}
  const targetName = (searchParams.get('pii_target') ?? '').trim()
  if (targetName) filter.targetName = targetName
  const purpose = (searchParams.get('pii_purpose') ?? '').trim()
  if (purpose) filter.purpose = purpose
  const accessorName = (searchParams.get('pii_admin') ?? '').trim()
  if (accessorName) filter.accessorName = accessorName
  const from = searchParams.get('pii_from')
  const to = searchParams.get('pii_to')
  if (from) filter.from = from
  if (to) filter.to = to
  return filter
}

const searchSyncRules: readonly TableSearchParamRule<PendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'targetName',
    paramKey: 'pii_target',
    condition: f => f.targetName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'purpose',
    paramKey: 'pii_purpose',
    condition: f => f.purpose.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'accessorName',
    paramKey: 'pii_admin',
    condition: f => f.accessorName.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      applyDateRangeToSearchParams(nextParams, f.range, 'pii_from', 'pii_to')
    },
  },
]

function rangeAsPicker(period: PendingDateRange): [Dayjs | null, Dayjs | null] {
  if (!period) return [null, null]
  return [period[0] ?? null, period[1] ?? null]
}

const COL = {
  no: TABLE_COLUMN_WIDTHS.index,
  targetName: 120,
  purpose: 260,
  accessorName: 140,
  accessedAt: 180,
  ip: 140,
} as const

export function PiiAccessLogPage() {
  const { showAlert } = useCmsAlert()

  const {
    pendingFilters,
    setPendingFilters,
    patchPendingFilters,
    applied: appliedFilter,
    applySearch,
    hasActiveFilters,
  } = useListFilterUrl<PendingFilters, PiiAccessListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    afterApplyParams: nextParams => {
      // 무한 스크롤 전환 전 링크에 남은 페이지 번호 정리
      nextParams.delete('pi_page')
    },
    syncPendingFromUrl: ({ searchParams, setPendingFilters: setPending }) => {
      const targetName = searchParams.get('pii_target') ?? ''
      const purpose = searchParams.get('pii_purpose') ?? ''
      const accessorName = searchParams.get('pii_admin') ?? ''
      const from = searchParams.get('pii_from')
      const to = searchParams.get('pii_to')

      setPending(prev => {
        const range = resolvePendingDateRangeFromUrl({
          ref: rangeSyncRef,
          from,
          to,
          prev: prev.range,
        }) as PendingDateRange

        const next: PendingFilters = { targetName, purpose, accessorName, range }
        if (
          prev.targetName === next.targetName &&
          prev.purpose === next.purpose &&
          prev.accessorName === next.accessorName &&
          pendingDateRangeTupleEqual(prev.range, next.range)
        ) {
          return prev
        }
        return next
      })
    },
  })

  const listQuery = usePiiAccessLogsList(appliedFilter)
  const exportMutation = useExportPiiAccessLogs()
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

  const columns = useMemo<ColumnsType<PiiAccessLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: COL.no,
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_v, _r, index) => logListRowNumber(total, 0, index),
      },
      {
        title: '조회 대상',
        dataIndex: 'targetName',
        key: 'targetName',
        width: COL.targetName,
        ellipsis: true,
        render: (v: string) => displayLogField(v),
      },
      {
        title: '조회 목적',
        dataIndex: 'purpose',
        key: 'purpose',
        width: COL.purpose,
        ellipsis: true,
        render: (v: string) => displayLogField(v),
      },
      {
        title: '조회자명',
        dataIndex: 'accessorName',
        key: 'accessorName',
        width: COL.accessorName,
        ellipsis: true,
        render: (v: string) => displayLogField(v),
      },
      {
        title: '조회 일시',
        dataIndex: 'accessedAt',
        key: 'accessedAt',
        width: COL.accessedAt,
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
                <span className="admin-filter-area__label">조회 목적</span>
                <AdminFilterTextInput
                  inputSize="medium"
                  width={FILTER_CONTROL_MAX_WIDTH_PX}
                  placeholder="조회 목적을 입력해 주세요"
                  value={pendingFilters.purpose}
                  onChange={value => patchPendingFilters(prev => ({ ...prev, purpose: value }))}
                  onPressEnter={applySearch}
                />
              </div>
              <div className="admin-filter-area__field admin-filter-area__field--control">
                <span className="admin-filter-area__label">조회자명</span>
                <AdminFilterTextInput
                  inputSize="medium"
                  width={FILTER_CONTROL_MAX_WIDTH_PX}
                  placeholder="조회자명을 입력해 주세요"
                  value={pendingFilters.accessorName}
                  onChange={value => patchPendingFilters(prev => ({ ...prev, accessorName: value }))}
                  onPressEnter={applySearch}
                />
              </div>
              <div className="admin-filter-area__field admin-filter-area__field--date-range">
                <span className="admin-filter-area__label">조회일</span>
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
        title="개인정보 조회 이력"
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
        <CmsDataTable<PiiAccessLog>
          className="cms-data-table"
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={listQuery.isLoading}
          pagination={false}
          scroll={{
            x: COL.no + COL.targetName + COL.purpose + COL.accessorName + COL.accessedAt + COL.ip,
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
