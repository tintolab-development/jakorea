/**
 * 회원 로그인 이력
 */

import { useCallback, useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import type {
  MemberLoginAudience,
  MemberLoginListFilter,
  MemberLoginLog,
} from '@/entities/member-login-log/model/types'
import {
  useExportMemberLoginLogs,
  useMemberLoginLogsList,
} from '@/features/member-login-log/api/hooks'
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
  CmsTextTabs,
  useCmsAlert,
  FilterTableLayout,
  ExcelButton,
} from '@/shared/ui'

import '@/features/logs/shared/ui/log-list-layout.css'

type PendingFilters = {
  audience: MemberLoginAudience
  name: string
  loginId: string
  range: PendingDateRange
}

const INITIAL_PENDING: PendingFilters = {
  audience: 'admin',
  name: '',
  loginId: '',
  range: null,
}

const rangeSyncRef: UrlDateRangePendingSyncRef = { hadCompleteInUrl: false }

function parseAudience(raw: string | null): MemberLoginAudience {
  return raw === 'user' ? 'user' : 'admin'
}

function parseApplied(searchParams: URLSearchParams): MemberLoginListFilter {
  const filter: MemberLoginListFilter = {
    audience: parseAudience(searchParams.get('ml_aud')),
  }
  const name = (searchParams.get('ml_name') ?? '').trim()
  if (name) filter.name = name
  const loginId = (searchParams.get('ml_id') ?? '').trim()
  if (loginId) filter.loginId = loginId
  const from = searchParams.get('ml_from')
  const to = searchParams.get('ml_to')
  if (from) filter.from = from
  if (to) filter.to = to
  filter.page = parseLogListPage(searchParams.get('ml_page'))
  return filter
}

const searchSyncRules: readonly TableSearchParamRule<PendingFilters>[] = [
  {
    kind: 'param',
    filterKey: 'audience',
    paramKey: 'ml_aud',
    condition: f => f.audience === 'admin' || f.audience === 'user',
  },
  {
    kind: 'param',
    filterKey: 'name',
    paramKey: 'ml_name',
    condition: f => f.name.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'param',
    filterKey: 'loginId',
    paramKey: 'ml_id',
    condition: f => f.loginId.trim().length > 0,
    transform: v => String(v).trim(),
  },
  {
    kind: 'apply',
    apply: (nextParams, f) => {
      applyDateRangeToSearchParams(nextParams, f.range, 'ml_from', 'ml_to')
    },
  },
]

function rangeAsPicker(period: PendingDateRange): [Dayjs | null, Dayjs | null] {
  if (!period) return [null, null]
  return [period[0] ?? null, period[1] ?? null]
}

const TAB_ITEMS = [
  { key: 'admin' as const, label: '관리자' },
  { key: 'user' as const, label: '사용자' },
]

const COL = {
  no: TABLE_COLUMN_WIDTHS.index,
  name: 140,
  loginId: 240,
  loggedAt: 180,
  ip: 140,
} as const

const EMPTY_TEXT = '검색 결과가 없습니다. 필터 조건을 변경해 주세요.'

