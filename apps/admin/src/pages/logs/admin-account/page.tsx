/**
 * 관리자 계정 처리 이력
 */

import { useCallback, useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ADMIN_ACCOUNT_ACTION_LABELS,
  ADMIN_ACCOUNT_ACTION_TYPES,
  type AdminAccountActionType,
  type AdminAccountListFilter,
  type AdminAccountLog,
} from '@/entities/admin-account-log/model/types'
import {
  useAdminAccountLogsList,
  useExportAdminAccountLogs,
} from '@/features/admin-account-log/api/hooks'
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
import {
  CmsButton,
  CmsDateRangePicker,
  CmsInput,
  CmsSelect,
  useCmsAlert,
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

const EMPTY_TEXT = '검색 결과가 없습니다. 필터 조건을 변경해 주세요.'

export function AdminAccountLogPage() {
  const { showAlert } = useCmsAlert()

  const {
    pendingFilters,
    setPendingFilters,
    applied: appliedFilter,
    applySearch,
  } = useListFilterUrl<PendingFilters, AdminAccountListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
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
  const rows = listQuery.data?.rows ?? []
  const total = listQuery.data?.total ?? 0
  const loading = listQuery.isLoading || listQuery.isFetching

  const handleExcel = useCallback(() => {
    void exportMutation
      .mutateAsync(appliedFilter)
      .then(mode => {
        if (mode === 'use-local-csv') {
          downloadCsv({
            filenameBase: '관리자_계정_처리_이력',
            headers: ['No.', '관리자명', '아이디', '내역', '처리일시', 'IP'],
            rows: rows.map((row, index) => [
              total - index,
              row.name,
              row.loginId,
              ADMIN_ACCOUNT_ACTION_LABELS[row.actionType],
              formatLogDateTime(row.processedAt),
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

  const columns = useMemo<ColumnsType<AdminAccountLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: COL.no,
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_v, _r, index) => total - index,
      },
      {
        title: '관리자명',
        dataIndex: 'name',
        key: 'name',
        width: COL.name,
        ellipsis: true,
      },
      {
        title: '아이디',
        dataIndex: 'loginId',
        key: 'loginId',
        width: COL.loginId,
        ellipsis: true,
      },
      {
        title: '내역',
        dataIndex: 'actionType',
        key: 'actionType',
        width: COL.action,
        render: (v: AdminAccountActionType) => ADMIN_ACCOUNT_ACTION_LABELS[v],
      },
      {
        title: '처리일시',
        dataIndex: 'processedAt',
        key: 'processedAt',
        width: COL.processedAt,
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
            <span className="admin-filter-area__label">관리자명</span>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="관리자명을 입력하세요"
              value={pendingFilters.name}
              onChange={e =>
                setPendingFilters(prev => ({ ...prev, name: e.target.value }))
              }
              onPressEnter={applySearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <span className="admin-filter-area__label">아이디</span>
            <CmsInput
              inputSize="large"
              width={FILTER_CONTROL_MAX_WIDTH_PX}
              placeholder="아이디를 입력하세요"
              value={pendingFilters.loginId}
              onChange={e =>
                setPendingFilters(prev => ({ ...prev, loginId: e.target.value }))
              }
              onPressEnter={applySearch}
            />
          </div>
          <div className="admin-filter-area__field admin-filter-area__field--control">
            <span className="admin-filter-area__label">내역</span>
            <CmsSelect
              inputSize="large"
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
            <span className="admin-filter-area__label">처리일시</span>
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
          title="관리자 계정 처리 이력"
          total={total}
          onExcelDownload={handleExcel}
          excelDisabled={rows.length === 0}
        />

        <Table<AdminAccountLog>
          className="cms-data-table"
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={false}
          locale={{ emptyText: EMPTY_TEXT }}
          scroll={{
            x:
              COL.no +
              COL.name +
              COL.loginId +
              COL.action +
              COL.processedAt +
              COL.ip,
          }}
        />
      </div>
    </div>
  )
}
