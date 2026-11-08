/**
 * 관리자 계정 처리 이력
 */

import { useCallback, useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import { formatAdminAccountActionLabel } from '@/entities/admin-account-log/lib/format-action-label'
import {
  ADMIN_ACCOUNT_ACTION_LABELS,
  ADMIN_ACCOUNT_ACTION_TYPES,
  type AdminAccountActionType,
  type AdminAccountListFilter,
  type AdminAccountLog,
} from '@/entities/admin-account-log/model/types'
import { displayLogField } from '@/features/logs/shared/lib/display-log-field'
import { LogListAccessDenied } from '@/features/logs/shared/ui/log-list-access-denied'
import { isAdminForbidden } from '@/features/system-inbox/lib/http-status'
import {
  useAdminAccountLogsList,
  useExportAdminAccountLogs,
} from '@/features/admin-account-log/api/hooks'
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
  CmsSelect,
  useCmsAlert,
  FilterTableLayout,
  ExcelButton,
} from '@/shared/ui'

import '@/features/logs/shared/ui/log-list-layout.css'

type PendingFilters = {
  name: string
  loginId: string
  actionType: AdminAccountActionType | ''
  range: PendingDateRange
}

const INITIAL_PENDING: PendingFilters = {
  name: '',
  loginId: '',
  actionType: '',
  range: null,
}

const rangeSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

function parseActionType(raw: string | null): AdminAccountActionType | '' {
  if (!raw) return ''
  return (ADMIN_ACCOUNT_ACTION_TYPES as readonly string[]).includes(raw)
    ? (raw as AdminAccountActionType)
    : ''
}

function parseApplied(searchParams: URLSearchParams): AdminAccountListFilter {
  const filter: AdminAccountListFilter = {}
  const name = (searchParams.get('aa_name') ?? '').trim()
  if (name) filter.name = name
  const loginId = (searchParams.get('aa_id') ?? '').trim()
  if (loginId) filter.loginId = loginId
  const actionType = parseActionType(searchParams.get('aa_action'))
  if (actionType) filter.actionType = actionType
  const from = searchParams.get('aa_from')
  const to = searchParams.get('aa_to')
  if (from) filter.from = from
  if (to) filter.to = to
  return filter
}

const searchSyncRules: readonly TableSearchParamRule<PendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'name',
    paramKey: 'aa_name',
    condition: f => f.name.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'loginId',
    paramKey: 'aa_id',
    condition: f => f.loginId.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'actionType',
    paramKey: 'aa_action',
    condition: f => f.actionType !== '',
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      applyDateRangeToSearchParams(nextParams, f.range, 'aa_from', 'aa_to')
    },
  },
]

function rangeAsPicker(period: PendingDateRange): [Dayjs | null, Dayjs | null] {
  if (!period) return [null, null]
  return [period[0] ?? null, period[1] ?? null]
}

const ACTION_OPTIONS = ADMIN_ACCOUNT_ACTION_TYPES.map(value => ({
  value,
  label: ADMIN_ACCOUNT_ACTION_LABELS[value],
}))

const COL = {
  no: TABLE_COLUMN_WIDTHS.index,
  name: 120,
  loginId: 220,
  action: 140,
  processedAt: 180,
  ip: 140,
} as const

export function AdminAccountLogPage() {
  const { showAlert } = useCmsAlert()

  const {
    pendingFilters,
    setPendingFilters,
    patchPendingFilters,
    applied: appliedFilter,
    applySearch,
    hasActiveFilters,
  } = useListFilterUrl<PendingFilters, AdminAccountListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    afterApplyParams: nextParams => {
      // 무한 스크롤 전환 전 링크에 남은 페이지 번호 정리
      nextParams.delete('aa_page')
    },
    syncPendingFromUrl: ({ searchParams, setPendingFilters: setPending }) => {
      const name = searchParams.get('aa_name') ?? ''
      const loginId = searchParams.get('aa_id') ?? ''
      const actionType = parseActionType(searchParams.get('aa_action'))
      const from = searchParams.get('aa_from')
      const to = searchParams.get('aa_to')

      setPending(prev => {
        const range = resolvePendingDateRangeFromUrl({
          ref: rangeSyncRef,
          from,
          to,
          prev: prev.range,
        }) as PendingDateRange

        const next: PendingFilters = { name, loginId, actionType, range }
        if (
          prev.name === next.name &&
          prev.loginId === next.loginId &&
          prev.actionType === next.actionType &&
          pendingDateRangeTupleEqual(prev.range, next.range)
        ) {
          return prev
        }
        return next
      })
    },
  })

  const listQuery = useAdminAccountLogsList(appliedFilter)
  const exportMutation = useExportAdminAccountLogs()
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
    void exportMutation.mutateAsync(appliedFilter).catch(() => {
      showAlert({
        title: '내보내기 실패',
        content: '엑셀 내보내기에 실패했습니다. 다시 시도해 주세요.',
      })
    })
  }, [appliedFilter, exportMutation, showAlert])

  const columns = useMemo<ColumnsType<AdminAccountLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: COL.no,
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_v, _r, index) => logListRowNumber(total, 0, index),
      },
      {
        title: '관리자명',
        dataIndex: 'name',
        key: 'name',
        width: COL.name,
        ellipsis: true,
        render: (v: string) => displayLogField(v),
      },
      {
        title: '아이디',
        dataIndex: 'loginId',
        key: 'loginId',
        width: COL.loginId,
        ellipsis: true,
        render: (v: string) => displayLogField(v),
      },
      {
        title: '내역',
        dataIndex: 'actionType',
        key: 'actionType',
        width: COL.action,
        render: (v: string) => formatAdminAccountActionLabel(v),
      },
      {
        title: '처리일시',
        dataIndex: 'processedAt',
        key: 'processedAt',
        width: COL.processedAt,
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
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <span className="admin-filter-area__label">관리자명</span>
              <AdminFilterTextInput
                inputSize="medium"
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                placeholder="관리자명을 입력해 주세요"
                value={pendingFilters.name}
                onChange={value => patchPendingFilters(prev => ({ ...prev, name: value }))}
                onPressEnter={applySearch}
              />
            </div>
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <span className="admin-filter-area__label">아이디</span>
              <AdminFilterTextInput
                inputSize="medium"
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                placeholder="아이디를 입력해 주세요"
                value={pendingFilters.loginId}
                onChange={value => patchPendingFilters(prev => ({ ...prev, loginId: value }))}
                onPressEnter={applySearch}
              />
            </div>
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <span className="admin-filter-area__label">내역</span>
              <CmsSelect
                inputSize="medium"
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                withAllOption
                value={pendingFilters.actionType}
                onChange={value =>
                  setPendingFilters(prev => ({
                    ...prev,
                    actionType: (value as AdminAccountActionType | '') ?? '',
                  }))
                }
                options={ACTION_OPTIONS}
                placeholder="전체"
              />
            </div>
            <div className="admin-filter-area__field admin-filter-area__field--date-range">
              <span className="admin-filter-area__label">처리일</span>
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
        title="관리자 계정 처리 이력"
        description={`총 ${total.toLocaleString('ko-KR')}건`}
        actions={<ExcelButton onClick={handleExcel} empty={total === 0} />}
      >
        <CmsDataTable<AdminAccountLog>
          className="cms-data-table"
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={listQuery.isLoading}
          pagination={false}
          scroll={{
            x: COL.no + COL.name + COL.loginId + COL.action + COL.processedAt + COL.ip,
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