export function MemberLoginLogPage() {
  const { showAlert } = useCmsAlert()

  const {
    pendingFilters,
    setPendingFilters,
    patchPendingFilters,
    applied: appliedFilter,
    applySearch,
    setSearchParams,
    patchSearchParams,
  } = useListFilterUrl<PendingFilters, MemberLoginListFilter>({
    initialPending: INITIAL_PENDING,
    paramConfig: searchSyncRules,
    parseApplied,
    afterApplyParams: nextParams => {
      nextParams.delete('ml_page')
    },
    syncPendingFromUrl: ({ searchParams, setPendingFilters: setPending }) => {
      const audience = parseAudience(searchParams.get('ml_aud'))
      const name = searchParams.get('ml_name') ?? ''
      const loginId = searchParams.get('ml_id') ?? ''
      const from = searchParams.get('ml_from')
      const to = searchParams.get('ml_to')

      setPending(prev => {
        const range = resolvePendingDateRangeFromUrl({
          ref: rangeSyncRef,
          from,
          to,
          prev: prev.range,
        }) as PendingDateRange

        const next: PendingFilters = { audience, name, loginId, range }
        if (
          prev.audience === next.audience &&
          prev.name === next.name &&
          prev.loginId === next.loginId &&
          pendingDateRangeTupleEqual(prev.range, next.range)
        ) {
          return prev
        }
        return next
      })
    },
  })

  const audience = appliedFilter.audience
  const listQuery = useMemberLoginLogsList(appliedFilter)
  const exportMutation = useExportMemberLoginLogs()
  const rows = listQuery.data?.rows ?? []
  const total = listQuery.data?.total ?? 0
  const page = appliedFilter.page ?? 0
  const loading = listQuery.isLoading || listQuery.isFetching

  const nameLabel = audience === 'admin' ? '관리자명' : '사용자명'
  const namePlaceholder = audience === 'admin' ? '관리자명을 입력하세요' : '사용자명을 입력하세요'

  const handleTabChange = useCallback(
    (next: MemberLoginAudience) => {
      setPendingFilters({
        audience: next,
        name: '',
        loginId: '',
        range: null,
      })
      setSearchParams(
        () => {
          const params = new URLSearchParams()
          params.set('ml_aud', next)
          return params
        },
        { replace: true }
      )
    },
    [setPendingFilters, setSearchParams]
  )

  const handlePageChange = useCallback(
    (nextPage: number) => {
      patchSearchParams(next => setLogListPageParam(next, 'ml_page', nextPage))
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
          filenameBase: '회원_로그인_이력',
          headers: ['No.', nameLabel, '아이디', '로그인 일시', 'IP'],
          rows: all.map((row, index) => [
            all.length - index,
            row.name,
            row.loginId,
            formatLogDateTime(row.loggedAt),
            row.ip,
          ]),
        })
      })
      .catch(() => {
        showAlert({
          title: '내보내기 실패',
          content: '엑셀 내보내기에 실패했습니다. 다시 시도해 주세요.',
        })
      })
  }, [appliedFilter, exportMutation, nameLabel, showAlert])

  const columns = useMemo<ColumnsType<MemberLoginLog>>(
    () => [
      {
        title: 'No.',
        key: 'no',
        width: COL.no,
        className: CMS_TABLE_NO_COL_CLASS,
        render: (_v, _r, index) => logListRowNumber(total, page, index),
      },
      {
        title: nameLabel,
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
        title: '로그인 일시',
        dataIndex: 'loggedAt',
        key: 'loggedAt',
        width: COL.loggedAt,
        render: (v: string) => formatLogDateTime(v),
      },
      {
        title: 'IP',
        dataIndex: 'ip',
        key: 'ip',
        width: COL.ip,
      },
    ],
    [total, page, nameLabel]
  )

  return (
    <div className="log-list-page">
      <CmsTextTabs
        variant="list"
        activeKey={audience}
        onChange={handleTabChange}
        items={TAB_ITEMS}
        ariaLabel="회원 로그인 이력 대상"
        className="log-list-page__tabs"
      />

      <FilterTableLayout
        filter={
          <div className="admin-filter-area">
            <div className="admin-filter-area__field admin-filter-area__field--control">
              <span className="admin-filter-area__label">{nameLabel}</span>
              <AdminFilterTextInput
                inputSize="medium"
                width={FILTER_CONTROL_MAX_WIDTH_PX}
                placeholder={namePlaceholder}
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
                placeholder="아이디를 입력하세요"
                value={pendingFilters.loginId}
                onChange={value => patchPendingFilters(prev => ({ ...prev, loginId: value }))}
                onPressEnter={applySearch}
              />
            </div>
            <div className="admin-filter-area__field admin-filter-area__field--date-range">
              <span className="admin-filter-area__label">로그인 일시</span>
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
              <CmsButton className="admin-filter-area__search-button"
                variant="primary"
                size="medium"
                type="button"
                onClick={applySearch} >
                조회
              </CmsButton>
            </div>
          </div>
        }
        title="회원 로그인 이력"
        description={`총 ${total.toLocaleString('ko-KR')}건`}
        actions={<ExcelButton onClick={handleExcel} disabled={total === 0} />}
      >
        <CmsDataTable<MemberLoginLog>
          className="cms-data-table"
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={logTablePagination({ page, total, onChange: handlePageChange })}
          locale={{ emptyText: EMPTY_TEXT }}
          scroll={{ x: COL.no + COL.name + COL.loginId + COL.loggedAt + COL.ip }}
        />
      </FilterTableLayout>
    </div>
  )
}
