/**
 * 개인정보 조회 이력
 */

import { useCallback, useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type { PiiAccessListFilter, PiiAccessLog } from '@/entities/pii-access-log/model/types'
import { useExportPiiAccessLogs, usePiiAccessLogsList } from '@/features/pii-access-log/api/hooks'
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
  filter.page = parseLogListPage(searchParams.get('pi_page'))
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
    patchSearchParams,
    hasActiveFilters,
  } = useListFilterUrl<PendingFilters, PiiAccessListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    afterApplyParams: nextParams => {
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
  const rows = listQuery.data?.rows ?? []
  const total = listQuery.data?.total ?? 0
  const page = appliedFilter.page ?? 0
  const loading = listQuery.isLoading || listQuery.isFetching

  const handlePageChange = useCallback(
    (nextPage: number) => {
      patchSearchParams(next => setLogListPageParam(next, 'pi_page', nextPage))
    },
    [patchSearchParams]
  )

  const handleExcel = useCallback(() => {
    void exportMutation.mutateAsync(appliedFilter).catch(() => {
      showAlert({
        title: '내보내기 실패',
        content: '엑셀 내보내기에 실패했습니다. 다시 시도해 주세요.',
      })
    })
  }, [appliedFilter, exportMutation, showAlert])

  const columns = useMemo<ColumnsType<PiiAccessLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: COL.no,
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_v, _r, index) => logListRowNumber(total, page, index),
      },
      {
        title: '조회 대상',
        dataIndex: 'targetName',
        key: 'targetName',
        width: COL.targetName,
        ellipsis: true,
      },
      {
        title: '조회 목적',
        dataIndex: 'purpose',
        key: 'purpose',
        width: COL.purpose,
        ellipsis: true,
      },
      {
        title: '조회자명',
        dataIndex: 'accessorName',
        key: 'accessorName',
        width: COL.accessorName,
        ellipsis: true,
      },
      {
        title: '조회 일시',
        dataIndex: 'accessedAt',
        key: 'accessedAt',
        width: COL.accessedAt,
        render: (v: string) => formatLogDateTime(v),
      },
      {
        title: 'IP',
        dataIndex: 'ip',
        key: 'ip',
        width: COL.ip,
      },
    ],
    [total, page]
  )

  return (
    <div className="log-list-page">
      <FilterTableLayout
        hasActiveFilters={hasActiveFilters}
        filter={
          <div className="admin-filter-area">
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
        actions={<ExcelButton onClick={handleExcel} empty={total === 0} />}
      >
        <CmsDataTable<PiiAccessLog>
          className="cms-data-table"
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={logTablePagination({ page, total, onChange: handlePageChange })}
          scroll={{
            x: COL.no + COL.targetName + COL.purpose + COL.accessorName + COL.accessedAt + COL.ip,
          }}
        />
      </FilterTableLayout>
    </div>
  )
}
